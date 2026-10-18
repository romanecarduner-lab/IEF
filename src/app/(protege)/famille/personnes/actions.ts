"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { empreinteJeton, genererJeton, messagePourErreurInvitation } from "@/lib/invitations";

async function contexteFamille() {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: appartenance } = await supabase
    .from("utilisateurs_familles")
    .select("famille_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!appartenance) return null;
  return { supabase, user, familleId: appartenance.famille_id as string };
}

function adresseDuSite(): string {
  const h = headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const protocole = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${protocole}://${hote}`;
}

/** Cree une invitation et renvoie le lien (montre une seule fois). */
export async function creerInvitation(
  prenom: string,
  email: string
): Promise<{ erreur: string } | { lien: string; email: string | null; prenom: string | null }> {
  const contexte = await contexteFamille();
  if (!contexte) return { erreur: "Aucun espace familial associé à votre compte." };

  const jeton = genererJeton();
  const { data: id, error } = await contexte.supabase.rpc("rpc_creer_invitation", {
    p_famille_id: contexte.familleId,
    p_email: email,
    p_prenom: prenom,
    p_token_hash: empreinteJeton(jeton),
  });
  if (error) {
    console.error("Erreur creation invitation", error.message);
    return { erreur: messagePourErreurInvitation(error.message) };
  }

  await contexte.supabase.rpc("rpc_journal_auditer", {
    p_famille_id: contexte.familleId,
    p_type_action: "invitation_creee",
    p_cible_type: "invitation",
    p_cible_id: id as string,
    p_details: { avec_email: Boolean(email.trim()) },
  });

  revalidatePath("/famille/personnes");
  return {
    lien: `${adresseDuSite()}/invitation/${jeton}`,
    email: email.trim().toLowerCase() || null,
    prenom: prenom.trim() || null,
  };
}

export async function annulerInvitation(invitationId: string): Promise<{ erreur: string } | { ok: true }> {
  const contexte = await contexteFamille();
  if (!contexte) return { erreur: "Aucun espace familial associé à votre compte." };
  const { error } = await contexte.supabase.rpc("rpc_annuler_invitation", { p_id: invitationId });
  if (error) return { erreur: messagePourErreurInvitation(error.message) };
  revalidatePath("/famille/personnes");
  return { ok: true };
}

export async function retirerMembre(userId: string): Promise<{ erreur: string } | { ok: true }> {
  const contexte = await contexteFamille();
  if (!contexte) return { erreur: "Aucun espace familial associé à votre compte." };
  const { error } = await contexte.supabase.rpc("rpc_retirer_membre", {
    p_famille_id: contexte.familleId,
    p_user_id: userId,
  });
  if (error) return { erreur: messagePourErreurInvitation(error.message) };

  await contexte.supabase.rpc("rpc_journal_auditer", {
    p_famille_id: contexte.familleId,
    p_type_action: "membre_retire",
    p_cible_type: "utilisateur",
    p_cible_id: userId,
    p_details: {},
  });
  revalidatePath("/famille/personnes");
  return { ok: true };
}

export async function changerAfficherAuteur(valeur: boolean): Promise<{ erreur: string } | { ok: true }> {
  const contexte = await contexteFamille();
  if (!contexte) return { erreur: "Aucun espace familial associé à votre compte." };
  const { error } = await contexte.supabase
    .from("familles")
    .update({ afficher_auteur: valeur })
    .eq("id", contexte.familleId);
  if (error) {
    console.error("Erreur reglage auteur", error.message);
    return {
      erreur: error.message.includes("afficher_auteur")
        ? "Une mise à jour de la base de données est manquante (invitations). Contactez la personne qui administre l'application."
        : "Impossible d'enregistrer ce réglage. Merci de réessayer.",
    };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
