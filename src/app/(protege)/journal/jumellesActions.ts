"use server";

import { creerClientServeur } from "@/lib/supabase/server";

/**
 * Retourne tous les objectifs du cycle dont le libelle est strictement
 * identique (meme competence reprise a 3 ans, 4 ans, 5 ans...). Le suivi
 * se fait a l'echelle du cycle : cocher l'une coche les autres.
 */
export async function trouverJumelles(
  cycleId: string,
  libelle: string
): Promise<{ id: string; libelle: string }[]> {
  if (!cycleId || !libelle) return [];
  const supabase = creerClientServeur();
  const { data } = await supabase
    .from("elements_programme")
    .select("id, libelle, types_element_programme!inner(code)")
    .eq("types_element_programme.code", "objectif")
    .eq("cycle_id", cycleId)
    .eq("libelle", libelle)
    .limit(50);
  return (data ?? []).map((r) => ({ id: r.id as string, libelle: r.libelle as string }));
}
