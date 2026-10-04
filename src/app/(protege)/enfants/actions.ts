"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import type { EtatFormulaire } from "@/lib/typesFormulaire";

export async function creerEnfant(
  _etatPrecedent: EtatFormulaire,
  donnees: FormData
): Promise<EtatFormulaire> {
  const prenom = String(donnees.get("prenom") ?? "").trim();
  const dateNaissance = String(donnees.get("date-naissance") ?? "").trim();
  const remarques = String(donnees.get("remarques") ?? "").trim();
  const pronomBrut = String(donnees.get("pronom") ?? "").trim();
  const pronom = pronomBrut === "il" || pronomBrut === "elle" ? pronomBrut : null;

  if (!prenom) {
    return { erreur: "Le prénom est requis." };
  }

  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erreur: "Votre session a expiré. Merci de vous reconnecter." };
  }

  const { data: appartenance } = await supabase
    .from("utilisateurs_familles")
    .select("famille_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!appartenance) {
    return { erreur: "Aucun espace familial associé à votre compte." };
  }

  const { error } = await supabase.from("enfants").insert({
    famille_id: appartenance.famille_id,
    prenom,
    date_naissance: dateNaissance || null,
    remarques: remarques || null,
    pronom,
    cree_par: user.id,
  });

  if (error) {
    return { erreur: "Impossible d'enregistrer cet enfant. Merci de réessayer." };
  }

  revalidatePath("/famille");
  redirect("/famille");
}

/**
 * Modifie uniquement le pronom (il/elle) d'un enfant deja cree -- pour
 * corriger une description generee par l'IA qui se serait trompee en
 * le devinant a partir des photos, sans jamais demander le genre ni
 * le sexe de l'enfant.
 */
export async function modifierPronomEnfant(
  enfantId: string,
  pronom: "il" | "elle" | ""
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();
  const { error } = await supabase
    .from("enfants")
    .update({ pronom: pronom || null })
    .eq("id", enfantId);

  if (error) {
    return { erreur: "Impossible d'enregistrer. Merci de réessayer." };
  }

  revalidatePath("/famille");
  return { ok: true };
}

export async function supprimerEnfant(id: string) {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: enfant } = await supabase
    .from("enfants")
    .select("prenom, famille_id")
    .eq("id", id)
    .maybeSingle();

  // Retrouve tous les fichiers (traces) rattaches a cet enfant, via ses
  // parcours et activites, pour les purger reellement du Storage avant
  // de supprimer la ligne (la cascade SQL ne touche jamais aux fichiers).
  const { data: traces } = await supabase
    .from("traces")
    .select("chemin_stockage, miniature_chemin_stockage, activites!inner(parcours_scolaires!inner(enfant_id))")
    .eq("activites.parcours_scolaires.enfant_id", id);

  const chemins = (traces ?? [])
    .flatMap((t) => [t.chemin_stockage, t.miniature_chemin_stockage])
    .filter((c): c is string => Boolean(c));

  if (chemins.length > 0) {
    await supabase.storage.from("traces-pedagogiques").remove(chemins);
  }

  if (enfant && user) {
    await supabase.rpc("rpc_journal_auditer", {
      p_famille_id: enfant.famille_id,
      p_type_action: "suppression_enfant",
      p_cible_type: "enfant",
      p_cible_id: id,
      p_details: { prenom: enfant.prenom, fichiers_purges: chemins.length },
    });
  }

  await supabase.from("enfants").delete().eq("id", id);
  revalidatePath("/famille");
}
