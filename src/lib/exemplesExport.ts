import type { SupabaseClient } from "@supabase/supabase-js";

/** Un exemple retenu pour un sous-domaine, tel que stocke dans la colonne `exemples`. */
export type ExempleStocke = {
  activite_id: string;
  synthese: string | null;
  trace_ids: string[];
};

export type PhotoCandidate = { id: string; chemin: string; miniature: string | null };

export type ActiviteCandidate = {
  id: string;
  titre: string;
  date: string;
  texte: string;
  anneeCourante: boolean;
  favori: boolean;
  photos: PhotoCandidate[];
};

export type ContexteExport = {
  parcoursDossierId: string;
  enfantId: string;
  cycleId: string;
  pronom: string | null;
  idsParcoursMemeCycle: string[];
  statutParObjectif: Map<string, string>;
  libelleParStatutCode: Map<string, string>;
  /** Competences observees (statut reel), groupees par sous-domaine (2e segment du chemin). */
  objectifsParSousDomaine: Map<string, { domaine: string; objectifIds: string[] }>;
};

export function morceaux<T>(liste: T[], taille: number): T[][] {
  const resultat: T[][] = [];
  for (let i = 0; i < liste.length; i += taille) resultat.push(liste.slice(i, i + taille));
  return resultat;
}

export function lireExemples(ligne: { exemples?: unknown }): ExempleStocke[] {
  if (!Array.isArray(ligne.exemples)) return [];
  const resultat: ExempleStocke[] = [];
  for (const brut of ligne.exemples as Record<string, unknown>[]) {
    if (!brut || typeof brut.activite_id !== "string") continue;
    resultat.push({
      activite_id: brut.activite_id,
      synthese: typeof brut.synthese === "string" ? brut.synthese : null,
      trace_ids: Array.isArray(brut.trace_ids)
        ? (brut.trace_ids as unknown[]).filter((t): t is string => typeof t === "string")
        : [],
    });
  }
  return resultat;
}

/**
 * Charge tout ce qu'il faut pour travailler sur un dossier pedagogique :
 * enfant, cycle, pronom, statuts reels et competences observees groupees
 * par sous-domaine. Les chemins sont lus par petits groupes (une requete
 * non filtree serait tronquee a 1000 lignes).
 */
export async function chargerContexteExport(
  supabase: SupabaseClient,
  dossierId: string
): Promise<{ erreur: string } | ContexteExport> {
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

  const [
    { data: enfantBrut },
    { data: statutsCumules },
    { data: statutsLibelles },
    { data: parcoursMemeCycleBruts },
  ] = await Promise.all([
    supabase.from("enfants").select("pronom").eq("id", enfantId).maybeSingle(),
    supabase
      .from("v_synthese_cumulee_cycle")
      .select("element_programme_id, statut_code")
      .eq("enfant_id", enfantId)
      .eq("cycle_id", cycleId),
    supabase.from("statuts_progression").select("code, libelle"),
    supabase.from("parcours_scolaires").select("id").eq("enfant_id", enfantId).eq("cycle_id", cycleId),
  ]);

  const statutParObjectif = new Map(
    (statutsCumules ?? []).map((s) => [s.element_programme_id as string, s.statut_code as string])
  );
  const observes = (statutsCumules ?? []).filter((s) => s.statut_code !== "non_encore_observe");

  const cheminParObjectif = new Map<string, string>();
  for (const groupe of morceaux(
    observes.map((s) => s.element_programme_id as string),
    100
  )) {
    const { data, error } = await supabase
      .from("v_chemin_complet_objectif")
      .select("objectif_id, chemin")
      .in("objectif_id", groupe);
    if (error) {
      console.error("Vue v_chemin_complet_objectif indisponible", error);
      return {
        erreur:
          "Une mise à jour de la base de données est manquante (vue des chemins de compétences). Contactez la personne qui administre l'application.",
      };
    }
    for (const c of data ?? []) cheminParObjectif.set(c.objectif_id as string, c.chemin as string);
  }

  const objectifsParSousDomaine = new Map<string, { domaine: string; objectifIds: string[] }>();
  for (const s of observes) {
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

  return {
    parcoursDossierId: dossier.parcours_id as string,
    enfantId,
    cycleId,
    pronom: (enfantBrut?.pronom as string | null) ?? null,
    idsParcoursMemeCycle: (parcoursMemeCycleBruts ?? []).map((p) => p.id as string),
    statutParObjectif,
    libelleParStatutCode: new Map(
      (statutsLibelles ?? []).map((s) => [s.code as string, s.libelle as string])
    ),
    objectifsParSousDomaine,
  };
}

/**
 * Pour chaque sous-domaine, les activites liees a l'une de ses
 * competences observees (toutes annees du cycle), avec leurs photos,
 * classees : avec photo d'abord, puis favorites, puis annee du dossier,
 * puis les plus recentes.
 */
export async function chargerCandidatsParSousDomaine(
  supabase: SupabaseClient,
  contexte: Pick<ContexteExport, "idsParcoursMemeCycle" | "parcoursDossierId">,
  sousDomaines: Map<string, { objectifIds: string[] }>
): Promise<Map<string, ActiviteCandidate[]>> {
  const tousObjectifs = Array.from(
    new Set(Array.from(sousDomaines.values()).flatMap((v) => v.objectifIds))
  );
  if (tousObjectifs.length === 0 || contexte.idsParcoursMemeCycle.length === 0) return new Map();

  type Brute = {
    id: string;
    titre: string;
    date: string;
    texte: string;
    parcoursId: string;
    favori: boolean;
  };
  const activites = new Map<string, Brute>();
  const activitesParObjectif = new Map<string, Set<string>>();

  for (const groupe of morceaux(tousObjectifs, 100)) {
    for (let debut = 0; ; debut += 1000) {
      const { data, error } = await supabase
        .from("observations_elements_programme")
        .select(
          "id, element_programme_id, activites!inner(id, titre, date_activite, description, observations, parcours_id, favori)"
        )
        .in("element_programme_id", groupe)
        .in("activites.parcours_id", contexte.idsParcoursMemeCycle)
        .order("id")
        .range(debut, debut + 999);
      if (error) {
        console.error("Erreur de chargement des activites candidates", error);
        break;
      }
      for (const o of data ?? []) {
        const a = Array.isArray(o.activites) ? o.activites[0] : o.activites;
        if (!a) continue;
        const idActivite = a.id as string;
        if (!activites.has(idActivite)) {
          activites.set(idActivite, {
            id: idActivite,
            titre: a.titre as string,
            date: a.date_activite as string,
            texte: [a.description as string | null, a.observations as string | null]
              .filter(Boolean)
              .join(" - "),
            parcoursId: a.parcours_id as string,
            favori: Boolean(a.favori),
          });
        }
        const ensemble = activitesParObjectif.get(o.element_programme_id as string) ?? new Set();
        ensemble.add(idActivite);
        activitesParObjectif.set(o.element_programme_id as string, ensemble);
      }
      if (!data || data.length < 1000) break;
    }
  }

  // Photos de ces activites (ordre chronologique), par groupes.
  const photosParActivite = new Map<string, PhotoCandidate[]>();
  for (const groupe of morceaux(Array.from(activites.keys()), 80)) {
    const { data } = await supabase
      .from("traces")
      .select("id, activite_id, chemin_stockage, miniature_chemin_stockage, types_trace!inner(code)")
      .in("activite_id", groupe)
      .eq("types_trace.code", "photo")
      .order("date_trace", { ascending: true })
      .order("id");
    for (const t of data ?? []) {
      if (!t.chemin_stockage) continue;
      const liste = photosParActivite.get(t.activite_id as string) ?? [];
      liste.push({
        id: t.id as string,
        chemin: t.chemin_stockage as string,
        miniature: (t.miniature_chemin_stockage as string | null) ?? null,
      });
      photosParActivite.set(t.activite_id as string, liste);
    }
  }

  const resultat = new Map<string, ActiviteCandidate[]>();
  for (const [sousDomaine, { objectifIds }] of sousDomaines) {
    const ids = new Set<string>();
    for (const objectifId of objectifIds) {
      for (const idActivite of activitesParObjectif.get(objectifId) ?? []) ids.add(idActivite);
    }
    const liste: ActiviteCandidate[] = Array.from(ids).flatMap((idActivite) => {
      const a = activites.get(idActivite);
      if (!a) return [];
      return [
        {
          id: a.id,
          titre: a.titre,
          date: a.date,
          texte: a.texte,
          anneeCourante: a.parcoursId === contexte.parcoursDossierId,
          favori: a.favori,
          photos: photosParActivite.get(a.id) ?? [],
        },
      ];
    });
    liste.sort(
      (x, y) =>
        Number(y.photos.length > 0) - Number(x.photos.length > 0) ||
        Number(y.favori) - Number(x.favori) ||
        Number(y.anneeCourante) - Number(x.anneeCourante) ||
        y.date.localeCompare(x.date)
    );
    resultat.set(sousDomaine, liste);
  }
  return resultat;
}

/**
 * Repartit les activites entre sous-domaines pour qu'une meme activite
 * ne serve pas a illustrer deux sous-domaines differents, tant qu'il
 * reste d'autres choix. Les sous-domaines ayant le moins de candidates
 * choisissent en premier. Pour chacun, ordre de preference : activite
 * pas encore utilisee avec photo, pas encore utilisee sans photo, puis
 * (seulement s'il n'y a pas assez de choix) activite deja utilisee ailleurs.
 */
export function repartirExemples(
  candidatsParSousDomaine: Map<string, ActiviteCandidate[]>,
  sousDomainesAAttribuer: string[],
  dejaUtilisees: Set<string>,
  cible = 2
): Map<string, string[]> {
  const utilisees = new Set(dejaUtilisees);
  const resultat = new Map<string, string[]>();
  const ordre = [...sousDomainesAAttribuer].sort(
    (a, b) =>
      (candidatsParSousDomaine.get(a)?.length ?? 0) - (candidatsParSousDomaine.get(b)?.length ?? 0) ||
      a.localeCompare(b, "fr")
  );

  for (const sousDomaine of ordre) {
    const liste = candidatsParSousDomaine.get(sousDomaine) ?? [];
    const choisis: string[] = [];
    const passes: ((c: ActiviteCandidate) => boolean)[] = [
      (c) => !utilisees.has(c.id) && c.photos.length > 0,
      (c) => !utilisees.has(c.id),
      (c) => c.photos.length > 0,
      () => true,
    ];
    for (const accepte of passes) {
      for (const c of liste) {
        if (choisis.length >= cible) break;
        if (!choisis.includes(c.id) && accepte(c)) choisis.push(c.id);
      }
    }
    for (const id of choisis) utilisees.add(id);
    resultat.set(sousDomaine, choisis);
  }
  return resultat;
}
