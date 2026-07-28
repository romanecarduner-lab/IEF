"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { remplirBilanAutomatique } from "./[id]/actions";

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

/**
 * Enchaine en une seule action la creation d'un dossier et son
 * remplissage automatique (favoris puis recents, par domaine — voir
 * remplirBilanAutomatique), pour preparer un controle en un clic plutot
 * qu'en trois etapes separees. Le parent est ensuite redirige vers
 * l'editeur du dossier pour verifier/ajuster avant de finaliser : rien
 * n'est jamais finalise automatiquement.
 */
export async function creerBilanControle(
  parcoursId: string,
  maxParDomaine: number
): Promise<{ erreur: string } | never> {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erreur: "Votre session a expiré. Merci de vous reconnecter." };
  }

  const { data: parcours } = await supabase
    .from("parcours_scolaires")
    .select("enfants(prenom), annees_scolaires(libelle)")
    .eq("id", parcoursId)
    .maybeSingle();

  const enfant = parcours
    ? Array.isArray(parcours.enfants)
      ? parcours.enfants[0]
      : parcours.enfants
    : null;
  const annee = parcours
    ? Array.isArray(parcours.annees_scolaires)
      ? parcours.annees_scolaires[0]
      : parcours.annees_scolaires
    : null;

  const titre = `Bilan de contrôle — ${enfant?.prenom ?? "?"} — ${annee?.libelle ?? "?"}`;

  const { data: dossier, error } = await supabase
    .from("dossiers_export")
    .insert({
      parcours_id: parcoursId,
      titre,
      created_par: user.id,
      created_par_nom_affiche: user.email ?? "Parent",
    })
    .select("id")
    .single();

  if (error || !dossier) {
    return { erreur: "Impossible de créer le dossier. Merci de réessayer." };
  }

  // Le remplissage automatique peut echouer (par ex. aucune activite
  // reliee a une competence) sans que ce soit bloquant : le dossier vide
  // reste consultable et completable a la main.
  await remplirBilanAutomatique(dossier.id, parcoursId, maxParDomaine);

  revalidatePath("/export");
  redirect(`/export/${dossier.id}`);
}
