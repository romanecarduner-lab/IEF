"use server";

import { creerClientServeur } from "@/lib/supabase/server";
import { empreinteJeton, messagePourErreurInvitation } from "@/lib/invitations";

/**
 * Rejoint l'espace familial de l'invitation. Toutes les verifications
 * (validite, expiration, adresse e-mail, espace actuel vide) sont faites
 * par la fonction SQL rpc_accepter_invitation.
 */
export async function accepterInvitation(
  jeton: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Connectez-vous d'abord pour rejoindre cet espace." };

  const { data: familleId, error } = await supabase.rpc("rpc_accepter_invitation", {
    p_token_hash: empreinteJeton(jeton),
  });
  if (error) {
    console.error("Erreur acceptation invitation", error.message);
    return { erreur: messagePourErreurInvitation(error.message) };
  }

  await supabase.rpc("rpc_journal_auditer", {
    p_famille_id: familleId as string,
    p_type_action: "invitation_acceptee",
    p_cible_type: "famille",
    p_cible_id: familleId as string,
    p_details: {},
  });

  return { ok: true };
}
