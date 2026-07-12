import { createBrowserClient } from "@supabase/ssr";
import { lireVariableEnvironnementSupabase } from "./env";

/**
 * Client Supabase utilisé dans les composants côté client ("use client").
 * Utilise uniquement la clé anonyme : toute la sécurité repose sur les
 * policies RLS définies dans supabase/migrations, jamais sur ce client.
 *
 * Échoue explicitement (Error avec message clair) si une variable
 * NEXT_PUBLIC_* est absente, au lieu de laisser le SDK Supabase échouer
 * silencieusement ou de façon peu compréhensible. Les appelants doivent
 * envelopper l'appel dans un try/catch (voir les pages d'authentification).
 */
export function creerClientNavigateur() {
  const url = lireVariableEnvironnementSupabase(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  const cle = lireVariableEnvironnementSupabase(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return createBrowserClient(url, cle);
}
