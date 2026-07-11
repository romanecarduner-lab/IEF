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
    cree_par: user.id,
  });

  if (error) {
    return { erreur: "Impossible d'enregistrer cet enfant. Merci de réessayer." };
  }

  revalidatePath("/enfants");
  redirect("/enfants");
}

export async function supprimerEnfant(id: string) {
  const supabase = creerClientServeur();
  await supabase.from("enfants").delete().eq("id", id);
  revalidatePath("/enfants");
}
