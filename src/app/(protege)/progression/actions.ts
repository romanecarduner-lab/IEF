"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";

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
