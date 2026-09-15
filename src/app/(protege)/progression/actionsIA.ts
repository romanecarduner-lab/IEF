"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";

const MODELE_REDACTION = "claude-sonnet-5";

async function appellerClaude(
  prompt: string,
  maxTokens: number
): Promise<
  { texte: string; tronque: boolean; stopReason: string | null } | { erreur: string }
> {
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
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error("Erreur API Anthropic", reponse.status, detail);
      return { erreur: `L'IA n'a pas pu répondre (code ${reponse.status}).` };
    }

    const donnees = await reponse.json();
    // Cherche le premier bloc de type "text", quelle que soit sa
    // position dans le tableau (ne pas supposer qu'il est toujours en
    // position 0 -- deja pris en defaut une fois).
    const blocTexte = Array.isArray(donnees?.content)
      ? donnees.content.find((bloc: { type?: string }) => bloc?.type === "text")
      : null;
    return {
      texte: blocTexte?.text ?? "",
      // "max_tokens" signifie que la reponse a ete coupee faute de place :
      // le texte n'est pas termine, meme s'il n'y a aucune erreur.
      tronque: donnees?.stop_reason === "max_tokens",
      stopReason: donnees?.stop_reason ?? null,
    };
  } catch (erreurReseau) {
    console.error("Erreur réseau vers l'API Anthropic", erreurReseau);
    return { erreur: "Impossible de contacter l'IA. Vérifiez la connexion et réessayez." };
  }
}

/**
 * Genere une veritable synthese pedagogique pour une competence, a partir
 * de TOUTES les observations enregistrees sur l'annee (pas seulement 1 ou
 * 2 exemples) : ce que demande un inspecteur, c'est la comprehension de
 * la competence par l'enfant et son evolution, pas un simple constat.
 *
 * Regenerable a volonte : au fur et a mesure que de nouvelles
 * observations sont ajoutees, on peut relancer la generation pour
 * integrer les plus recentes.
 */
export async function genererSyntheseCompetenceIA(
  parcoursId: string,
  elementProgrammeId: string
): Promise<{ erreur: string } | { texte: string }> {
  const supabase = creerClientServeur();

  const { data: element } = await supabase
    .from("elements_programme")
    .select("libelle, parent_id")
    .eq("id", elementProgrammeId)
    .maybeSingle();

  if (!element) return { erreur: "Compétence introuvable." };

  const { data: chemin } = await supabase.rpc("chemin_element_programme", {
    p_element_id: element.parent_id as string,
  });

  const { data: observations } = await supabase
    .from("observations_elements_programme")
    .select(
      `niveau_autonomie:niveaux_autonomie(libelle), justification, commentaire_pedagogique,
       activites!inner(parcours_id, titre, date_activite, description, observations, contextes_activite(libelle))`
    )
    .eq("element_programme_id", elementProgrammeId)
    .eq("activites.parcours_id", parcoursId)
    .order("activites(date_activite)", { ascending: true });

  if (!observations || observations.length === 0) {
    return { erreur: "Aucune observation enregistrée pour cette compétence." };
  }

  const observationsTexte = observations
    .map((o, i) => {
      const a = Array.isArray(o.activites) ? o.activites[0] : o.activites;
      const contexteBrut = a?.contextes_activite;
      const contexte = Array.isArray(contexteBrut) ? contexteBrut[0] : contexteBrut;
      const niveau = Array.isArray(o.niveau_autonomie) ? o.niveau_autonomie[0] : o.niveau_autonomie;
      const morceaux = [
        `Observation ${i + 1} (${a?.date_activite ? new Date(a.date_activite as string).toLocaleDateString("fr-FR") : "date inconnue"})`,
        `Activité : ${a?.titre ?? ""}${contexte ? " — " + contexte.libelle : ""}`,
        a?.description ? `Description : ${a.description}` : null,
        a?.observations ? `Observations : ${a.observations}` : null,
        niveau ? `Niveau d'autonomie observé : ${niveau.libelle}` : null,
        o.justification ? `Justification : ${o.justification}` : null,
        o.commentaire_pedagogique ? `Commentaire : ${o.commentaire_pedagogique}` : null,
      ].filter(Boolean);
      return morceaux.join("\n");
    })
    .join("\n\n");

  const prompt = `Tu aides un parent qui pratique l'instruction en famille (cycle 1, école maternelle française) à rédiger, pour le contrôle pédagogique académique, une synthèse sur une compétence précise du programme officiel.

Compétence concernée : "${element.libelle}"
Contexte dans le programme : ${chemin ?? ""}

Voici TOUTES les observations enregistrées pour cette compétence sur l'année, dans l'ordre chronologique :

${observationsTexte}

Rédige une synthèse pédagogique (5 à 8 phrases) qui va au-delà d'un simple constat des faits. Un inspecteur académique a explicitement demandé un vrai développement pédagogique : explique COMMENT l'enfant comprend et mobilise cette compétence, pas seulement CE QU'il a fait. Mets en évidence, si les observations le permettent : l'évolution dans le temps, la diversité des contextes où la compétence a été mobilisée, le degré de compréhension (mécanique vs réellement intégré), et toute nuance pertinente.

Règles impératives :
- Base-toi uniquement sur les observations fournies : n'invente aucun fait, aucune date, aucun détail absent du texte ci-dessus.
- Ne cite JAMAIS de date précise, ni le nombre d'observations, de dates ou de contextes ("trois fois", "à plusieurs reprises le...", "sur quatre observations"...) : c'est une synthèse qualitative, pas un décompte. Utilise plutôt des formulations comme "de façon récurrente", "au fil du temps", "dans des situations variées" quand c'est pertinent.
- S'il n'y a qu'une seule observation, reste prudent sur l'évolution (tu ne peux pas décrire une progression avec un seul point de mesure) mais peux quand même analyser la nature de la compréhension démontrée.
- N'ajoute ni introduction, ni titre, ni commentaire : réponds uniquement avec le paragraphe de synthèse.`;

  let resultat = await appellerClaude(prompt, 1200);
  if ("erreur" in resultat) return resultat;

  // Marge de securite : si malgre tout la reponse est coupee faute de
  // place, ou vide (alea occasionnel du modele), on relance une seule
  // fois avec beaucoup plus de marge plutot que de renvoyer un echec.
  if (resultat.tronque || !resultat.texte.trim()) {
    const nouvelleTentative = await appellerClaude(prompt, 2400);
    if (!("erreur" in nouvelleTentative) && nouvelleTentative.texte.trim()) {
      resultat = nouvelleTentative;
    }
  }

  const texte = resultat.texte.trim();
  if (!texte) {
    return {
      erreur: `L'IA n'a pas produit de texte après deux tentatives (motif d'arrêt : ${
        "stopReason" in resultat ? resultat.stopReason ?? "inconnu" : "inconnu"
      }). Réessayez ; si ça persiste, dites-le pour qu'on regarde le détail technique.`,
    };
  }

  const { data: syntheseExistante } = await supabase
    .from("syntheses_progression")
    .select("id")
    .eq("parcours_id", parcoursId)
    .eq("element_programme_id", elementProgrammeId)
    .maybeSingle();

  if (syntheseExistante) {
    const { error: erreurMaj } = await supabase
      .from("syntheses_progression")
      .update({ synthese_ia: texte, synthese_ia_generee_le: new Date().toISOString() })
      .eq("id", syntheseExistante.id);

    if (erreurMaj) {
      console.error("Erreur lors de l'enregistrement de la synthese IA (update)", erreurMaj);
      return {
        erreur: `La synthèse a été générée mais n'a pas pu être enregistrée : ${erreurMaj.message}`,
      };
    }
  } else {
    // Aucun statut global n'a encore ete confirme par le parent pour
    // cette competence : on cree la ligne avec un statut de depart neutre
    // ("premiere observation"), que le parent pourra ajuster ensuite --
    // la synthese IA ne doit jamais rester sans endroit ou se sauvegarder.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: statutDepart } = await supabase
      .from("statuts_progression")
      .select("id")
      .eq("code", "premiere_observation")
      .maybeSingle();

    if (!statutDepart || !user) {
      return {
        erreur:
          "La synthèse a été générée mais n'a pas pu être enregistrée (statut de départ introuvable).",
      };
    }

    const { error: erreurInsert } = await supabase.from("syntheses_progression").insert({
      parcours_id: parcoursId,
      element_programme_id: elementProgrammeId,
      statut_global_id: statutDepart.id,
      valide_par: user.id,
      valide_par_nom_affiche: user.email ?? "Parent",
      synthese_ia: texte,
      synthese_ia_generee_le: new Date().toISOString(),
    });

    if (erreurInsert) {
      console.error("Erreur lors de l'enregistrement de la synthese IA (insert)", erreurInsert);
      return {
        erreur: `La synthèse a été générée mais n'a pas pu être enregistrée : ${erreurInsert.message}`,
      };
    }
  }

  revalidatePath("/progression");
  return { texte };
}

/**
 * Permet de modifier a la main le texte d'une synthese generee par IA
 * (ou d'en ecrire une entierement soi-meme) : le texte reste toujours
 * la propriete du parent, jamais fige une fois genere.
 */
export async function modifierSyntheseIA(
  parcoursId: string,
  elementProgrammeId: string,
  texte: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();

  const { error } = await supabase
    .from("syntheses_progression")
    .update({ synthese_ia: texte || null })
    .eq("parcours_id", parcoursId)
    .eq("element_programme_id", elementProgrammeId);

  if (error) {
    console.error("Erreur lors de la modification manuelle de la synthese IA", error);
    return { erreur: `Impossible d'enregistrer la modification : ${error.message}` };
  }

  revalidatePath("/progression");
  return { ok: true };
}

/**
 * Etape 5 du chantier "progression automatique" : quand le moteur
 * deterministe (src/lib/moteurProgression.ts) ne peut pas conclure seul
 * (alternance persistante, regression, signaux contradictoires), l'IA
 * prend le relais -- mais seulement dans ce cas precis, jamais en
 * remplacement du moteur pour les situations simples qu'il sait deja
 * trancher sans aide.
 *
 * Contrairement a une regle, l'IA peut nuancer sa reponse : si meme elle
 * juge la situation impossible a trancher raisonnablement, statutCode
 * reste null et la situation demeure non concluante -- jamais de choix
 * force.
 */
export type ObservationPourEstimationIA = {
  niveauLibelle: string;
  date: string;
  contexteLibelle: string;
  justification: string | null;
};

export type ResultatEstimationIA =
  | { erreur: string }
  | { concluant: false; raison: string }
  | { concluant: true; statutCode: string; justification: string };

const CODES_STATUTS_VALIDES = [
  "non_encore_observe",
  "premiere_observation",
  "en_cours_exploration",
  "realise_avec_accompagnement",
  "realise_autonome",
  "mobilise_spontanement",
  "mobilise_plusieurs_contextes",
];

export async function estimerProgressionIA(
  competenceLibelle: string,
  raisonNonConcluant: string,
  observations: ObservationPourEstimationIA[]
): Promise<ResultatEstimationIA> {
  const listeObservations = observations
    .map((o, i) => {
      const morceaux = [
        `Observation ${i + 1} (${o.date}) — contexte : ${o.contexteLibelle}`,
        `Niveau d'autonomie observé : ${o.niveauLibelle}`,
        o.justification ? `Justification : ${o.justification}` : null,
      ].filter(Boolean);
      return morceaux.join("\n");
    })
    .join("\n\n");

  const prompt = `Tu aides à analyser la progression d'un enfant en instruction en famille (cycle 1, école maternelle française) sur une compétence précise du programme officiel, dans un cas que des règles automatiques simples n'ont pas réussi à trancher.

Compétence : "${competenceLibelle}"

Un premier passage par des règles déterministes n'a pas conclu, pour la raison suivante : ${raisonNonConcluant}

Voici toutes les observations disponibles, dans l'ordre chronologique :

${listeObservations}

Les 7 statuts officiels possibles, du moins au plus avancé, avec leur code exact :
- non_encore_observe : Non encore observé
- premiere_observation : Première observation
- en_cours_exploration : En cours d'exploration
- realise_avec_accompagnement : Réalisé avec accompagnement
- realise_autonome : Réalisé de manière autonome
- mobilise_spontanement : Mobilisé spontanément
- mobilise_plusieurs_contextes : Mobilisé dans plusieurs contextes

Analyse cette situation en tenant compte de l'ensemble des observations (évolution dans le temps, variation selon les contextes, nuances données en justification). Détermine si un statut global peut raisonnablement être retenu malgré la complexité de la situation.

Règles impératives :
- Si la situation reste réellement trop ambiguë ou contradictoire pour trancher raisonnablement, réponds avec statutCode à null plutôt que de forcer un choix arbitraire.
- Base-toi uniquement sur les observations fournies : n'invente aucun fait absent du texte ci-dessus.
- Dans la justification, ne cite aucune date précise ni le nombre d'observations ("trois fois", "sur quatre occasions"...) : reste qualitatif.
- Réponds UNIQUEMENT avec un objet JSON de cette forme exacte, sans rien d'autre autour :
{"statutCode": "<un des codes ci-dessus, ou null>", "justification": "..."}`;

  const resultat = await appellerClaude(prompt, 500);
  if ("erreur" in resultat) return resultat;

  let donnees: unknown;
  try {
    const nettoye = resultat.texte
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "");
    donnees = JSON.parse(nettoye);
  } catch {
    console.error("Réponse IA (estimation progression) non interprétable :", resultat.texte);
    return { erreur: "La réponse de l'IA n'a pas pu être lue. Merci de réessayer." };
  }

  if (typeof donnees !== "object" || donnees === null) {
    return { erreur: "Réponse IA inattendue. Merci de réessayer." };
  }
  const objetReponse = donnees as { statutCode?: unknown; justification?: unknown };
  const justification =
    typeof objetReponse.justification === "string" ? objetReponse.justification.trim() : "";

  if (
    typeof objetReponse.statutCode !== "string" ||
    !CODES_STATUTS_VALIDES.includes(objetReponse.statutCode)
  ) {
    return {
      concluant: false,
      raison:
        justification ||
        "L'IA n'a pas pu déterminer de statut fiable pour cette situation : une analyse humaine reste préférable.",
    };
  }

  return { concluant: true, statutCode: objetReponse.statutCode, justification };
}

/**
 * Propose des idees d'activites concretes pour une competence pas encore
 * abordee, ancrees dans le texte officiel du programme (exemples de
 * reussite deja importes) plutot que des suggestions vagues. Purement
 * inspirationnel : aucune ecriture en base, le parent reste libre de
 * suivre ou non ces idees.
 */
export type IdeeActivite = { titre: string; description: string };
export type ResultatIdeesActivites = { erreur: string } | { idees: IdeeActivite[] };

export async function genererIdeesActivites(
  elementProgrammeId: string
): Promise<ResultatIdeesActivites> {
  const supabase = creerClientServeur();

  const { data: element } = await supabase
    .from("elements_programme")
    .select("libelle, parent_id")
    .eq("id", elementProgrammeId)
    .maybeSingle();

  if (!element) return { erreur: "Compétence introuvable." };

  const [{ data: chemin }, { data: exemples }] = await Promise.all([
    supabase.rpc("chemin_element_programme", { p_element_id: element.parent_id as string }),
    supabase.rpc("lister_exemples_reussite", { p_objectif_id: elementProgrammeId }),
  ]);

  const listeExemples = (exemples ?? [])
    .map((e: { exemple: string }) => `- ${e.exemple}`)
    .join("\n");

  const prompt = `Tu aides un parent qui pratique l'instruction en famille (cycle 1, école maternelle française) à trouver des idées d'activités concrètes pour travailler une compétence précise du programme officiel, que son enfant n'a pas encore abordée.

Compétence : "${element.libelle}"
Contexte dans le programme : ${chemin ?? ""}
${listeExemples ? `\nExemples officiels de réussite pour cette compétence :\n${listeExemples}\n` : ""}

Propose 3 idées d'activités concrètes et réalistes pour un enfant de cet âge, faisables à la maison ou en sortie, qui permettraient de travailler précisément cette compétence. Pour chaque idée, donne un titre court (5-8 mots) et une phrase expliquant comment elle travaille la compétence.

Règles impératives :
- Reste concret et réalisable simplement, pas de matériel spécialisé ou coûteux.
- Ancre chaque idée dans ce que décrit la compétence (et ses exemples de réussite si fournis), pas des activités génériques sans lien direct.
- Réponds UNIQUEMENT avec un tableau JSON de cette forme exacte, sans rien d'autre autour :
[{"titre": "...", "description": "..."}, {"titre": "...", "description": "..."}, {"titre": "...", "description": "..."}]`;

  const resultat = await appellerClaude(prompt, 700);
  if ("erreur" in resultat) return resultat;

  let donnees: unknown;
  try {
    const nettoye = resultat.texte
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "");
    donnees = JSON.parse(nettoye);
  } catch {
    console.error("Réponse IA (idées d'activités) non interprétable :", resultat.texte);
    return { erreur: "La réponse de l'IA n'a pas pu être lue. Merci de réessayer." };
  }

  if (!Array.isArray(donnees)) {
    return { erreur: "Réponse IA inattendue. Merci de réessayer." };
  }

  const idees: IdeeActivite[] = donnees
    .filter(
      (d): d is { titre: unknown; description: unknown } =>
        typeof d === "object" && d !== null
    )
    .map((d) => ({
      titre: typeof d.titre === "string" ? d.titre : "",
      description: typeof d.description === "string" ? d.description : "",
    }))
    .filter((d) => d.titre && d.description);

  if (idees.length === 0) {
    return { erreur: "L'IA n'a pas produit d'idées exploitables. Merci de réessayer." };
  }

  return { idees };
}
