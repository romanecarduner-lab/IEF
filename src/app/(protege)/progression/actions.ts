"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";

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

  const { data: synthese, error } = await supabase
    .from("syntheses_progression")
    .upsert(
      {
        parcours_id: parcoursId,
        element_programme_id: elementProgrammeId,
        statut_global_id: nouveauStatut.id,
        valide_par: user.id,
        valide_par_nom_affiche: user.email ?? "Parent",
        valide_le: new Date().toISOString(),
      },
      { onConflict: "parcours_id,element_programme_id" }
    )
    .select("id")
    .single();

  if (error || !synthese) {
    return { erreur: "Impossible d'enregistrer ce statut. Merci de réessayer." };
  }

  await supabase.from("historique_progression").insert({
    synthese_id: synthese.id,
    ancien_statut: ancienStatutLibelle,
    nouveau_statut: nouveauStatut.libelle,
    change_par: user.id,
    change_par_nom_affiche: user.email ?? "Parent",
    commentaire: commentaire || null,
  });

  revalidatePath("/progression");
  return { ok: true };
}
