import { createClient } from "@supabase/supabase-js";
import { lireVariableEnvironnementSupabase } from "./env";

/**
 * EXCEPTION DELIBEREE a la regle "jamais de service_role" appliquee
 * partout ailleurs dans l'application. La suppression reelle d'un compte
 * (auth.users) n'est possible, dans Supabase, que via l'API
 * d'administration, qui exige la cle service_role — il n'existe aucun
 * moyen d'y parvenir en respectant la RLS depuis le client.
 *
 * Regles strictes d'usage :
 * - Ce client n'est utilise que dans src/app/(protege)/confidentialite/actions.ts,
 *   pour un seul appel (auth.admin.deleteUser), jamais ailleurs.
 * - Il n'est jamais importe dans un composant client, jamais expose au
 *   navigateur.
 * - Il ne sert jamais a contourner la RLS pour lire ou modifier des
 *   donnees : uniquement pour cette operation d'administration precise.
 */
export function creerClientAdmin() {
  const url = lireVariableEnvironnementSupabase(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  const cleService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!cleService) {
    throw new Error("Configuration manquante : SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, cleService, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
