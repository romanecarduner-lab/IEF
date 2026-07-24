import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "traces-pedagogiques";

/**
 * Liste tous les chemins de fichiers sous un prefixe donne (famille_id),
 * y compris le sous-dossier "dossiers/" (dossiers d'export). La fonction
 * list() de Supabase Storage n'est pas recursive : on liste donc
 * explicitement les deux niveaux utilises par cette application.
 */
export async function listerCheminsFamille(
  supabase: SupabaseClient,
  familleId: string
): Promise<string[]> {
  const chemins: string[] = [];

  const { data: racine } = await supabase.storage.from(BUCKET).list(familleId, { limit: 1000 });
  for (const item of racine ?? []) {
    if (item.id) chemins.push(`${familleId}/${item.name}`);
  }

  const { data: dossiers } = await supabase.storage
    .from(BUCKET)
    .list(`${familleId}/dossiers`, { limit: 1000 });
  for (const item of dossiers ?? []) {
    if (item.id) chemins.push(`${familleId}/dossiers/${item.name}`);
  }

  return chemins;
}

/**
 * Supprime reellement les fichiers du bucket (pas seulement les lignes en
 * base) : necessaire car aucune cascade SQL ne touche Storage.
 */
export async function purgerChemins(supabase: SupabaseClient, chemins: string[]) {
  if (chemins.length === 0) return;
  // remove() accepte au plus quelques centaines de chemins par appel,
  // largement suffisant a l'echelle d'une famille ; on segmente par
  // securite pour de tres gros volumes.
  const paquets = [];
  for (let i = 0; i < chemins.length; i += 200) {
    paquets.push(chemins.slice(i, i + 200));
  }
  for (const paquet of paquets) {
    await supabase.storage.from(BUCKET).remove(paquet);
  }
}
