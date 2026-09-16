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
  const typeDossier = String(donnees.get("type_dossier") ?? "pedagogique");

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

  if (typeDossier === "journal_periode") {
    const periodeDebut = String(donnees.get("periode_debut") ?? "");
    const periodeFin = String(donnees.get("periode_fin") ?? "");

    if (!periodeDebut || !periodeFin) {
      return { erreur: "Les deux dates de la période sont requises." };
    }
    if (periodeDebut > periodeFin) {
      return { erreur: "La date de début doit précéder la date de fin." };
    }

    const { data: dossier, error } = await supabase
      .from("dossiers_export")
      .insert({
        parcours_id: parcoursId,
        titre,
        type_dossier: "journal_periode",
        periode_debut: periodeDebut,
        periode_fin: periodeFin,
        created_par: user.id,
        created_par_nom_affiche: user.email ?? "Parent",
      })
      .select("id")
      .single();

    if (error || !dossier) {
      return { erreur: "Impossible de créer ce dossier. Merci de réessayer." };
    }

    // Toutes les activites de la periode sont incluses par defaut -- le
    // parent pourra en retirer certaines dans l'editeur avant de finaliser.
    const { data: activites } = await supabase
      .from("activites")
      .select("id, date_activite")
      .eq("parcours_id", parcoursId)
      .gte("date_activite", periodeDebut)
      .lte("date_activite", periodeFin)
      .order("date_activite", { ascending: true });

    if (activites && activites.length > 0) {
      await supabase.from("dossiers_export_elements").insert(
        activites.map((a, index) => ({
          dossier_id: dossier.id,
          type_element: "activite",
          activite_id: a.id,
          ordre: index,
        }))
      );
    }

    revalidatePath("/export");
    redirect(`/export/${dossier.id}`);
  }

  const remplissageAuto = donnees.get("remplissage_auto") === "on";
  const maxParDomaine = Number(donnees.get("max_par_domaine") ?? 3) || 3;

  const { data, error } = await supabase
    .from("dossiers_export")
    .insert({
      parcours_id: parcoursId,
      titre,
      type_dossier: "pedagogique",
      created_par: user.id,
      created_par_nom_affiche: user.email ?? "Parent",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { erreur: "Impossible de créer ce dossier. Merci de réessayer." };
  }

  // Le remplissage automatique peut echouer (par ex. aucune activite
  // reliee a une competence) sans que ce soit bloquant : le dossier vide
  // reste consultable et completable a la main.
  if (remplissageAuto) {
    await remplirBilanAutomatique(data.id, parcoursId, maxParDomaine);
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
