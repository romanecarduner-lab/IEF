/**
 * Declenche, sans l'attendre, l'estimation automatique des competences
 * d'une activite (voir /api/estimation-activite). `keepalive` permet a la
 * requete d'aller au bout meme si l'utilisatrice change de page aussitot.
 * Un echec est sans consequence : les competences concernees resteront
 * proposees au choix manuel sur Progression.
 */
export function declencherEstimationArrierePlan(activiteId: string): void {
  try {
    void fetch("/api/estimation-activite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ activiteId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // sans importance
  }
}
