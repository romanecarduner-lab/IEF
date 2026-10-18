import { createHash, randomBytes } from "crypto";

/**
 * Jeton secret d'une invitation : 32 octets aleatoires, encodes pour
 * figurer dans une adresse. Il n'est montre qu'une fois (a la creation) ;
 * seule son empreinte sha-256 est stockee en base.
 */
export function genererJeton(): string {
  return randomBytes(32).toString("base64url");
}

export function empreinteJeton(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}

/** Traduit les codes d'erreur des fonctions SQL d'invitation. */
export function messagePourErreurInvitation(message: string | undefined): string {
  const m = message ?? "";
  if (m.includes("invitation_introuvable")) return "Ce lien d'invitation n'existe pas. Vérifiez qu'il est complet.";
  if (m.includes("invitation_annulee")) return "Cette invitation a été annulée. Demandez un nouveau lien.";
  if (m.includes("invitation_utilisee")) return "Ce lien a déjà été utilisé. Demandez un nouveau lien.";
  if (m.includes("invitation_expiree")) return "Ce lien a expiré (il est valable 7 jours). Demandez un nouveau lien.";
  if (m.includes("invitation_autre_adresse"))
    return "Cette invitation est réservée à une autre adresse e-mail que celle de votre compte.";
  if (m.includes("espace_non_vide"))
    return "Votre compte a déjà un espace familial qui contient des enfants ou d'autres personnes. Pour ne rien perdre, il ne peut pas être remplacé automatiquement. Contactez la personne qui vous invite.";
  if (m.includes("trop_d_invitations"))
    return "Il y a déjà 10 invitations en attente. Annulez-en une avant d'en créer une nouvelle.";
  if (m.includes("email_invalide")) return "Cette adresse e-mail ne semble pas valide.";
  if (m.includes("acces_refuse")) return "Vous n'avez pas accès à cet espace.";
  if (m.includes("retrait_de_soi_impossible"))
    return "Vous ne pouvez pas vous retirer vous-même : l'espace doit garder au moins un parent.";
  if (m.includes("function") && m.includes("does not exist"))
    return "Une mise à jour de la base de données est manquante (invitations). Contactez la personne qui administre l'application.";
  return "Une erreur est survenue. Merci de réessayer.";
}
