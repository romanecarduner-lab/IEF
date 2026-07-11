import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour Server Components, Route Handlers et Server Actions.
 * Lit/écrit la session via les cookies de la requête. Utilise la clé anonyme :
 * l'isolation des données repose entièrement sur les policies RLS.
 *
 * Ne jamais utiliser SUPABASE_SERVICE_ROLE_KEY ici — cette clé contourne la RLS
 * et ne doit être appelée que depuis un traitement serveur explicitement conçu
 * pour cela (aucun cas de ce type dans le lot 1).
 */
export function creerClientServeur() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Appelé depuis un Server Component : l'écriture de cookie est
            // ignorée ici, elle est prise en charge par le middleware.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Idem : ignoré en dehors d'une Server Action / Route Handler.
          }
        },
      },
    }
  );
}
