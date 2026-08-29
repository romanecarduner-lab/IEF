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
