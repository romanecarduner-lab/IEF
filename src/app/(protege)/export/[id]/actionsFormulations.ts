"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";

const MODELE_REDACTION = "claude-sonnet-5";

async function appellerClaude(
  prompt: string,
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
        model: MODELE_REDACTION,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error("Erreur API Anthropic (export)", reponse.status, detail);
      return { erreur: `L'IA n'a pas pu répondre (code ${reponse.status}).` };
    }

    const donnees = await reponse.json();
    const blocTexte = Array.isArray(donnees?.content)
      ? donnees.content.find((bloc: { type?: string }) => bloc?.type === "text")
      : null;
    return { texte: (blocTexte?.text as string | undefined)?.trim() ?? "" };
  } catch (erreur) {
    console.error("Erreur reseau appel IA (export)", erreur);
    return { erreur: "Impossible de contacter l'IA. Merci de réessayer." };
  }
}

type ExempleActivite = {
  id: string;
  titre: string;
  date: string;
  texte: string;
};

/**
 * Prepare, en une fois, les formulations pedagogiques de toutes les
 * competences du cycle qui ont deja un statut valide (donc au moins une
 * observation) et n'ont pas encore de formulation, ou dont la
 * formulation n'a jamais ete modifiee a la main par le parent (pour ne
 * jamais ecraser un texte deja relu et corrige). Les competences non
 * encore abordees ne sont jamais envoyees a l'IA : rien n'est invente
 * pour elles.
 *
 * Regroupe les competences par domaine pour limiter le nombre d'appels
 * (un appel par domaine ayant des competences a preparer, plutot qu'un
 * appel par competence).
 */
export async function preparerFormulationsExport(
  dossierId: string
): Promise<{ erreur: string } | { nbPreparees: number }> {
  const supabase = creerClientServeur();

  const { data: dossier } = await supabase
    .from("dossiers_export")
    .select("parcours_id, parcours_scolaires(enfant_id, cycle_id)")
    .eq("id", dossierId)
    .maybeSingle();

  if (!dossier) return { erreur: "Dossier introuvable." };

  const parcours = Array.isArray(dossier.parcours_scolaires)
    ? dossier.parcours_scolaires[0]
    : dossier.parcours_scolaires;
  const enfantId = parcours?.enfant_id as string | undefined;
  const cycleId = parcours?.cycle_id as string | undefined;
  if (!enfantId || !cycleId) return { erreur: "Parcours introuvable." };

  const [{ data: tousLesObjectifs }, { data: statutsValides }, { data: formulationsExistantes }] =
    await Promise.all([
      supabase
        .from("v_objectif_domaine")
        .select("objectif_id, libelle, domaine")
        .eq("cycle_id", cycleId),
      supabase
        .from("v_synthese_cumulee_cycle")
        .select("element_programme_id, statut_code")
        .eq("enfant_id", enfantId)
        .eq("cycle_id", cycleId),
      supabase
        .from("dossiers_export_formulations")
        .select("element_programme_id, modifie_par_parent")
        .eq("dossier_id", dossierId),
    ]);

  const statutParObjectif = new Map(
    (statutsValides ?? []).map((s) => [s.element_programme_id as string, s.statut_code as string])
  );
  const dejaModifieParParent = new Set(
    (formulationsExistantes ?? [])
      .filter((f) => f.modifie_par_parent)
      .map((f) => f.element_programme_id as string)
  );

  // Competences a preparer : ont un statut reel (donc au moins une
  // observation) ET dont la formulation n'a pas deja ete modifiee a la
  // main par le parent (on ne l'ecrase jamais).
  const aPreparer = (tousLesObjectifs ?? []).filter((o) => {
    const id = o.objectif_id as string;
    const statut = statutParObjectif.get(id);
    return statut && statut !== "non_encore_observe" && !dejaModifieParParent.has(id);
  });

  if (aPreparer.length === 0) return { nbPreparees: 0 };

  // Parcours du meme enfant et du meme cycle (pour le repli si aucun
  // exemple n'existe sur l'annee du dossier).
  const { data: parcoursMemeCycleBruts } = await supabase
    .from("parcours_scolaires")
    .select("id")
    .eq("enfant_id", enfantId)
    .eq("cycle_id", cycleId);
  const idsParcoursMemeCycle = (parcoursMemeCycleBruts ?? []).map((p) => p.id as string);

  let nbPreparees = 0;

  // Regroupe par domaine pour limiter le nombre d'appels IA.
  const parDomaine = new Map<string, typeof aPreparer>();
  for (const o of aPreparer) {
    const liste = parDomaine.get(o.domaine as string) ?? [];
    liste.push(o);
    parDomaine.set(o.domaine as string, liste);
  }

  for (const [, objectifsDomaine] of parDomaine) {
    // Pour chaque competence du domaine, trouve jusqu'a 2 exemples :
    // priorite aux activites de l'annee du dossier, repli sur les
    // autres annees du meme cycle si aucune n'existe sur cette annee.
    const donneesParObjectif = await Promise.all(
      objectifsDomaine.map(async (o) => {
        const objectifId = o.objectif_id as string;

        const { data: observationsAnneeCourante } = await supabase
          .from("observations_elements_programme")
          .select("activites!inner(id, titre, date_activite, description, observations, parcours_id)")
          .eq("element_programme_id", objectifId)
          .eq("activites.parcours_id", dossier.parcours_id as string)
          .order("activites(date_activite)", { ascending: false })
          .limit(2);

        let activitesBrutes = observationsAnneeCourante ?? [];
        if (activitesBrutes.length === 0 && idsParcoursMemeCycle.length > 0) {
          const { data: observationsAutresAnnees } = await supabase
            .from("observations_elements_programme")
            .select(
              "activites!inner(id, titre, date_activite, description, observations, parcours_id)"
            )
            .eq("element_programme_id", objectifId)
            .in("activites.parcours_id", idsParcoursMemeCycle)
            .order("activites(date_activite)", { ascending: false })
            .limit(2);
          activitesBrutes = observationsAutresAnnees ?? [];
        }

        const exemples: ExempleActivite[] = activitesBrutes
          .map((obs) => {
            const a = Array.isArray(obs.activites) ? obs.activites[0] : obs.activites;
            if (!a) return null;
            const texte = [a.description as string | null, a.observations as string | null]
              .filter(Boolean)
              .join(" — ");
            return {
              id: a.id as string,
              titre: a.titre as string,
              date: a.date_activite as string,
              texte,
            };
          })
          .filter((e): e is ExempleActivite => Boolean(e));

        return { objectifId, libelle: o.libelle as string, exemples };
      })
    );

    const avecExemples = donneesParObjectif.filter((d) => d.exemples.length > 0);
    if (avecExemples.length === 0) continue;

    const blocCompetences = avecExemples
      .map(
        (d, i) =>
          `${i + 1}. Compétence : "${d.libelle}"\n${d.exemples
            .map((e) => `   - ${new Date(e.date).toLocaleDateString("fr-FR")} : ${e.titre}${e.texte ? ` — ${e.texte}` : ""}`)
            .join("\n")}`
      )
      .join("\n\n");

    const prompt = `Tu aides un parent qui pratique l'instruction en famille à rédiger, pour un dossier destiné au contrôle pédagogique académique, une courte formulation pédagogique pour chacune des compétences suivantes, à partir des activités déjà enregistrées.

${blocCompetences}

Pour CHAQUE compétence numérotée ci-dessus, rédige un texte de 2 à 4 phrases qui explique ce que les exemples fournis montrent de la compréhension et de la mobilisation de cette compétence par l'enfant.

Règles impératives :
- Base-toi uniquement sur les exemples fournis pour cette compétence précise : n'invente aucun fait, aucune date, aucun détail absent.
- Ne déduis jamais qu'une compétence est acquise ou maîtrisée : décris ce que montrent les exemples, sans conclure sur un niveau de maîtrise (le statut réel est décidé séparément par le parent, ton texte doit rester compatible avec n'importe quel statut).
- Ne cite jamais de date précise ni de décompte du nombre d'observations.
- Réponds UNIQUEMENT avec un tableau JSON de cette forme exacte, sans rien d'autre autour :
[{"numero": 1, "texte": "..."}, {"numero": 2, "texte": "..."}]`;

    const resultat = await appellerClaude(prompt, 400 * avecExemples.length + 300);
    if ("erreur" in resultat) {
      console.error("Erreur lors de la preparation groupee (domaine)", resultat.erreur);
      continue;
    }

    let items: { numero: number; texte: string }[] = [];
    try {
      const nettoye = resultat.texte
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "");
      items = JSON.parse(nettoye);
    } catch (e) {
      console.error("Reponse IA non exploitable (preparation export)", e, resultat.texte);
      continue;
    }

    for (const item of items) {
      const cible = avecExemples[item.numero - 1];
      if (!cible) continue;
      await supabase.from("dossiers_export_formulations").upsert(
        {
          dossier_id: dossierId,
          element_programme_id: cible.objectifId,
          texte: item.texte,
          exemple_activite_ids: cible.exemples.map((e) => e.id),
          genere_le: new Date().toISOString(),
          modifie_par_parent: false,
        },
        { onConflict: "dossier_id,element_programme_id" }
      );
      nbPreparees++;
    }
  }

  revalidatePath(`/export/${dossierId}`);
  return { nbPreparees };
}

/**
 * Enregistre le texte d'une formulation modifie a la main par le
 * parent -- marque modifie_par_parent pour que la preparation groupee
 * ne l'ecrase plus jamais ensuite.
 */
export async function enregistrerFormulation(
  dossierId: string,
  elementProgrammeId: string,
  texte: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();

  const { error } = await supabase.from("dossiers_export_formulations").upsert(
    {
      dossier_id: dossierId,
      element_programme_id: elementProgrammeId,
      texte,
      modifie_par_parent: true,
    },
    { onConflict: "dossier_id,element_programme_id" }
  );

  if (error) {
    console.error("Erreur lors de l'enregistrement de la formulation", error);
    return { erreur: "Impossible d'enregistrer. Merci de réessayer." };
  }

  revalidatePath(`/export/${dossierId}`);
  return { ok: true };
}
