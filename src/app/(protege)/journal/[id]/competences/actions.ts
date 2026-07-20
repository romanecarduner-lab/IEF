"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";

export type DonneesObservationsLot = {
  activiteId: string;
  elementProgrammeIds: string[];
  niveauAutonomieId: string;
  justification: string;
  commentairePedagogique: string;
};

export async function creerObservations(
  donnees: DonneesObservationsLot
): Promise<{ erreur: string } | { nombreCreees: number }> {
  if (donnees.elementProgrammeIds.length === 0) {
    return { erreur: "Sélectionnez au moins un objectif observé." };
  }
  if (!donnees.niveauAutonomieId) {
    return { erreur: "Le niveau d'autonomie est requis." };
  }

  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erreur: "Votre session a expiré. Merci de vous reconnecter." };
  }

  const lignes = donnees.elementProgrammeIds.map((elementProgrammeId) => ({
    activite_id: donnees.activiteId,
    element_programme_id: elementProgrammeId,
    niveau_autonomie_id: donnees.niveauAutonomieId,
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

  revalidatePath(`/journal/${donnees.activiteId}`);
  revalidatePath(`/journal/${donnees.activiteId}/competences`);
  return { nombreCreees: data?.length ?? 0 };
}

export async function supprimerObservation(id: string, activiteId: string) {
  const supabase = creerClientServeur();
  await supabase.from("observations_elements_programme").delete().eq("id", id);
  revalidatePath(`/journal/${activiteId}`);
  revalidatePath(`/journal/${activiteId}/competences`);
}
