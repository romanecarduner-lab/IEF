"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";

export async function creerDossier(
  _etatPrecedent: { erreur?: string },
  donnees: FormData
): Promise<{ erreur?: string }> {
  const titre = String(donnees.get("titre") ?? "").trim();
  const parcoursId = String(donnees.get("parcours_id") ?? "");

  if (!titre || !parcoursId) {
    return { erreur: "Le titre et le parcours sont requis." };
  }

  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erreur: "Votre session a expiré. Merci de vous reconnecter." };
  }

  const { data, error } = await supabase
    .from("dossiers_export")
    .insert({
      parcours_id: parcoursId,
      titre,
      created_par: user.id,
      created_par_nom_affiche: user.email ?? "Parent",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { erreur: "Impossible de créer ce dossier. Merci de réessayer." };
  }

  revalidatePath("/export");
  redirect(`/export/${data.id}`);
}

export async function supprimerDossier(id: string) {
  const supabase = creerClientServeur();

  // Le fichier PDF genere n'est jamais supprime automatiquement par une
  // cascade SQL : on le retire explicitement d'abord, comme pour les traces.
  const { data: dossier } = await supabase
    .from("dossiers_export")
    .select("pdf_final_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (dossier?.pdf_final_storage_path) {
    await supabase.storage.from("traces-pedagogiques").remove([dossier.pdf_final_storage_path]);
  }

  await supabase.from("dossiers_export").delete().eq("id", id);
  revalidatePath("/export");
}
