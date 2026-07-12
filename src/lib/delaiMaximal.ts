export class ErreurDelaiDepasse extends Error {
  constructor() {
    super("Délai dépassé");
    this.name = "ErreurDelaiDepasse";
  }
}

/**
 * Fait échouer une promesse si elle n'a pas abouti après `delaiMs`.
 * Empêche un bouton "Un instant…" de rester bloqué indéfiniment en cas de
 * problème réseau ou de service Supabase indisponible.
 */
export function avecDelaiMaximal<T>(
  promesse: Promise<T>,
  delaiMs = 15000
): Promise<T> {
  return Promise.race([
    promesse,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new ErreurDelaiDepasse()), delaiMs);
    }),
  ]);
}

/**
 * Traduit une erreur inattendue (délai dépassé, configuration manquante,
 * ou autre) en message utilisateur compréhensible, pour affichage dans les
 * formulaires d'authentification.
 */
export function messagePourErreurInattendue(erreur: unknown): string {
  if (erreur instanceof ErreurDelaiDepasse) {
    return "La demande prend trop de temps. Vérifiez votre connexion ou réessayez.";
  }
  if (erreur instanceof Error && erreur.message.startsWith("Configuration Supabase manquante")) {
    return erreur.message;
  }
  return "Une erreur est survenue. Merci de réessayer.";
}
