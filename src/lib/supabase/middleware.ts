import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { lireVariableEnvironnementSupabase } from "./env";

/**
 * Rafraîchit la session Supabase à chaque requête et retourne la réponse
 * avec les cookies à jour. Appelé depuis le middleware racine.
 *
 * Si les variables NEXT_PUBLIC_* sont absentes, l'erreur remonte jusqu'au
 * middleware et donc jusqu'aux logs Vercel (Functions → Logs), plutôt que
 * de produire un blocage silencieux côté client.
 */
export async function mettreAJourSession(request: NextRequest) {
  const url = lireVariableEnvironnementSupabase(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  const cle = lireVariableEnvironnementSupabase(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(url, cle, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
