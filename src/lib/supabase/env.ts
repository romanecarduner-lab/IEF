/**
 * Lit une variable d'environnement Supabase et échoue bruyamment si elle
 * est absente, plutôt que de laisser createBrowserClient/createServerClient
 * échouer plus loin avec une erreur peu explicite (ou de bloquer
 * silencieusement l'interface si l'appelant oublie de gérer l'erreur).
 */
export function lireVariableEnvironnementSupabase(
  nom: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  valeur: string | undefined
): string {
  if (!valeur || valeur.trim().length === 0) {
    throw new Error(`Configuration Supabase manquante : ${nom}`);
  }
  return valeur;
}
