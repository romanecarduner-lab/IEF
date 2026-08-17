"use server";

import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { creerClientServeur } from "@/lib/supabase/server";
import {
  DocumentDossier,
  type ActiviteDocument,
  type DomaineDocument,
  type SyntheseDomaineDocument,
} from "./DocumentDossier";

export async function basculerActivite(
  dossierId: string,
  activiteId: string,
  inclure: boolean
) {
  const supabase = creerClientServeur();
  if (inclure) {
    await supabase
      .from("dossiers_export_elements")
      .insert({ dossier_id: dossierId, type_element: "activite", activite_id: activiteId });
  } else {
    await supabase
      .from("dossiers_export_elements")
      .delete()
      .eq("dossier_id", dossierId)
      .eq("type_element", "activite")
      .eq("activite_id", activiteId);
  }
  revalidatePath(`/export/${dossierId}`);
}

export async function basculerTrace(dossierId: string, traceId: string, inclure: boolean) {
  const supabase = creerClientServeur();
  if (inclure) {
    await supabase
      .from("dossiers_export_elements")
      .insert({ dossier_id: dossierId, type_element: "trace", trace_id: traceId });
  } else {
    await supabase
      .from("dossiers_export_elements")
      .delete()
      .eq("dossier_id", dossierId)
      .eq("type_element", "trace")
      .eq("trace_id", traceId);
  }
  revalidatePath(`/export/${dossierId}`);
}

export async function modifierTexteElement(
  elementId: string,
  dossierId: string,
  texteSynthese: string
) {
  const supabase = creerClientServeur();
  await supabase
    .from("dossiers_export_elements")
    .update({ texte_synthese_modifie: texteSynthese || null })
    .eq("id", elementId);
  revalidatePath(`/export/${dossierId}`);
}

/**
 * Remplit automatiquement le dossier pour un bilan de controle complet
 * mais volontairement limite : selectionne, pour chaque domaine du
 * programme aborde par ce parcours, au plus `maxParDomaine` activites
 * (les favorites en priorite, puis les plus recentes), plutot que
 * d'inclure toutes les activites (qui produirait un document trop long).
 * Aucune IA n'est utilisee : uniquement les signaux deja fournis par le
 * parent (favori, date) et les competences deja reliees (lot 6).
 *
 * N'ecrase jamais une selection existante : les activites deja incluses
 * dans le dossier le restent, on ajoute seulement ce qui manque.
 */
export async function remplirBilanAutomatique(
  dossierId: string,
  parcoursId: string,
  maxParDomaine: number
): Promise<{ erreur: string } | { ok: true; nbAjoutees: number }> {
  const supabase = creerClientServeur();

  const { data: activites } = await supabase
    .from("activites")
    .select("id, favori, date_activite")
    .eq("parcours_id", parcoursId);

  if (!activites || activites.length === 0) {
    return { erreur: "Aucune activité enregistrée pour ce parcours." };
  }

  // Determine le ou les domaines touches par chaque activite, via les
  // competences deja reliees (lot 6). Une activite sans competence reliee
  // ne peut pas etre selectionnee automatiquement : elle reste a ajouter
  // a la main si besoin.
  const candidatsParDomaine = new Map<
    string,
    { id: string; favori: boolean; date: string }[]
  >();

  for (const a of activites) {
    const { data: obs } = await supabase
      .from("observations_elements_programme")
      .select("elements_programme(parent_id)")
      .eq("activite_id", a.id);

    const domainesActivite = new Set<string>();
    for (const o of obs ?? []) {
      const element = Array.isArray(o.elements_programme)
        ? o.elements_programme[0]
        : o.elements_programme;
      if (!element?.parent_id) continue;
      const { data: chemin } = await supabase.rpc("chemin_element_programme", {
        p_element_id: element.parent_id as string,
      });
      const domaine = (chemin as string | null)?.split(" > ")[0];
      if (domaine) domainesActivite.add(domaine);
    }

    for (const domaine of domainesActivite) {
      const liste = candidatsParDomaine.get(domaine) ?? [];
      liste.push({ id: a.id as string, favori: Boolean(a.favori), date: a.date_activite as string });
      candidatsParDomaine.set(domaine, liste);
    }
  }

  const idsRetenus = new Set<string>();
  for (const [, candidats] of candidatsParDomaine) {
    const tries = [...candidats]
      .sort((x, y) => {
        if (x.favori !== y.favori) return x.favori ? -1 : 1;
        return new Date(y.date).getTime() - new Date(x.date).getTime();
      })
      .slice(0, maxParDomaine);
    for (const c of tries) idsRetenus.add(c.id);
  }

  if (idsRetenus.size === 0) {
    return {
      erreur:
        "Aucune activité reliée à une compétence pour l'instant : reliez-en depuis le journal avant de générer le bilan automatiquement.",
    };
  }

  const { data: dejaInclus } = await supabase
    .from("dossiers_export_elements")
    .select("activite_id")
    .eq("dossier_id", dossierId)
    .eq("type_element", "activite");
  const dejaSet = new Set((dejaInclus ?? []).map((d) => d.activite_id));

  const activitesAInserer = Array.from(idsRetenus).filter((id) => !dejaSet.has(id));
  if (activitesAInserer.length > 0) {
    await supabase.from("dossiers_export_elements").insert(
      activitesAInserer.map((activite_id) => ({
        dossier_id: dossierId,
        type_element: "activite",
        activite_id,
      }))
    );
  }

  // Inclut aussi les traces de ces activites, pour que les exemples
  // retenus soient illustres, pas seulement du texte.
  const { data: traces } = await supabase
    .from("traces")
    .select("id, activite_id")
    .in("activite_id", Array.from(idsRetenus));

  const { data: dejaTraces } = await supabase
    .from("dossiers_export_elements")
    .select("trace_id")
    .eq("dossier_id", dossierId)
    .eq("type_element", "trace");
  const dejaTracesSet = new Set((dejaTraces ?? []).map((d) => d.trace_id));

  const tracesAInserer = (traces ?? []).filter((t) => !dejaTracesSet.has(t.id));
  if (tracesAInserer.length > 0) {
    await supabase.from("dossiers_export_elements").insert(
      tracesAInserer.map((t) => ({
        dossier_id: dossierId,
        type_element: "trace",
        trace_id: t.id,
      }))
    );
  }

  revalidatePath(`/export/${dossierId}`);
  return { ok: true, nbAjoutees: activitesAInserer.length };
}

/**
 * Finalise le dossier : rassemble les activites par domaine du programme
 * (via les competences reliees), integre les photos, calcule la synthese
 * de progression, genere un vrai PDF (page de garde, sections par
 * domaine), copie un instantane fige, et passe le dossier en statut
 * 'finalise'. Un dossier finalise n'est plus jamais recalcule a partir
 * des sources (voir Corrections-Schema-et-Lot1.md, A9).
 */
export async function finaliserDossier(
  dossierId: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();

  const { data: dossier } = await supabase
    .from("dossiers_export")
    .select(
      "id, titre, parcours_id, parcours_scolaires(enfants(prenom, famille_id), annees_scolaires(libelle), cycles(libelle))"
    )
    .eq("id", dossierId)
    .maybeSingle();

  if (!dossier) return { erreur: "Dossier introuvable." };

  const parcours = Array.isArray(dossier.parcours_scolaires)
    ? dossier.parcours_scolaires[0]
    : dossier.parcours_scolaires;
  const enfant = parcours
    ? Array.isArray(parcours.enfants)
      ? parcours.enfants[0]
      : parcours.enfants
    : null;
  const annee = parcours
    ? Array.isArray(parcours.annees_scolaires)
      ? parcours.annees_scolaires[0]
      : parcours.annees_scolaires
    : null;
  const cycle = parcours
    ? Array.isArray(parcours.cycles)
      ? parcours.cycles[0]
      : parcours.cycles
    : null;
  const familleId = enfant?.famille_id as string | undefined;

  if (!familleId) return { erreur: "Famille introuvable pour ce dossier." };

  // --- Elements inclus dans le dossier ---
  const { data: elements } = await supabase
    .from("dossiers_export_elements")
    .select(
      `id, type_element, texte_synthese_modifie,
       activites(id, titre, date_activite, description, observations, contextes_activite(libelle)),
       traces(legende, contenu_texte, chemin_stockage, activite_id, types_trace(code))`
    )
    .eq("dossier_id", dossierId);

  const activiteEls = (elements ?? []).filter((e) => e.type_element === "activite");
  const traceEls = (elements ?? []).filter((e) => e.type_element === "trace");

  // Regroupe les traces incluses par activite source, pour les integrer
  // directement sous l'activite plutot que dans une section a part.
  const tracesParActivite = new Map<
    string,
    { imageBase64?: string; contenuTexte?: string; legende?: string }[]
  >();
  for (const el of traceEls) {
    const t = Array.isArray(el.traces) ? el.traces[0] : el.traces;
    if (!t || !t.activite_id) continue;
    const type = Array.isArray(t.types_trace) ? t.types_trace[0] : t.types_trace;

    let imageBase64: string | undefined;
    if (t.chemin_stockage && type?.code === "photo") {
      const { data: fichier } = await supabase.storage
        .from("traces-pedagogiques")
        .download(t.chemin_stockage as string);
      if (fichier) imageBase64 = Buffer.from(await fichier.arrayBuffer()).toString("base64");
    }

    const liste = tracesParActivite.get(t.activite_id as string) ?? [];
    liste.push({
      imageBase64,
      contenuTexte: (t.contenu_texte as string | null) ?? undefined,
      legende: (t.legende as string | null) ?? undefined,
    });
    tracesParActivite.set(t.activite_id as string, liste);
  }

  // Pour chaque activite incluse, retrouve les competences observees et
  // leur domaine (via le chemin hierarchique), pour regrouper le dossier
  // par domaine plutot que par simple ordre chronologique.
  const domainesMap = new Map<string, ActiviteDocument[]>();
  const sansDomaine: ActiviteDocument[] = [];
  let nbActivitesTotal = 0;

  for (const el of activiteEls) {
    const a = Array.isArray(el.activites) ? el.activites[0] : el.activites;
    if (!a) continue;
    nbActivitesTotal++;
    const contexte = Array.isArray(a.contextes_activite)
      ? a.contextes_activite[0]
      : a.contextes_activite;
    const texteFinal =
      (el.texte_synthese_modifie as string | null) ||
      [a.description, a.observations].filter(Boolean).join(" — ") ||
      "";
    const traces = tracesParActivite.get(a.id as string) ?? [];

    const { data: observations } = await supabase
      .from("observations_elements_programme")
      .select("niveaux_autonomie(libelle), elements_programme(libelle, parent_id)")
      .eq("activite_id", a.id);

    const domainesActivite = new Map<string, { libelle: string; niveauAutonomie: string }[]>();

    for (const obs of observations ?? []) {
      const niveau = Array.isArray(obs.niveaux_autonomie)
        ? obs.niveaux_autonomie[0]
        : obs.niveaux_autonomie;
      const element = Array.isArray(obs.elements_programme)
        ? obs.elements_programme[0]
        : obs.elements_programme;
      if (!element) continue;

      const { data: chemin } = await supabase.rpc("chemin_element_programme", {
        p_element_id: element.parent_id as string,
      });
      const domaineNom = (chemin as string | null)?.split(" > ")[0] ?? "Autres";

      const liste = domainesActivite.get(domaineNom) ?? [];
      liste.push({
        libelle: element.libelle as string,
        niveauAutonomie: (niveau?.libelle as string) ?? "",
      });
      domainesActivite.set(domaineNom, liste);
    }

    if (domainesActivite.size === 0) {
      sansDomaine.push({
        titre: a.titre as string,
        date: a.date_activite as string,
        contexte: contexte?.libelle as string | undefined,
        texte: texteFinal,
        competences: [],
        traces,
      });
    } else {
      for (const [domaineNom, competences] of domainesActivite) {
        const listeActivites = domainesMap.get(domaineNom) ?? [];
        listeActivites.push({
          titre: a.titre as string,
          date: a.date_activite as string,
          contexte: contexte?.libelle as string | undefined,
          texte: texteFinal,
          competences,
          traces,
        });
        domainesMap.set(domaineNom, listeActivites);
      }
    }

    // Copie l'instantane des donnees de l'activite au moment de la finalisation.
    await supabase
      .from("dossiers_export_elements")
      .update({ snapshot_titre: a.titre, snapshot_date: a.date_activite, snapshot_texte: texteFinal })
      .eq("id", el.id);
  }

  for (const el of traceEls) {
    const t = Array.isArray(el.traces) ? el.traces[0] : el.traces;
    if (!t) continue;
    await supabase
      .from("dossiers_export_elements")
      .update({ snapshot_legende: t.legende, snapshot_chemin_fichier: t.chemin_stockage })
      .eq("id", el.id);
  }

  // --- Synthese de progression par domaine, pour ce parcours (graphique) ---
  const [{ data: totauxDomaine }, { data: repartitionDomaine }] = await Promise.all([
    supabase.from("v_total_objectifs_par_domaine").select("domaine, total_objectifs"),
    supabase
      .from("v_progression_par_domaine")
      .select("domaine, statut_code, nb")
      .eq("parcours_id", dossier.parcours_id),
  ]);

  const syntheses: SyntheseDomaineDocument[] = (totauxDomaine ?? []).map((t) => {
    const domaine = t.domaine as string;
    const parStatut: Record<string, number> = {};
    for (const r of repartitionDomaine ?? []) {
      if (r.domaine === domaine) parStatut[r.statut_code as string] = r.nb as number;
    }
    return { domaine, totalObjectifs: t.total_objectifs as number, parStatut };
  });

  // --- Synthese ECRITE et complete par domaine : toutes les competences
  // validees (syntheses_progression), pas seulement celles illustrees par
  // les activites-exemples retenues plus haut. C'est ce qui garantit que
  // le bilan reflete le domaine dans son ensemble.
  const { data: syntheseDetail } = await supabase
    .from("syntheses_progression")
    .select(
      "statuts_progression(code, libelle, ordre), elements_programme(libelle, parent_id), synthese_ia"
    )
    .eq("parcours_id", dossier.parcours_id);

  type CompetenceDetail = { libelle: string; syntheseIA?: string };
  type GroupeStatut = {
    code: string;
    ordre: number;
    statutLibelle: string;
    competences: CompetenceDetail[];
  };
  const detailParDomaine = new Map<string, Map<string, GroupeStatut>>();

  for (const s of syntheseDetail ?? []) {
    const statut = Array.isArray(s.statuts_progression)
      ? s.statuts_progression[0]
      : s.statuts_progression;
    const element = Array.isArray(s.elements_programme)
      ? s.elements_programme[0]
      : s.elements_programme;
    if (!statut || !element?.parent_id) continue;
    if (statut.code === "non_encore_observe") continue; // rien de significatif a lister

    const { data: chemin } = await supabase.rpc("chemin_element_programme", {
      p_element_id: element.parent_id as string,
    });
    const domaineNom = (chemin as string | null)?.split(" > ")[0];
    if (!domaineNom) continue;

    const groupes = detailParDomaine.get(domaineNom) ?? new Map<string, GroupeStatut>();
    const groupe =
      groupes.get(statut.code as string) ??
      ({
        code: statut.code as string,
        ordre: statut.ordre as number,
        statutLibelle: statut.libelle as string,
        competences: [] as CompetenceDetail[],
      } satisfies GroupeStatut);
    groupe.competences.push({
      libelle: element.libelle as string,
      syntheseIA: (s.synthese_ia as string | null) ?? undefined,
    });
    groupes.set(statut.code as string, groupe);
    detailParDomaine.set(domaineNom, groupes);
  }

  const totalParDomaine = new Map(
    (totauxDomaine ?? []).map((t) => [t.domaine as string, t.total_objectifs as number])
  );

  // Union des domaines illustres par des exemples ET des domaines qui ont
  // une synthese validee mais pas encore d'exemple choisi : les deux
  // doivent apparaitre, pour ne rien passer sous silence.
  const nomsDomaines = new Set([...domainesMap.keys(), ...detailParDomaine.keys()]);

  const domaines: DomaineDocument[] = Array.from(nomsDomaines).map((nom) => {
    const groupesMap = detailParDomaine.get(nom);
    const groupes = groupesMap
      ? Array.from(groupesMap.values()).sort((a, b) => b.ordre - a.ordre)
      : [];
    const nbValides = groupes.reduce((acc, g) => acc + g.competences.length, 0);

    return {
      nom,
      activites: domainesMap.get(nom) ?? [],
      syntheseTexte: groupesMap
        ? {
            totalObjectifs: totalParDomaine.get(nom) ?? 0,
            nbValides,
            parStatut: groupes.map((g) => ({
              statutLibelle: g.statutLibelle,
              competences: g.competences,
            })),
          }
        : undefined,
    };
  });

  const nbTracesTotal = traceEls.length;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(
      DocumentDossier({
        titreDossier: dossier.titre as string,
        enfant: (enfant?.prenom as string) ?? "",
        annee: (annee?.libelle as string) ?? "",
        cycle: (cycle?.libelle as string) ?? undefined,
        dateGeneration: new Date().toLocaleDateString("fr-FR"),
        nbActivites: nbActivitesTotal,
        nbTraces: nbTracesTotal,
        syntheses,
        domaines,
        activitesSansDomaine: sansDomaine,
      })
    );
  } catch (erreurPdf) {
    console.error("Erreur lors de la generation du PDF", erreurPdf);
    return { erreur: "La génération du PDF a échoué. Merci de réessayer." };
  }

  const cheminPdf = `${familleId}/dossiers/${dossierId}.pdf`;
  const { error: erreurUpload } = await supabase.storage
    .from("traces-pedagogiques")
    .upload(cheminPdf, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (erreurUpload) {
    console.error("Erreur upload PDF", erreurUpload);
    return { erreur: "Impossible d'enregistrer le PDF généré. Merci de réessayer." };
  }

  await supabase
    .from("dossiers_export")
    .update({ statut: "finalise", pdf_final_storage_path: cheminPdf })
    .eq("id", dossierId);

  revalidatePath(`/export/${dossierId}`);
  revalidatePath("/export");
  return { ok: true };
}
