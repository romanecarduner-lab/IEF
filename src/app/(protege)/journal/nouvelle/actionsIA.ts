"use server";

import { creerClientServeur } from "@/lib/supabase/server";

const MODELE_SUGGESTION = "claude-haiku-4-5-20251001"; // classification simple : rapide et economique
const MODELE_REDACTION = "claude-sonnet-5"; // redaction : qualite superieure, cout toujours minime vu la taille du prompt

export type SuggestionIA = { id: string; libelle: string; chemin: string | null };
export type ResultatSuggestionIA = { erreur: string } | { suggestions: SuggestionIA[] };
export type ResultatFormulation = { erreur: string } | { texte: string };

/**
 * Appelle l'API Anthropic et renvoie le texte de la reponse, ou leve une
 * erreur avec un message deja adapte a l'affichage utilisateur.
 */
async function appellerClaude(
  prompt: string,
  modele: string,
  maxTokens: number
): Promise<{ texte: string } | { erreur: string }> {
  const cleApi = process.env.ANTHROPIC_API_KEY;
  if (!cleApi) {
    return {
      erreur:
        "Configuration IA manquante : la variable ANTHROPIC_API_KEY n'est pas définie sur le serveur.",
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
        model: modele,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error("Erreur API Anthropic", reponse.status, detail);
      return { erreur: "L'IA n'a pas pu répondre. Merci de réessayer." };
    }

    const donnees = await reponse.json();
    const texte = donnees?.content?.[0]?.text ?? "";
    return { texte };
  } catch (erreurReseau) {
    console.error("Erreur réseau vers l'API Anthropic", erreurReseau);
    return { erreur: "Impossible de contacter l'IA. Vérifiez la connexion et réessayez." };
  }
}

/**
 * Demande a Claude d'identifier, parmi tous les objectifs du programme,
 * ceux probablement mobilises par l'activite decrite. Contrairement a
 * suggerer_objectifs_programme (rapprochement de mots-cles, gratuit et
 * automatique), cet appel a un cout et n'est declenche qu'a la demande
 * (bouton), jamais automatiquement pendant la saisie.
 *
 * Pour limiter le cout et le risque d'erreur, le programme est envoye a
 * Claude sous forme d'une liste numerotee : Claude renvoie des numeros,
 * pas des UUID (plus fiable, moins de tokens).
 */
export async function suggererObjectifsIA(
  titre: string,
  description: string
): Promise<ResultatSuggestionIA> {
  if (!titre.trim()) {
    return { erreur: "Le titre est requis pour demander une suggestion." };
  }

  const supabase = creerClientServeur();
  const { data: objectifsBruts, error: erreurRequete } = await supabase
    .from("elements_programme")
    .select("id, parent_id, libelle, types_element_programme!inner(code)")
    .eq("types_element_programme.code", "objectif")
    .order("libelle");

  if (erreurRequete || !objectifsBruts || objectifsBruts.length === 0) {
    return { erreur: "Impossible de charger le programme pour la suggestion." };
  }

  const objectifs = objectifsBruts.map((o) => ({
    id: o.id as string,
    parentId: o.parent_id as string,
    libelle: o.libelle as string,
  }));

  const listeNumerotee = objectifs
    .map((o, i) => `${i + 1}. ${o.libelle}`)
    .join("\n");

  const prompt = `Tu aides un parent qui pratique l'instruction en famille (cycle 1, école maternelle française) à relier une activité vécue par son enfant aux objectifs du programme officiel.

Titre de l'activité : "${titre.trim()}"
Description : "${description.trim() || "(aucune)"}"

Voici la liste numérotée de tous les objectifs possibles :
${listeNumerotee}

Réponds UNIQUEMENT avec un tableau JSON des numéros des objectifs les plus probablement mobilisés par cette activité (au maximum 8, du plus au moins pertinent). Si rien ne correspond clairement, réponds [].
Exemple de réponse valide : [12, 87, 203]
N'écris rien d'autre que ce tableau JSON.`;

  const resultat = await appellerClaude(prompt, MODELE_SUGGESTION, 300);
  if ("erreur" in resultat) return resultat;

  let indices: unknown;
  try {
    const texteNettoye = resultat.texte
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "");
    indices = JSON.parse(texteNettoye);
  } catch {
    console.error("Réponse IA non interprétable comme JSON :", resultat.texte);
    return { erreur: "La réponse de l'IA n'a pas pu être lue. Merci de réessayer." };
  }

  if (!Array.isArray(indices)) {
    return { erreur: "Réponse IA inattendue. Merci de réessayer." };
  }

  const indicesValides = indices.filter(
    (n): n is number => typeof n === "number" && n >= 1 && n <= objectifs.length
  );

  const objectifsChoisis = indicesValides
    .map((n) => objectifs[n - 1])
    .filter((o): o is (typeof objectifs)[number] => o !== undefined);

  const suggestions: SuggestionIA[] = await Promise.all(
    objectifsChoisis.map(async (o) => {
      const { data: chemin } = await supabase.rpc("chemin_element_programme", {
        p_element_id: o.parentId,
      });
      return { id: o.id, libelle: o.libelle, chemin: (chemin as string) ?? null };
    })
  );

  return { suggestions };
}

/**
 * Propose une formulation pedagogique redigee, a partir de ce que le
 * parent a deja ecrit et des competences deja retenues pour l'activite.
 * Le parent reste libre d'utiliser, modifier ou ignorer le texte propose :
 * rien n'est jamais inseré automatiquement dans le formulaire.
 *
 * Contraintes imposees au modele : ne rien inventer au-dela de ce que le
 * parent a mentionné (le carnet doit rester factuel), et reformuler avec
 * ses propres mots plutôt que reprendre le texte du programme officiel.
 */
export async function proposerFormulationPedagogique(
  titre: string,
  descriptionBrute: string,
  competencesRetenues: string[]
): Promise<ResultatFormulation> {
  if (!titre.trim()) {
    return { erreur: "Le titre est requis pour proposer une formulation." };
  }
  if (competencesRetenues.length === 0) {
    return {
      erreur: "Sélectionnez d'abord au moins une compétence (mots-clés ou IA).",
    };
  }

  const listeCompetences = competencesRetenues.map((c) => `- ${c}`).join("\n");

  const prompt = `Tu aides un parent qui pratique l'instruction en famille (cycle 1, école maternelle française) à rédiger une observation pédagogique pour son carnet de suivi.

Ce que le parent a déjà écrit :
Titre : "${titre.trim()}"
Description : "${descriptionBrute.trim() || "(aucune)"}"

Compétences du programme officiel déjà retenues pour cette activité :
${listeCompetences}

Rédige un court paragraphe (3 à 5 phrases) qui décrit cette activité de façon factuelle et nuancée, en reliant clairement ce que l'enfant a fait aux compétences ci-dessus, avec un vocabulaire pédagogique clair et adapté.

Règles impératives :
- N'invente aucun détail, aucune réaction, aucun résultat que le parent n'a pas mentionné. S'il manque de détails, reste général plutôt que d'inventer.
- Ne recopie jamais le texte du programme officiel mot pour mot : reformule entièrement avec tes propres mots.
- N'ajoute ni introduction, ni titre, ni commentaire : réponds uniquement avec le paragraphe.`;

  const resultat = await appellerClaude(prompt, MODELE_REDACTION, 400);
  if ("erreur" in resultat) return resultat;

  const texte = resultat.texte.trim();
  if (!texte) {
    return { erreur: "L'IA n'a pas produit de texte. Merci de réessayer." };
  }

  return { texte };
}
