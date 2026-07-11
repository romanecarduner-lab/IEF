"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import type { EtatFormulaire } from "@/lib/typesFormulaire";

export async function creerAnneeScolaire(
  _etatPrecedent: EtatFormulaire,
  donnees: FormData
): Promise<EtatFormulaire> {
  const libelle = String(donnees.get("libelle") ?? "").trim();
  const dateDebut = String(donnees.get("date-debut") ?? "");
  const dateFin = String(donnees.get("date-fin") ?? "");

  if (!libelle || !dateDebut || !dateFin) {
    return { erreur: "Le libellé et les deux dates sont requis." };
  }
  if (new Date(dateFin) <= new Date(dateDebut)) {
    return { erreur: "La date de fin doit être postérieure à la date de début." };
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

  const { error } = await supabase.from("annees_scolaires").insert({
    famille_id: appartenance.famille_id,
    libelle,
    date_debut: dateDebut,
    date_fin: dateFin,
  });

  if (error) {
    const doublon = error.code === "23505";
    return {
      erreur: doublon
        ? "Une année scolaire porte déjà ce libellé."
        : "Impossible d'enregistrer cette année scolaire.",
    };
  }

  revalidatePath("/annees-scolaires");
  return {};
}

export async function supprimerAnneeScolaire(id: string) {
  const supabase = creerClientServeur();
  await supabase.from("annees_scolaires").delete().eq("id", id);
  revalidatePath("/annees-scolaires");
}
