"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import type { EtatFormulaire } from "@/lib/typesFormulaire";

export async function creerParcours(
  _etatPrecedent: EtatFormulaire,
  donnees: FormData
): Promise<EtatFormulaire> {
  const enfantId = String(donnees.get("enfant_id") ?? "");
  const anneeScolaireId = String(donnees.get("annee_scolaire_id") ?? "");
  const cycleId = String(donnees.get("cycle_id") ?? "");
  const niveauIndicatif = String(donnees.get("niveau_indicatif") ?? "").trim();
  const remarques = String(donnees.get("remarques") ?? "").trim();

  if (!enfantId || !anneeScolaireId || !cycleId) {
    return { erreur: "L'enfant, l'année scolaire et le cycle sont requis." };
  }

  const supabase = creerClientServeur();

  // Le référentiel est dérivé du cycle choisi : l'utilisatrice n'a jamais à
  // faire correspondre elle-même un cycle et un référentiel (le trigger de
  // cohérence en base reste un filet de sécurité, pas une charge mentale
  // supplémentaire pour la personne qui remplit le formulaire).
  const { data: cycle } = await supabase
    .from("cycles")
    .select("referentiel_id")
    .eq("id", cycleId)
    .maybeSingle();

  if (!cycle) {
    return { erreur: "Le cycle sélectionné est introuvable." };
  }

  const { error } = await supabase.from("parcours_scolaires").insert({
    enfant_id: enfantId,
    annee_scolaire_id: anneeScolaireId,
    cycle_id: cycleId,
    referentiel_id: cycle.referentiel_id,
    niveau_indicatif: niveauIndicatif || null,
    remarques: remarques || null,
  });

  if (error) {
    const doublon = error.code === "23505";
    return {
      erreur: doublon
        ? "Cet enfant a déjà un parcours pour cette année scolaire."
        : "Impossible d'enregistrer ce parcours. Merci de réessayer.",
    };
  }

  revalidatePath("/parcours");
  return {};
}

export async function supprimerParcours(id: string) {
  const supabase = creerClientServeur();
  await supabase.from("parcours_scolaires").delete().eq("id", id);
  revalidatePath("/parcours");
}
