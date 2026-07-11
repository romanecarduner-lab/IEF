import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase utilisé dans les composants côté client ("use client").
 * Utilise uniquement la clé anonyme : toute la sécurité repose sur les
 * policies RLS définies dans supabase/migrations, jamais sur ce client.
 */
export function creerClientNavigateur() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
