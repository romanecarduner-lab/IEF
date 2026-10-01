"use server";

import { creerClientServeur } from "@/lib/supabase/server";

const TYPES_ARBRE = ["domaine", "sous_domaine", "competence", "repere_annuel"];

export type NoeudArbreProgramme = {
  id: string;
  parentId: string | null;
  type: string;
  libelle: string;
};

/**
 * Charge l'arborescence du programme officiel (domaine > sous-domaine >
 * competence > tranche d'age) pour un cycle donne -- utilise pour la
 * navigation par domaine, chargee a la demande cote client plutot que
 * systematiquement au chargement de la page (le cycle n'est pas toujours
 * connu a l'avance, par exemple avant le choix de l'enfant).
 */
export async function chargerArbreProgramme(
  cycleId: string
): Promise<NoeudArbreProgramme[]> {
  if (!cycleId) return [];
  const supabase = creerClientServeur();

  const { data } = await supabase
    .from("elements_programme")
    .select("id, parent_id, libelle, types_element_programme!inner(code)")
    .in("types_element_programme.code", TYPES_ARBRE)
    .eq("cycle_id", cycleId)
    .order("ordre");

  return (data ?? []).map((n) => {
    const typeInfo = n.types_element_programme as { code: string } | { code: string }[];
    const type = Array.isArray(typeInfo) ? typeInfo[0]?.code : typeInfo?.code;
    return {
      id: n.id as string,
      parentId: n.parent_id as string | null,
      type: type ?? "",
      libelle: n.libelle as string,
    };
  });
}
