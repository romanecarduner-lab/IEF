const MODELE_REDACTION = "claude-sonnet-5";

/**
 * Appel de redaction partage par les actions serveur de l'export.
 * Retourne le texte brut de la reponse ou une erreur lisible.
 */
export async function appellerClaude(
  prompt: string,
  maxTokens: number
): Promise<{ texte: string } | { erreur: string }> {
  const cleApi = process.env.ANTHROPIC_API_KEY;
  if (!cleApi) {
    return {
      erreur:
        "Configuration manquante : la variable ANTHROPIC_API_KEY n'est pas définie sur le serveur.",
    };
  }

  try {
    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cleApi,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE_REDACTION,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error("Erreur API (export)", reponse.status, detail);
      return { erreur: `La rédaction n'a pas pu aboutir (code ${reponse.status}).` };
    }

    const donnees = await reponse.json();
    const blocTexte = Array.isArray(donnees?.content)
      ? donnees.content.find((bloc: { type?: string }) => bloc?.type === "text")
      : null;
    return { texte: (blocTexte?.text as string | undefined)?.trim() ?? "" };
  } catch (erreur) {
    console.error("Erreur reseau appel redaction (export)", erreur);
    return { erreur: "Impossible de contacter le service de rédaction. Merci de réessayer." };
  }
}
