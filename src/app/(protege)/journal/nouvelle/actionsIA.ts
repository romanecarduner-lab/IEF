"use server";

import { creerClientServeur } from "@/lib/supabase/server";

const MODELE_REDACTION = "claude-sonnet-5"; // vision + redaction : qualite superieure, cout minime vu la taille du prompt

export type SuggestionIA = { id: string; libelle: string; chemin: string | null };
export type ResultatFormulation = { erreur: string } | { texte: string };
export type ResultatDescriptionCompetences =
  | { erreur: string }
  | { description: string; suggestions: SuggestionIA[] };

type BlocContenu =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

/**
 * Appelle l'API Anthropic et renvoie le texte de la reponse, ou leve une
 * erreur avec un message deja adapte a l'affichage utilisateur. Accepte
 * soit un simple texte, soit un tableau de blocs (texte + images) pour
 * les appels utilisant la vision.
 */
async function appellerClaude(
  contenu: string | BlocContenu[],
  maxTokens: number
): Promise<{ texte: string; tronque: boolean } | { erreur: string }> {
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
        model: MODELE_REDACTION,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: contenu }],
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error("Erreur API Anthropic", reponse.status, detail);
      return { erreur: "L'IA n'a pas pu répondre. Merci de réessayer." };
    }

    const donnees = await reponse.json();
    return {
      texte: donnees?.content?.[0]?.text ?? "",
      tronque: donnees?.stop_reason === "max_tokens",
    };
  } catch (erreurReseau) {
    console.error("Erreur réseau vers l'API Anthropic", erreurReseau);
    return { erreur: "Impossible de contacter l'IA. Vérifiez la connexion et réessayez." };
  }
}

function nettoyerJSON(texte: string): string {
  return texte
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
}

/**
 * Etape unique et fusionnee : a partir du titre, du prenom de l'enfant et
 * d'une ou plusieurs photos (vision), Claude redige un TRES COURT texte
 * du point de vue du parent (pas une description visuelle exhaustive) ET
 * identifie directement les objectifs du programme officiel mobilises --
 * en une seule reflexion, comme le ferait un parent qui ecrit sur son
 * enfant en connaissant deja les attendus. Remplace les deux anciennes
 * etapes separees (description froide puis suggestion a part).
 *
 * Regles imperatives imposees au modele : jamais de description de
 * l'apparence physique de l'enfant, toujours son prenom (jamais
 * "l'enfant"), rien d'invente au-dela de ce qui est visible/indique.
 */
export async function genererDescriptionEtCompetencesIA(
  titre: string,
  prenomEnfant: string,
  images: { base64: string; mediaType: string }[]
): Promise<ResultatDescriptionCompetences> {
  if (!titre.trim()) {
    return { erreur: "Le titre est requis." };
  }

  const supabase = creerClientServeur();
  const { data: objectifsBruts, error: erreurRequete } = await supabase
    .from("elements_programme")
    .select("id, parent_id, libelle, types_element_programme!inner(code)")
    .eq("types_element_programme.code", "objectif")
    .order("libelle");

  if (erreurRequete || !objectifsBruts || objectifsBruts.length === 0) {
    return { erreur: "Impossible de charger le programme officiel." };
  }

  const objectifs = objectifsBruts.map((o) => ({
    id: o.id as string,
    parentId: o.parent_id as string,
    libelle: o.libelle as string,
  }));
  const listeNumerotee = objectifs.map((o, i) => `${i + 1}. ${o.libelle}`).join("\n");

  const nomEnfant = prenomEnfant.trim() || "l'enfant";
  const aDesImages = images.length > 0;

  const prompt = `Tu aides un parent qui pratique l'instruction en famille (cycle 1, école maternelle française) à documenter une activité de son enfant, ${nomEnfant}, pour son carnet de suivi pédagogique — en vue d'un contrôle académique.

${aDesImages ? "Regarde la ou les photo(s) ci-jointe(s). " : ""}Titre donné par le parent : "${titre.trim()}"

Voici la liste numérotée de tous les objectifs du programme officiel :
${listeNumerotee}

Fais deux choses en une seule réflexion, comme le ferait le parent lui-même :

1. Rédige un TRÈS COURT texte (2 à 3 phrases maximum), à la première personne du point de vue du parent qui observe ${nomEnfant} — pas une description visuelle exhaustive, mais l'essentiel de l'action et de ce qu'elle mobilise comme apprentissage. Utilise le prénom ${nomEnfant}, jamais "l'enfant". Ne décris JAMAIS l'apparence physique de ${nomEnfant} (couleur des cheveux, vêtements, traits du visage) : ce n'est pas pertinent pour un carnet pédagogique.

2. Identifie, parmi la liste numérotée ci-dessus, les objectifs clairement mobilisés par cette activité (au maximum 5, du plus au moins pertinent).

Règles impératives :
- Ne décris et n'évoque que ce qui est visible ou clairement suggéré par le titre et la ou les photo(s) : n'invente aucun détail, aucune réaction, aucun résultat.
- Réponds UNIQUEMENT avec un objet JSON de cette forme exacte, sans rien d'autre autour :
{"description": "...", "objectifs": [12, 87]}`;

  const contenu: BlocContenu[] = images.map((img) => ({
    type: "image" as const,
    source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
  }));
  contenu.push({ type: "text", text: prompt });

  let resultat = await appellerClaude(contenu, 900);
  if ("erreur" in resultat) return resultat;

  if (resultat.tronque) {
    const nouvelleTentative = await appellerClaude(contenu, 1800);
    if (!("erreur" in nouvelleTentative)) {
      resultat = nouvelleTentative;
    }
  }

  let donnees: unknown;
  try {
    donnees = JSON.parse(nettoyerJSON(resultat.texte));
  } catch {
    console.error("Réponse IA non interprétable comme JSON :", resultat.texte);
    return { erreur: "La réponse de l'IA n'a pas pu être lue. Merci de réessayer." };
  }

  if (typeof donnees !== "object" || donnees === null) {
    return { erreur: "Réponse IA inattendue. Merci de réessayer." };
  }
  const objetReponse = donnees as { description?: unknown; objectifs?: unknown };
  const description =
    typeof objetReponse.description === "string" ? objetReponse.description.trim() : "";
  const indices = Array.isArray(objetReponse.objectifs) ? objetReponse.objectifs : [];

  if (!description) {
    return { erreur: "L'IA n'a pas produit de description. Merci de réessayer." };
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

  return { description, suggestions };
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

  let resultat = await appellerClaude(prompt, 700);
  if ("erreur" in resultat) return resultat;

  if (resultat.tronque) {
    const nouvelleTentative = await appellerClaude(prompt, 1400);
    if (!("erreur" in nouvelleTentative)) {
      resultat = nouvelleTentative;
    }
  }

  const texte = resultat.texte.trim();
  if (!texte) {
    return { erreur: "L'IA n'a pas produit de texte. Merci de réessayer." };
  }

  return { texte };
}
