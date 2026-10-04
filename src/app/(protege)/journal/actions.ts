"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Coeur commun : trouve le parcours d'un enfant dont l'annee couvre la
 * date donnee. Reutilise a la fois pour corriger le parcours d'une
 * activite existante (meme enfant) et pour resoudre le bon parcours
 * d'un AUTRE enfant lors d'une duplication.
 */
async function resoudreParcoursPourEnfantEtDate(
  supabase: SupabaseClient,
  enfantId: string,
  dateActivite: string
): Promise<{ parcoursId: string } | { erreur: string }> {
  const { data: candidats } = await supabase
    .from("parcours_scolaires")
    .select("id, annees_scolaires!inner(date_debut, date_fin)")
    .eq("enfant_id", enfantId)
    .lte("annees_scolaires.date_debut", dateActivite)
    .gte("annees_scolaires.date_fin", dateActivite)
    .limit(1);

  if (candidats && candidats.length > 0 && candidats[0]) {
    return { parcoursId: candidats[0].id as string };
  }

  const { data: enfant } = await supabase
    .from("enfants")
    .select("prenom")
    .eq("id", enfantId)
    .maybeSingle();

  return {
    erreur: `Aucune année scolaire n'existe pour ${
      enfant?.prenom ?? "cet enfant"
    } couvrant cette date. Créez-la depuis "Famille" avant d'enregistrer.`,
  };
}

/**
 * L'annee scolaire d'une activite doit toujours correspondre a sa date
 * reelle (1er septembre au 31 aout suivant), jamais au parcours choisi
 * manuellement -- utile notamment quand une nouvelle annee est creee
 * apres coup. Retourne le parcours_id a utiliser reellement (peut
 * differer de p_parcoursActuelId si la date ne correspond plus), ou une
 * erreur si aucun parcours n'existe pour le bon enfant sur la bonne
 * annee (on ne devine jamais un cycle, l'utilisatrice doit le creer).
 */
async function resoudreParcoursPourDate(
  supabase: SupabaseClient,
  parcoursActuelId: string,
  dateActivite: string
): Promise<{ parcoursId: string } | { erreur: string }> {
  const { data: actuel } = await supabase
    .from("parcours_scolaires")
    .select("enfant_id, annees_scolaires(date_debut, date_fin)")
    .eq("id", parcoursActuelId)
    .maybeSingle();

  if (!actuel) return { erreur: "Parcours introuvable." };

  const anneeActuelle = Array.isArray(actuel.annees_scolaires)
    ? actuel.annees_scolaires[0]
    : actuel.annees_scolaires;

  if (
    anneeActuelle &&
    dateActivite >= (anneeActuelle.date_debut as string) &&
    dateActivite <= (anneeActuelle.date_fin as string)
  ) {
    return { parcoursId: parcoursActuelId };
  }

  return resoudreParcoursPourEnfantEtDate(supabase, actuel.enfant_id as string, dateActivite);
}

export type DonneesActivite = {
  idLocal: string;
  parcoursId: string;
  dateActivite: string;
  titre: string;
  description: string;
  contexteId: string;
  lieu: string;
  observations: string;
  parolesEnfant: string;
  personnesPresentes: string;
};

export type ResultatCreationActivite = { erreur: string } | { id: string };

/**
 * Appelée directement depuis le composant client (pas via <form action>),
 * pour garder le contrôle fin nécessaire à la gestion du brouillon local
 * (IndexedDB) : synchronisation uniquement après confirmation du serveur,
 * jamais avant (voir Corrections-Schema-et-Lot1.md, section 12).
 *
 * Le statut de la fiche demarre directement a "valide" : enregistrer
 * l'activite vaut validation, sans etape separee a refaire ensuite (le
 * badge de statut sur le Journal reste disponible pour repasser une
 * fiche en brouillon si besoin, mais ce n'est plus l'etat de depart).
 */
export async function creerActivite(
  donnees: DonneesActivite
): Promise<ResultatCreationActivite> {
  const manquants: string[] = [];
  if (!donnees.parcoursId) manquants.push("l'enfant / l'année");
  if (!donnees.dateActivite) manquants.push("la date");
  if (!donnees.contexteId) manquants.push("le contexte");
  if (!donnees.titre.trim()) manquants.push("le titre");
  if (manquants.length > 0) {
    return { erreur: `Il manque : ${manquants.join(", ")}.` };
  }

  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erreur: "Votre session a expiré. Merci de vous reconnecter." };
  }

  const { data: statut } = await supabase
    .from("statuts_activite")
    .select("id")
    .eq("code", "valide")
    .maybeSingle();

  if (!statut) {
    return { erreur: "Statut d'activité introuvable." };
  }

  const resolution = await resoudreParcoursPourDate(
    supabase,
    donnees.parcoursId,
    donnees.dateActivite
  );
  if ("erreur" in resolution) return resolution;

  const { error } = await supabase.from("activites").insert({
    id: donnees.idLocal,
    parcours_id: resolution.parcoursId,
    auteur_id: user.id,
    auteur_nom_affiche: user.email ?? "Parent",
    date_activite: donnees.dateActivite,
    titre: donnees.titre.trim(),
    description: donnees.description || null,
    contexte_id: donnees.contexteId,
    lieu: donnees.lieu || null,
    observations: donnees.observations || null,
    paroles_enfant: donnees.parolesEnfant || null,
    personnes_presentes: donnees.personnesPresentes || null,
    statut_id: statut.id,
  });

  if (error) {
    console.error("Erreur lors de l'insertion de l'activite", error);
    return {
      erreur: `Impossible d'enregistrer cette activité (${error.message || error.code || "erreur inconnue"}). Merci de réessayer.`,
    };
  }

  revalidatePath("/journal");
  return { id: donnees.idLocal };
}

export type DonneesModificationActivite = {
  dateActivite: string;
  titre: string;
  description: string;
  contexteId: string;
  lieu: string;
  observations: string;
  parolesEnfant: string;
  personnesPresentes: string;
};

export async function modifierActivite(
  id: string,
  donnees: DonneesModificationActivite
): Promise<{ erreur: string } | { ok: true }> {
  const manquants: string[] = [];
  if (!donnees.dateActivite) manquants.push("la date");
  if (!donnees.contexteId) manquants.push("le contexte");
  if (!donnees.titre.trim()) manquants.push("le titre");
  if (manquants.length > 0) {
    return { erreur: `Il manque : ${manquants.join(", ")}.` };
  }

  const supabase = creerClientServeur();

  const { data: activiteActuelle } = await supabase
    .from("activites")
    .select("parcours_id")
    .eq("id", id)
    .maybeSingle();

  if (!activiteActuelle) {
    return { erreur: "Activité introuvable." };
  }

  const resolution = await resoudreParcoursPourDate(
    supabase,
    activiteActuelle.parcours_id as string,
    donnees.dateActivite
  );
  if ("erreur" in resolution) return resolution;

  const { error } = await supabase
    .from("activites")
    .update({
      parcours_id: resolution.parcoursId,
      date_activite: donnees.dateActivite,
      titre: donnees.titre.trim(),
      description: donnees.description || null,
      contexte_id: donnees.contexteId,
      lieu: donnees.lieu || null,
      observations: donnees.observations || null,
      paroles_enfant: donnees.parolesEnfant || null,
      personnes_presentes: donnees.personnesPresentes || null,
    })
    .eq("id", id);

  if (error) {
    return { erreur: "Impossible d'enregistrer les modifications. Merci de réessayer." };
  }

  revalidatePath("/journal");
  revalidatePath(`/journal/${id}`);
  revalidatePath(`/journal/${id}/modifier`);
  return { ok: true };
}

export async function supprimerActivite(id: string) {
  const supabase = creerClientServeur();
  await supabase.from("activites").delete().eq("id", id);
  revalidatePath("/journal");
}

export async function basculerFavori(id: string, valeurActuelle: boolean) {
  const supabase = creerClientServeur();
  await supabase.from("activites").update({ favori: !valeurActuelle }).eq("id", id);
  revalidatePath("/journal");
}

export async function basculerStatutActivite(id: string, statutActuelCode: string) {
  const nouveauCode = statutActuelCode === "valide" ? "brouillon" : "valide";
  const supabase = creerClientServeur();

  const { data: statut } = await supabase
    .from("statuts_activite")
    .select("id")
    .eq("code", nouveauCode)
    .maybeSingle();

  if (!statut) return;

  await supabase.from("activites").update({ statut_id: statut.id }).eq("id", id);
  revalidatePath("/journal");
  revalidatePath(`/journal/${id}`);
}

/**
 * Met a jour uniquement le champ Observations d'une activite -- utilise
 * par la regeneration de la formulation pedagogique depuis la page
 * "Competences observees", pour eviter de devoir passer par le
 * formulaire de modification complet juste pour ce champ.
 */
export async function modifierObservationsActivite(
  activiteId: string,
  texte: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();

  const { error } = await supabase
    .from("activites")
    .update({ observations: texte || null })
    .eq("id", activiteId);

  if (error) {
    console.error("Erreur lors de la mise à jour des observations", error);
    return { erreur: `Impossible d'enregistrer : ${error.message}` };
  }

  revalidatePath(`/journal/${activiteId}`);
  revalidatePath(`/journal/${activiteId}/competences`);
  revalidatePath(`/journal/${activiteId}/modifier`);
  return { ok: true };
}

/**
 * Duplique une activite pour un autre enfant (parcours). Le titre, la
 * description et les traces (photos, sans re-televersement -- meme
 * fichier de stockage reutilise) sont copies. Les compétences ne sont
 * JAMAIS copiees, meme si les deux enfants sont au meme cycle : le
 * parent doit toujours les choisir separement pour chaque enfant,
 * plutot que de risquer une attribution automatique inexacte. Les
 * observations libres, paroles d'enfant et personnes presentes ne
 * sont pas copiees non plus, pour rester propres a chaque enfant des
 * la creation. Le nouveau statut repart toujours a "brouillon", pour
 * que le parent sache qu'il reste a completer.
 */
/**
 * Duplique une activite pour un autre enfant. Prend un enfant (pas un
 * parcours precis) : le bon parcours de cet enfant est resolu
 * automatiquement d'apres la date reelle de l'activite source, comme
 * pour la creation normale -- pour ne jamais proposer de choisir entre
 * plusieurs annees du meme enfant (ca n'aurait pas de sens, dupliquer
 * "pour un autre enfant" concerne justement un enfant different).
 */
export async function dupliquerActiviteVersParcours(
  activiteSourceId: string,
  enfantCibleId: string
): Promise<{ erreur: string } | { id: string }> {
  const supabase = creerClientServeur();

  const { data: source } = await supabase
    .from("activites")
    .select("titre, description, date_activite, contexte_id, lieu")
    .eq("id", activiteSourceId)
    .maybeSingle();

  if (!source) return { erreur: "Activité source introuvable." };

  const resolution = await resoudreParcoursPourEnfantEtDate(
    supabase,
    enfantCibleId,
    source.date_activite as string
  );
  if ("erreur" in resolution) return resolution;
  const parcoursCibleId = resolution.parcoursId;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Votre session a expiré. Merci de vous reconnecter." };

  const { data: statut } = await supabase
    .from("statuts_activite")
    .select("id")
    .eq("code", "brouillon")
    .maybeSingle();
  if (!statut) return { erreur: "Statut d'activité introuvable." };

  const { data: nouvelleActivite, error: erreurCreation } = await supabase
    .from("activites")
    .insert({
      parcours_id: parcoursCibleId,
      auteur_id: user.id,
      auteur_nom_affiche: user.email ?? "Parent",
      date_activite: source.date_activite,
      titre: source.titre,
      description: source.description,
      contexte_id: source.contexte_id,
      lieu: source.lieu,
      statut_id: statut.id,
    })
    .select("id")
    .single();

  if (erreurCreation || !nouvelleActivite) {
    return { erreur: "Impossible de dupliquer cette activité. Merci de réessayer." };
  }

  // Traces : nouvelles lignes reliees au meme fichier de stockage, pas de
  // re-televersement -- la politique de stockage ne verifie que
  // l'appartenance a la famille, pas l'activite precise.
  const { data: traces } = await supabase
    .from("traces")
    .select(
      "type_id, chemin_stockage, miniature_chemin_stockage, contenu_texte, legende, date_trace, statut_id, ordre_affichage"
    )
    .eq("activite_id", activiteSourceId);

  if (traces && traces.length > 0) {
    await supabase.from("traces").insert(
      traces.map((t) => ({
        ...t,
        activite_id: nouvelleActivite.id,
        auteur_id: user.id,
        auteur_nom_affiche: user.email ?? "Parent",
      }))
    );
  }

  revalidatePath("/journal");
  return { id: nouvelleActivite.id as string };
}
