"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { estimerStatutDepuisObservations } from "@/lib/moteurProgression";

/**
 * Valide manuellement un statut de progression (flux existant, inchange
 * dans son fonctionnement pour le parent) -- mais alimente desormais la
 * tracabilite : origine = 'manuel', et un instantane des observations
 * actuelles est conserve dans syntheses_progression_sources, rattache a
 * cette entree precise de l'historique.
 *
 * Une validation manuelle efface toute proposition automatique en
 * attente : elle devient sans objet, le parent vient de trancher
 * lui-meme.
 */
export async function validerStatutProgression(
  parcoursId: string,
  elementProgrammeId: string,
  nouveauStatutCode: string,
  commentaire: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erreur: "Votre session a expiré. Merci de vous reconnecter." };
  }

  const { data: nouveauStatut } = await supabase
    .from("statuts_progression")
    .select("id, libelle")
    .eq("code", nouveauStatutCode)
    .maybeSingle();

  if (!nouveauStatut) {
    return { erreur: "Statut de progression introuvable." };
  }

  // Etat precedent (pour l'historique), s'il existe deja une synthese.
  const { data: syntheseExistante } = await supabase
    .from("syntheses_progression")
    .select("id, statuts_progression(libelle)")
    .eq("parcours_id", parcoursId)
    .eq("element_programme_id", elementProgrammeId)
    .maybeSingle();

  const ancienStatutLibelle = syntheseExistante
    ? Array.isArray(syntheseExistante.statuts_progression)
      ? syntheseExistante.statuts_progression[0]?.libelle
      : (syntheseExistante.statuts_progression as { libelle: string } | null)?.libelle
    : null;

  const maintenant = new Date().toISOString();

  const { data: synthese, error } = await supabase
    .from("syntheses_progression")
    .upsert(
      {
        parcours_id: parcoursId,
        element_programme_id: elementProgrammeId,
        statut_global_id: nouveauStatut.id,
        valide_par: user.id,
        valide_par_nom_affiche: user.email ?? "Parent",
        valide_le: maintenant,
        origine: "manuel",
        derniere_prise_en_compte_le: maintenant,
        // Une decision manuelle rend toute proposition automatique en
        // attente sans objet : le parent vient de trancher lui-meme.
        statut_propose_id: null,
        justification_proposition: null,
        propose_le: null,
        proposition_ignoree_le: null,
        proposition_ignoree_jusqua_observation_le: null,
      },
      { onConflict: "parcours_id,element_programme_id" }
    )
    .select("id")
    .single();

  if (error || !synthese) {
    return { erreur: "Impossible d'enregistrer ce statut. Merci de réessayer." };
  }

  const { data: entreeHistorique } = await supabase
    .from("historique_progression")
    .insert({
      synthese_id: synthese.id,
      ancien_statut: ancienStatutLibelle,
      nouveau_statut: nouveauStatut.libelle,
      change_par: user.id,
      change_par_nom_affiche: user.email ?? "Parent",
      commentaire: commentaire || null,
      origine: "manuel",
    })
    .select("id")
    .single();

  // Instantane des observations actuelles, rattache a ce changement
  // precis. Non bloquant : si cette partie echoue, le statut est deja
  // enregistre, on ne fait pas echouer toute l'action pour autant.
  if (entreeHistorique) {
    try {
      const { data: observations } = await supabase
        .from("observations_elements_programme")
        .select(
          `id, activite_id, justification,
           niveaux_autonomie(libelle),
           activites!inner(parcours_id, titre, date_activite, contextes_activite(libelle))`
        )
        .eq("element_programme_id", elementProgrammeId)
        .eq("activites.parcours_id", parcoursId);

      if (observations && observations.length > 0) {
        const lignes = observations.map((o) => {
          const activite = Array.isArray(o.activites) ? o.activites[0] : o.activites;
          const contexte = activite
            ? Array.isArray(activite.contextes_activite)
              ? activite.contextes_activite[0]
              : activite.contextes_activite
            : null;
          const niveau = Array.isArray(o.niveaux_autonomie)
            ? o.niveaux_autonomie[0]
            : o.niveaux_autonomie;

          return {
            historique_id: entreeHistorique.id,
            synthese_id: synthese.id,
            observation_id: o.id,
            activite_id: o.activite_id,
            snapshot_activite_titre: (activite?.titre as string) ?? "Activité",
            snapshot_date_observation: activite?.date_activite as string,
            snapshot_niveau_autonomie: (niveau?.libelle as string) ?? "Non précisé",
            snapshot_contexte: (contexte?.libelle as string | undefined) ?? null,
            snapshot_justification: (o.justification as string | null) ?? null,
          };
        });

        await supabase.from("syntheses_progression_sources").insert(lignes);
      }
    } catch (erreurTracabilite) {
      console.error(
        "Erreur non bloquante lors de l'enregistrement des sources de progression",
        erreurTracabilite
      );
    }
  }

  revalidatePath("/progression");
  return { ok: true };
}

/**
 * Etape 3 du chantier "progression automatique" : applique le moteur
 * deterministe (src/lib/moteurProgression.ts) a une competence precise.
 *
 * Cette action est pour l'instant declenchee manuellement (bouton de
 * test) -- le declenchement automatique apres chaque activite viendra a
 * l'etape 6. Elle respecte deja les regles de protection prevues :
 * - si aucune synthese n'existe, ou si la synthese active est elle-meme
 *   d'origine automatique, le moteur peut mettre a jour le statut
 *   directement ;
 * - si le statut actif est d'origine manuelle, le moteur ne le modifie
 *   jamais : il ecrit une proposition en attente, que le parent devra
 *   valider explicitement (etape 4) ;
 * - une proposition deja ignoree ne revient pas tant qu'aucune
 *   observation plus recente que l'ignorance n'a ete ajoutee.
 */
export async function estimerProgressionAutomatique(
  parcoursId: string,
  elementProgrammeId: string
): Promise<
  | { erreur: string }
  | { concluant: false; raison: string }
  | {
      concluant: true;
      statutLibelle: string;
      niveauConfiance: string;
      justification: string;
      appliqueDirectement: boolean;
      propositionEnregistree: boolean;
    }
> {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erreur: "Votre session a expiré. Merci de vous reconnecter." };
  }

  const { data: observationsBrutes } = await supabase
    .from("observations_elements_programme")
    .select(
      "niveaux_autonomie(code, ordre), activites!inner(parcours_id, date_activite, contexte_id)"
    )
    .eq("element_programme_id", elementProgrammeId)
    .eq("activites.parcours_id", parcoursId);

  const observations = (observationsBrutes ?? [])
    .map((o) => {
      const niveau = Array.isArray(o.niveaux_autonomie)
        ? o.niveaux_autonomie[0]
        : o.niveaux_autonomie;
      const activite = Array.isArray(o.activites) ? o.activites[0] : o.activites;
      return {
        niveauCode: (niveau?.code as string) ?? "",
        niveauOrdre: (niveau?.ordre as number) ?? 0,
        date: (activite?.date_activite as string) ?? "",
        contexteCode: (activite?.contexte_id as string) ?? "",
      };
    })
    .filter((o) => o.niveauCode && o.date);

  const resultat = estimerStatutDepuisObservations(observations);

  if (!resultat.concluant) {
    return { concluant: false, raison: resultat.raison };
  }

  const { data: statutCible } = await supabase
    .from("statuts_progression")
    .select("id, libelle")
    .eq("code", resultat.statutCode)
    .maybeSingle();

  if (!statutCible) {
    return { erreur: "Statut de progression introuvable." };
  }

  const { data: syntheseExistante } = await supabase
    .from("syntheses_progression")
    .select(
      "id, statut_global_id, origine, statuts_progression(code), proposition_ignoree_jusqua_observation_le"
    )
    .eq("parcours_id", parcoursId)
    .eq("element_programme_id", elementProgrammeId)
    .maybeSingle();

  const maintenant = new Date().toISOString();
  const derniereDateObservation = observations
    .map((o) => o.date)
    .sort()
    .at(-1);

  // --- Cas 1 : aucune synthese existante -> creation directe ---
  if (!syntheseExistante) {
    const { data: nouvelleSynthese, error } = await supabase
      .from("syntheses_progression")
      .insert({
        parcours_id: parcoursId,
        element_programme_id: elementProgrammeId,
        statut_global_id: statutCible.id,
        valide_par: user.id,
        valide_par_nom_affiche: "Estimation automatique",
        valide_le: maintenant,
        origine: "automatique",
        niveau_confiance: resultat.niveauConfiance,
        derniere_prise_en_compte_le: maintenant,
      })
      .select("id")
      .single();

    if (error?.code === "23505") {
      // Une synthese a ete creee entre notre lecture et notre ecriture
      // (ex. deux clics rapproches) : on relance simplement l'estimation,
      // elle passera cette fois par le cas "synthese existante".
      return estimerProgressionAutomatique(parcoursId, elementProgrammeId);
    }

    if (error || !nouvelleSynthese) {
      console.error("Erreur lors de la creation de la synthese (estimation automatique)", error);
      return {
        erreur: `Impossible d'enregistrer l'estimation : ${error?.message ?? "erreur inconnue"}`,
      };
    }

    await supabase.from("historique_progression").insert({
      synthese_id: nouvelleSynthese.id,
      ancien_statut: null,
      nouveau_statut: statutCible.libelle,
      change_par: null,
      change_par_nom_affiche: "Estimation automatique",
      commentaire: resultat.justification,
      origine: "automatique",
    });

    revalidatePath("/progression");
    return {
      concluant: true,
      statutLibelle: statutCible.libelle,
      niveauConfiance: resultat.niveauConfiance,
      justification: resultat.justification,
      appliqueDirectement: true,
      propositionEnregistree: false,
    };
  }

  const statutActuelCode = Array.isArray(syntheseExistante.statuts_progression)
    ? syntheseExistante.statuts_progression[0]?.code
    : (syntheseExistante.statuts_progression as { code: string } | null)?.code;

  const dejaAJour = statutActuelCode === resultat.statutCode;

  // --- Cas 2 : synthese existante, d'origine automatique -> mise a jour directe ---
  if (syntheseExistante.origine === "automatique") {
    if (dejaAJour) {
      await supabase
        .from("syntheses_progression")
        .update({ derniere_prise_en_compte_le: maintenant, niveau_confiance: resultat.niveauConfiance })
        .eq("id", syntheseExistante.id);

      revalidatePath("/progression");
      return {
        concluant: true,
        statutLibelle: statutCible.libelle,
        niveauConfiance: resultat.niveauConfiance,
        justification: resultat.justification,
        appliqueDirectement: true,
        propositionEnregistree: false,
      };
    }

    await supabase
      .from("syntheses_progression")
      .update({
        statut_global_id: statutCible.id,
        valide_le: maintenant,
        niveau_confiance: resultat.niveauConfiance,
        derniere_prise_en_compte_le: maintenant,
      })
      .eq("id", syntheseExistante.id);

    await supabase.from("historique_progression").insert({
      synthese_id: syntheseExistante.id,
      ancien_statut: statutActuelCode ?? null,
      nouveau_statut: statutCible.libelle,
      change_par: null,
      change_par_nom_affiche: "Estimation automatique",
      commentaire: resultat.justification,
      origine: "automatique",
    });

    revalidatePath("/progression");
    return {
      concluant: true,
      statutLibelle: statutCible.libelle,
      niveauConfiance: resultat.niveauConfiance,
      justification: resultat.justification,
      appliqueDirectement: true,
      propositionEnregistree: false,
    };
  }

  // --- Cas 3 : statut actif d'origine manuelle -> jamais ecrase directement ---
  if (dejaAJour) {
    // Le statut manuel correspond deja a l'estimation : rien a proposer,
    // et on efface une eventuelle proposition devenue obsolete.
    await supabase
      .from("syntheses_progression")
      .update({
        statut_propose_id: null,
        justification_proposition: null,
        propose_le: null,
      })
      .eq("id", syntheseExistante.id);

    revalidatePath("/progression");
    return {
      concluant: true,
      statutLibelle: statutCible.libelle,
      niveauConfiance: resultat.niveauConfiance,
      justification: "Le statut validé manuellement correspond déjà à cette estimation.",
      appliqueDirectement: false,
      propositionEnregistree: false,
    };
  }

  const ignoreeJusqua = syntheseExistante.proposition_ignoree_jusqua_observation_le as
    | string
    | null;
  if (
    ignoreeJusqua &&
    derniereDateObservation &&
    new Date(derniereDateObservation) <= new Date(ignoreeJusqua)
  ) {
    return {
      concluant: true,
      statutLibelle: statutCible.libelle,
      niveauConfiance: resultat.niveauConfiance,
      justification:
        "Cette proposition avait déjà été ignorée et aucune observation plus récente n'a été ajoutée depuis.",
      appliqueDirectement: false,
      propositionEnregistree: false,
    };
  }

  await supabase
    .from("syntheses_progression")
    .update({
      statut_propose_id: statutCible.id,
      justification_proposition: resultat.justification,
      propose_le: maintenant,
    })
    .eq("id", syntheseExistante.id);

  revalidatePath("/progression");
  return {
    concluant: true,
    statutLibelle: statutCible.libelle,
    niveauConfiance: resultat.niveauConfiance,
    justification: resultat.justification,
    appliqueDirectement: false,
    propositionEnregistree: true,
  };
}
