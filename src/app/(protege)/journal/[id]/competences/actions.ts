"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { estimerProgressionAutomatique } from "../../../progression/actions";

export type DonneesObservationsLot = {
  activiteId: string;
  elements: { id: string; niveauAutonomieId: string }[];
  justification: string;
  commentairePedagogique: string;
};

export async function creerObservations(
  donnees: DonneesObservationsLot
): Promise<{ erreur: string } | { nombreCreees: number; avertissement?: string }> {
  if (donnees.elements.length === 0) {
    return { erreur: "Sélectionnez au moins un objectif observé." };
  }
  if (donnees.elements.some((e) => !e.niveauAutonomieId)) {
    return { erreur: "Le niveau d'autonomie est requis pour chaque compétence." };
  }

  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erreur: "Votre session a expiré. Merci de vous reconnecter." };
  }

  const lignes = donnees.elements.map(({ id: elementProgrammeId, niveauAutonomieId }) => ({
    activite_id: donnees.activiteId,
    element_programme_id: elementProgrammeId,
    niveau_autonomie_id: niveauAutonomieId,
    justification: donnees.justification || null,
    commentaire_pedagogique: donnees.commentairePedagogique || null,
    auteur_id: user.id,
    auteur_nom_affiche: user.email ?? "Parent",
  }));

  // upsert : permet de recocher/mettre a jour une observation deja existante
  // pour ce couple (activite, element) sans provoquer d'erreur de doublon.
  const { error, data } = await supabase
    .from("observations_elements_programme")
    .upsert(lignes, { onConflict: "activite_id,element_programme_id" })
    .select("id");

  if (error) {
    return { erreur: "Impossible d'enregistrer ces observations. Merci de réessayer." };
  }

  // Declenchement automatique du moteur de progression : jusqu'ici, il
  // fallait cliquer sur un bouton dedie sur Progression pour qu'une
  // observation compte officiellement. Desormais, chaque competence
  // observee est immediatement evaluee -- le moteur sait deja distinguer
  // une premiere estimation (appliquee directement) d'une competence deja
  // validee a la main par le parent (il propose alors un changement
  // plutot que de l'ecraser, comportement deja en place, inchange ici).
  // Non bloquant : si l'estimation echoue pour une competence, l'
  // observation elle-meme reste enregistree normalement.
  const { data: activite } = await supabase
    .from("activites")
    .select("parcours_id")
    .eq("id", donnees.activiteId)
    .maybeSingle();

  let avertissementEstimation: string | undefined;
  if (activite?.parcours_id) {
    const resultats = await Promise.all(
      donnees.elements.map(async ({ id: elementProgrammeId }) => {
        try {
          return await estimerProgressionAutomatique(
            activite.parcours_id as string,
            elementProgrammeId
          );
        } catch (e) {
          console.error("Erreur (exception) lors de l'estimation automatique", elementProgrammeId, e);
          return { erreur: e instanceof Error ? e.message : "Erreur inattendue." };
        }
      })
    );
    const echecs = resultats.filter(
      (r): r is { erreur: string } => "erreur" in r
    );
    if (echecs.length > 0) {
      console.error(
        "Estimation automatique : echecs pour",
        echecs.length,
        "/",
        resultats.length,
        "competences -- premiere erreur :",
        echecs[0]?.erreur
      );
      avertissementEstimation = `Observations enregistrées, mais la validation automatique a échoué pour ${echecs.length} compétence${echecs.length > 1 ? "s" : ""} (${echecs[0]?.erreur ?? "erreur inconnue"}).`;
    }
  }

  revalidatePath(`/journal/${donnees.activiteId}`);
  revalidatePath(`/journal/${donnees.activiteId}/competences`);
  revalidatePath("/progression");
  revalidatePath("/tableau-de-bord");
  return { nombreCreees: data?.length ?? 0, avertissement: avertissementEstimation };
}

export async function supprimerObservation(id: string, activiteId: string) {
  const supabase = creerClientServeur();
  await supabase.from("observations_elements_programme").delete().eq("id", id);
  revalidatePath(`/journal/${activiteId}`);
  revalidatePath(`/journal/${activiteId}/competences`);
}
