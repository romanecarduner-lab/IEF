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

type ActiviteCandidate = {
  id: string;
  titre: string;
  date: string;
  texte: string;
};

/**
 * Prepare, en une fois, pour chaque sous-domaine ayant au moins une
 * competence observee (statut cumulatif reel, pas seulement une
 * observation brute non validee) : une synthese qui melange les
 * competences observees de ce sous-domaine (ecrite au positif, en
 * mentionnant "en cours d'acquisition" la ou c'est pertinent, sans
 * jamais lister ce qui n'est pas fait), et 2 exemples d'activites
 * illustratifs, chacun avec sa propre synthese pedagogique courte.
 * Un sous-domaine sans aucune competence observee n'apparait pas du
 * tout -- rien n'est invente pour lui.
 *
 * Les exemples sont choisis en priorite parmi les activites de
 * l'annee du dossier ; a defaut, parmi les autres annees du meme
 * cycle.
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

  const [{ data: statutsCumules }, { data: chemins }, { data: sousDomainesExistants }] =
    await Promise.all([
      supabase
        .from("v_synthese_cumulee_cycle")
        .select("element_programme_id, statut_code")
        .eq("enfant_id", enfantId)
        .eq("cycle_id", cycleId),
      supabase.from("v_chemin_complet_objectif").select("objectif_id, chemin"),
      supabase
        .from("dossiers_export_sous_domaines")
        .select("sous_domaine, modifie_par_parent")
        .eq("dossier_id", dossierId),
    ]);

  const dejaModifiesParParent = new Set(
    (sousDomainesExistants ?? [])
      .filter((s) => s.modifie_par_parent)
      .map((s) => s.sous_domaine as string)
  );

  const cheminParObjectif = new Map(
    (chemins ?? []).map((c) => [c.objectif_id as string, c.chemin as string])
  );

  // Regroupe les competences deja observees (statut valide reel) par
  // sous-domaine (2e segment du chemin complet).
  const objectifsParSousDomaine = new Map<
    string,
    { domaine: string; objectifIds: string[] }
  >();
  for (const s of statutsCumules ?? []) {
    if (s.statut_code === "non_encore_observe") continue;
    const objectifId = s.element_programme_id as string;
    const chemin = cheminParObjectif.get(objectifId);
    if (!chemin) continue;
    const segments = chemin.split(" > ");
    const domaine = segments[0] ?? "";
    const sousDomaine = segments[1] ?? segments[0] ?? "";
    const entree = objectifsParSousDomaine.get(sousDomaine) ?? { domaine, objectifIds: [] };
    entree.objectifIds.push(objectifId);
    objectifsParSousDomaine.set(sousDomaine, entree);
  }

  const { data: parcoursMemeCycleBruts } = await supabase
    .from("parcours_scolaires")
    .select("id")
    .eq("enfant_id", enfantId)
    .eq("cycle_id", cycleId);
  const idsParcoursMemeCycle = (parcoursMemeCycleBruts ?? []).map((p) => p.id as string);

  let nbPreparees = 0;

  for (const [sousDomaine, { domaine, objectifIds }] of objectifsParSousDomaine) {
    if (dejaModifiesParParent.has(sousDomaine)) continue;

    const { data: activitesAnneeCourante } = await supabase
      .from("observations_elements_programme")
      .select("activites!inner(id, titre, date_activite, description, observations, parcours_id)")
      .in("element_programme_id", objectifIds)
      .eq("activites.parcours_id", dossier.parcours_id as string)
      .order("activites(date_activite)", { ascending: false });

    let activitesBrutes = activitesAnneeCourante ?? [];
    if (activitesBrutes.length === 0 && idsParcoursMemeCycle.length > 0) {
      const { data: activitesAutresAnnees } = await supabase
        .from("observations_elements_programme")
        .select(
          "activites!inner(id, titre, date_activite, description, observations, parcours_id)"
        )
        .in("element_programme_id", objectifIds)
        .in("activites.parcours_id", idsParcoursMemeCycle)
        .order("activites(date_activite)", { ascending: false });
      activitesBrutes = activitesAutresAnnees ?? [];
    }

    const vues = new Set<string>();
    const candidats: ActiviteCandidate[] = [];
    for (const obs of activitesBrutes) {
      const a = Array.isArray(obs.activites) ? obs.activites[0] : obs.activites;
      if (!a || vues.has(a.id as string)) continue;
      vues.add(a.id as string);
      const texte = [a.description as string | null, a.observations as string | null]
        .filter(Boolean)
        .join(" — ");
      candidats.push({
        id: a.id as string,
        titre: a.titre as string,
        date: a.date_activite as string,
        texte,
      });
    }

    if (candidats.length === 0) continue;

    const { data: objectifsDetailles } = await supabase
      .from("elements_programme")
      .select("id, libelle")
      .in("id", objectifIds);
    const libelleParObjectif = new Map(
      (objectifsDetailles ?? []).map((o) => [o.id as string, o.libelle as string])
    );
    const statutParObjectif = new Map(
      (statutsCumules ?? []).map((s) => [s.element_programme_id as string, s.statut_code as string])
    );
    const { data: statutsLibelles } = await supabase
      .from("statuts_progression")
      .select("code, libelle");
    const libelleParStatutCode = new Map(
      (statutsLibelles ?? []).map((s) => [s.code as string, s.libelle as string])
    );

    const blocCompetences = objectifIds
      .map((id) => {
        const libelle = libelleParObjectif.get(id) ?? "";
        const statut = libelleParStatutCode.get(statutParObjectif.get(id) ?? "") ?? "";
        return `- ${libelle} (${statut})`;
      })
      .join("\n");

    const exemplesRetenus = candidats.slice(0, 2);
    const blocExemples = exemplesRetenus
      .map(
        (e, i) =>
          `${i + 1}. "${e.titre}" (${new Date(e.date).toLocaleDateString("fr-FR")})${e.texte ? ` — ${e.texte}` : ""}`
      )
      .join("\n");

    const prompt = `Tu aides un parent qui pratique l'instruction en famille à préparer, pour un dossier destiné au contrôle pédagogique académique, le bilan d'un sous-domaine du programme officiel : "${sousDomaine}" (domaine : "${domaine}").

Compétences de ce sous-domaine déjà observées, avec leur statut réel :
${blocCompetences}

Deux activités retenues comme exemples pour ce sous-domaine :
${blocExemples}

Rédige trois textes distincts :
1. "synthese" : un paragraphe de 4 à 6 phrases qui décrit, en mélangeant naturellement les compétences listées ci-dessus, ce que l'enfant sait faire dans ce sous-domaine. Reste factuel et nuancé : pour une compétence encore "en cours d'acquisition" ou "à travailler", dis-le avec ce vocabulaire plutôt que de laisser croire à une maîtrise complète. Ne mentionne JAMAIS les compétences qui ne sont pas dans la liste ci-dessus (celles non encore abordées) : ce paragraphe ne parle que de ce qui a été observé.
2. "exemple1" : 2 à 3 phrases expliquant ce que la première activité montre de la compréhension de l'enfant.
3. "exemple2" : 2 à 3 phrases expliquant ce que la seconde activité montre${exemplesRetenus.length < 2 ? " (laisse vide si une seule activité est listée ci-dessus)" : ""}.

Règles impératives :
- Base-toi uniquement sur les compétences et activités listées ci-dessus : n'invente aucun fait, aucune date, aucun détail absent.
- Ne déduis jamais une maîtrise complète que le statut réel ne confirme pas.
- Ne recopie jamais le texte du programme officiel mot pour mot : reformule avec tes propres mots.
- Réponds UNIQUEMENT avec un objet JSON de cette forme exacte, sans rien d'autre autour :
{"synthese": "...", "exemple1": "...", "exemple2": "..."}`;

    const resultat = await appellerClaude(prompt, 1600);
    if ("erreur" in resultat) {
      console.error("Erreur lors de la preparation groupee (sous-domaine)", sousDomaine, resultat.erreur);
      continue;
    }

    let reponse: { synthese?: string; exemple1?: string; exemple2?: string } = {};
    try {
      const correspondance = resultat.texte.match(/\{[\s\S]*\}/);
      if (!correspondance) throw new Error("Aucun objet JSON trouve dans la reponse.");
      reponse = JSON.parse(correspondance[0]);
    } catch (e) {
      console.error("Reponse IA non exploitable (preparation export)", sousDomaine, e, resultat.texte);
      continue;
    }

    await supabase.from("dossiers_export_sous_domaines").upsert(
      {
        dossier_id: dossierId,
        domaine,
        sous_domaine: sousDomaine,
        synthese: reponse.synthese ?? null,
        exemple1_activite_id: exemplesRetenus[0]?.id ?? null,
        exemple1_synthese: reponse.exemple1 ?? null,
        exemple2_activite_id: exemplesRetenus[1]?.id ?? null,
        exemple2_synthese: exemplesRetenus[1] ? reponse.exemple2 ?? null : null,
        genere_le: new Date().toISOString(),
        modifie_par_parent: false,
      },
      { onConflict: "dossier_id,sous_domaine" }
    );
    nbPreparees++;
  }

  revalidatePath(`/export/${dossierId}`);
  return { nbPreparees };
}

/**
 * Enregistre un champ (synthese, exemple1_synthese ou exemple2_synthese)
 * modifie a la main par le parent pour un sous-domaine -- marque
 * modifie_par_parent pour que la preparation groupee ne l'ecrase plus
 * jamais ensuite (meme ses deux autres champs, pour rester simple et
 * previsible : une fois touche, un sous-domaine n'est plus regenere).
 */
export async function enregistrerSousDomaine(
  dossierId: string,
  sousDomaine: string,
  champ: "synthese" | "exemple1_synthese" | "exemple2_synthese",
  texte: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();

  const { error } = await supabase.from("dossiers_export_sous_domaines").upsert(
    {
      dossier_id: dossierId,
      sous_domaine: sousDomaine,
      [champ]: texte,
      modifie_par_parent: true,
    },
    { onConflict: "dossier_id,sous_domaine" }
  );

  if (error) {
    console.error("Erreur lors de l'enregistrement du sous-domaine", error);
    return { erreur: "Impossible d'enregistrer. Merci de réessayer." };
  }

  revalidatePath(`/export/${dossierId}`);
  return { ok: true };
}
