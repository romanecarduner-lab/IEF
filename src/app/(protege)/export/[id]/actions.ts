"use server";

import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { creerClientServeur } from "@/lib/supabase/server";
import {
  DocumentDossierPedagogique,
  type DomaineDocumentPedagogique,
  type ExempleDocument,
} from "./DocumentDossierPedagogique";
import { DocumentJournalPeriode, type ActiviteJournal } from "./DocumentJournalPeriode";
import { genererPptxDossierPedagogique, genererPptxJournalPeriode } from "@/lib/pptxExport";

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
  //
  // Tout est recupere en une seule requete puis resolu en parallele
  // (au lieu d'une requete + un appel reseau par competence et par
  // activite) : avec un volume d'activites important, la version
  // sequentielle finissait par depasser largement le delai de securite.
  const activiteIds = activites.map((a) => a.id as string);
  const { data: toutesObservations } = await supabase
    .from("observations_elements_programme")
    .select("activite_id, elements_programme(parent_id)")
    .in("activite_id", activiteIds);

  const parentIds = new Set<string>();
  for (const o of toutesObservations ?? []) {
    const element = Array.isArray(o.elements_programme)
      ? o.elements_programme[0]
      : o.elements_programme;
    if (element?.parent_id) parentIds.add(element.parent_id as string);
  }

  const domaineParParentId = new Map<string, string | null>();
  await Promise.all(
    Array.from(parentIds).map(async (pid) => {
      const { data: chemin } = await supabase.rpc("chemin_element_programme", {
        p_element_id: pid,
      });
      domaineParParentId.set(pid, (chemin as string | null)?.split(" > ")[0] ?? null);
    })
  );

  const domainesParActivite = new Map<string, Set<string>>();
  for (const o of toutesObservations ?? []) {
    const element = Array.isArray(o.elements_programme)
      ? o.elements_programme[0]
      : o.elements_programme;
    const domaine = element?.parent_id
      ? domaineParParentId.get(element.parent_id as string)
      : null;
    if (!domaine) continue;
    const set = domainesParActivite.get(o.activite_id as string) ?? new Set<string>();
    set.add(domaine);
    domainesParActivite.set(o.activite_id as string, set);
  }

  const candidatsParDomaine = new Map<
    string,
    { id: string; favori: boolean; date: string }[]
  >();

  for (const a of activites) {
    const domainesActivite = domainesParActivite.get(a.id as string) ?? new Set<string>();
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
      "id, titre, parcours_id, parcours_scolaires(cycle_id, enfant_id, enfants(prenom, famille_id), cycles(libelle))"
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
  const cycle = parcours
    ? Array.isArray(parcours.cycles)
      ? parcours.cycles[0]
      : parcours.cycles
    : null;
  const familleId = enfant?.famille_id as string | undefined;
  const enfantId = parcours?.enfant_id as string | undefined;
  const cycleId = parcours?.cycle_id as string | undefined;

  if (!familleId || !enfantId || !cycleId) {
    return { erreur: "Famille ou cycle introuvable pour ce dossier." };
  }

  // --- Couverture complete des competences du cycle, statut cumulatif
  // reel -- meme logique de lecture que la page d'edition du dossier,
  // pour garantir que le document genere correspond exactement a ce que
  // le parent a relu.
  const [
    { data: tousLesObjectifs },
    { data: statutsCumules },
    { data: statutsProgression },
    { data: chemins },
    { data: formulations },
  ] = await Promise.all([
    supabase
      .from("v_objectif_domaine")
      .select("objectif_id, libelle, domaine")
      .eq("cycle_id", cycleId)
      .order("domaine"),
    supabase
      .from("v_synthese_cumulee_cycle")
      .select("element_programme_id, statut_code")
      .eq("enfant_id", enfantId)
      .eq("cycle_id", cycleId),
    supabase.from("statuts_progression").select("code, libelle").order("ordre"),
    supabase.from("v_chemin_complet_objectif").select("objectif_id, chemin"),
    supabase
      .from("dossiers_export_formulations")
      .select("element_programme_id, texte, exemple_activite_ids")
      .eq("dossier_id", dossierId),
  ]);

  const libellesStatuts = new Map(
    (statutsProgression ?? []).map((s) => [s.code as string, s.libelle as string])
  );
  const statutParObjectif = new Map(
    (statutsCumules ?? []).map((s) => [s.element_programme_id as string, s.statut_code as string])
  );
  const cheminParObjectif = new Map(
    (chemins ?? []).map((c) => [c.objectif_id as string, c.chemin as string])
  );
  const formulationParObjectif = new Map(
    (formulations ?? []).map((f) => [
      f.element_programme_id as string,
      { texte: (f.texte as string) ?? "", exempleIds: (f.exemple_activite_ids as string[]) ?? [] },
    ])
  );

  const tousLesExempleIds = Array.from(
    new Set((formulations ?? []).flatMap((f) => (f.exemple_activite_ids as string[]) ?? []))
  );
  const { data: exemplesActivitesBruts } =
    tousLesExempleIds.length > 0
      ? await supabase
          .from("activites")
          .select("id, titre, date_activite")
          .in("id", tousLesExempleIds)
      : { data: [] };
  const exempleActiviteParId = new Map(
    (exemplesActivitesBruts ?? []).map((a) => [a.id as string, a])
  );

  const objectifsParDomaineMap = new Map<string, typeof tousLesObjectifs>();
  for (const o of tousLesObjectifs ?? []) {
    const liste = objectifsParDomaineMap.get(o.domaine as string) ?? [];
    liste.push(o);
    objectifsParDomaineMap.set(o.domaine as string, liste);
  }

  const domaines: DomaineDocumentPedagogique[] = Array.from(
    objectifsParDomaineMap.entries()
  ).map(([nom, objectifs]) => {
    const compteParLibelle = new Map<string, number>();
    for (const o of objectifs ?? []) {
      const l = o.libelle as string;
      compteParLibelle.set(l, (compteParLibelle.get(l) ?? 0) + 1);
    }
    return {
      nom,
      competences: (objectifs ?? []).map((o) => {
        const objectifId = o.objectif_id as string;
        const statutCode = statutParObjectif.get(objectifId) ?? "non_encore_observe";
        const observee = statutCode !== "non_encore_observe";
        const formulation = formulationParObjectif.get(objectifId);
        const dupliqueDansLeDomaine = (compteParLibelle.get(o.libelle as string) ?? 0) > 1;
        return {
          libelle: o.libelle as string,
          chemin: dupliqueDansLeDomaine ? cheminParObjectif.get(objectifId) : undefined,
          statutLibelle: libellesStatuts.get(statutCode) ?? "Non encore abordée",
          observee,
          exemples: (formulation?.exempleIds ?? [])
            .map((id) => {
              const a = exempleActiviteParId.get(id);
              if (!a) return null;
              return {
                date: new Date(a.date_activite as string).toLocaleDateString("fr-FR"),
                titre: a.titre as string,
              };
            })
            .filter((e): e is ExempleDocument => Boolean(e)),
          formulation: formulation?.texte || undefined,
        };
      }),
    };
  });

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(
      DocumentDossierPedagogique({
        titre: dossier.titre as string,
        enfant: (enfant?.prenom as string) ?? "",
        cycle: (cycle?.libelle as string) ?? "",
        dateGeneration: new Date().toLocaleDateString("fr-FR"),
        domaines,
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

  // Version PowerPoint, en plus du PDF -- non bloquant : si elle echoue,
  // le PDF reste disponible normalement.
  let cheminPptx: string | null = null;
  try {
    const pptxBuffer = await genererPptxDossierPedagogique({
      titreDossier: dossier.titre as string,
      enfant: (enfant?.prenom as string) ?? "",
      cycle: (cycle?.libelle as string) ?? "",
      domaines,
    });
    cheminPptx = `${familleId}/dossiers/${dossierId}.pptx`;
    const { error: erreurUploadPptx } = await supabase.storage
      .from("traces-pedagogiques")
      .upload(cheminPptx, pptxBuffer, {
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        upsert: true,
      });
    if (erreurUploadPptx) {
      console.error("Erreur upload PowerPoint", erreurUploadPptx);
      cheminPptx = null;
    }
  } catch (erreurPptx) {
    console.error("Erreur lors de la generation du PowerPoint", erreurPptx);
  }

  await supabase
    .from("dossiers_export")
    .update({
      statut: "finalise",
      pdf_final_storage_path: cheminPdf,
      pptx_final_storage_path: cheminPptx,
    })
    .eq("id", dossierId);

  revalidatePath(`/export/${dossierId}`);
  revalidatePath("/export");
  return { ok: true };
}

export async function finaliserDossierJournal(
  dossierId: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();

  const { data: dossier } = await supabase
    .from("dossiers_export")
    .select(
      "id, titre, parcours_id, periode_debut, periode_fin, parcours_scolaires(enfants(prenom, famille_id))"
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
  const familleId = enfant?.famille_id as string | undefined;

  if (!familleId) return { erreur: "Famille introuvable pour ce dossier." };

  const { data: elements } = await supabase
    .from("dossiers_export_elements")
    .select(
      `activites(id, titre, date_activite, description, observations, contextes_activite(libelle))`
    )
    .eq("dossier_id", dossierId)
    .eq("type_element", "activite");

  const activitesIncluses = (elements ?? [])
    .map((el) => (Array.isArray(el.activites) ? el.activites[0] : el.activites))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  activitesIncluses.sort((a, b) =>
    (a.date_activite as string).localeCompare(b.date_activite as string)
  );

  const idsActivitesIncluses = activitesIncluses.map((a) => a.id as string);
  const { data: tracesToutesActivites } =
    idsActivitesIncluses.length > 0
      ? await supabase
          .from("traces")
          .select("activite_id, legende, contenu_texte, chemin_stockage, types_trace(code)")
          .in("activite_id", idsActivitesIncluses)
          .order("date_trace", { ascending: true })
      : { data: [] };

  // Telechargement de toutes les photos en parallele (au lieu d'une par
  // une, activite par activite) -- meme correctif que finaliserDossier,
  // applique ici aussi pour eviter le meme depassement de delai sur une
  // periode chargee.
  const tracesResolues = await Promise.all(
    (tracesToutesActivites ?? []).map(async (t) => {
      const type = Array.isArray(t.types_trace) ? t.types_trace[0] : t.types_trace;
      let imageBase64: string | undefined;
      if (t.chemin_stockage && type?.code === "photo") {
        const { data: fichier } = await supabase.storage
          .from("traces-pedagogiques")
          .download(t.chemin_stockage as string);
        if (fichier) imageBase64 = Buffer.from(await fichier.arrayBuffer()).toString("base64");
      }
      return {
        activiteId: t.activite_id as string,
        trace: {
          imageBase64,
          contenuTexte: (t.contenu_texte as string | null) ?? undefined,
        },
      };
    })
  );

  const tracesParActiviteJournal = new Map<
    string,
    { imageBase64?: string; contenuTexte?: string }[]
  >();
  for (const r of tracesResolues) {
    const liste = tracesParActiviteJournal.get(r.activiteId) ?? [];
    liste.push(r.trace);
    tracesParActiviteJournal.set(r.activiteId, liste);
  }

  const activites: ActiviteJournal[] = [];
  for (const a of activitesIncluses) {
    const contexte = Array.isArray(a.contextes_activite)
      ? a.contextes_activite[0]
      : a.contextes_activite;

    const traces = tracesParActiviteJournal.get(a.id as string) ?? [];

    const texte = [a.description as string | null, a.observations as string | null]
      .filter(Boolean)
      .join("\n\n");

    activites.push({
      titre: a.titre as string,
      date: a.date_activite as string,
      contexte: (contexte?.libelle as string | undefined) ?? undefined,
      texte,
      traces,
    });
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(
      DocumentJournalPeriode({
        titreDossier: dossier.titre as string,
        enfant: (enfant?.prenom as string) ?? "",
        periodeDebut: dossier.periode_debut as string,
        periodeFin: dossier.periode_fin as string,
        dateGeneration: new Date().toLocaleDateString("fr-FR"),
        activites,
      })
    );
  } catch (erreurPdf) {
    console.error("Erreur lors de la generation du PDF (journal periode)", erreurPdf);
    return { erreur: "La génération du PDF a échoué. Merci de réessayer." };
  }

  const cheminPdf = `${familleId}/dossiers/${dossierId}.pdf`;
  const { error: erreurUpload } = await supabase.storage
    .from("traces-pedagogiques")
    .upload(cheminPdf, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (erreurUpload) {
    console.error("Erreur upload PDF (journal periode)", erreurUpload);
    return { erreur: "Impossible d'enregistrer le PDF généré. Merci de réessayer." };
  }

  let cheminPptx: string | null = null;
  try {
    const pptxBuffer = await genererPptxJournalPeriode({
      titreDossier: dossier.titre as string,
      enfant: (enfant?.prenom as string) ?? "",
      periodeDebut: dossier.periode_debut as string,
      periodeFin: dossier.periode_fin as string,
      activites,
    });
    cheminPptx = `${familleId}/dossiers/${dossierId}.pptx`;
    const { error: erreurUploadPptx } = await supabase.storage
      .from("traces-pedagogiques")
      .upload(cheminPptx, pptxBuffer, {
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        upsert: true,
      });
    if (erreurUploadPptx) {
      console.error("Erreur upload PowerPoint (journal periode)", erreurUploadPptx);
      cheminPptx = null;
    }
  } catch (erreurPptx) {
    console.error("Erreur lors de la generation du PowerPoint (journal periode)", erreurPptx);
  }

  await supabase
    .from("dossiers_export")
    .update({
      statut: "finalise",
      pdf_final_storage_path: cheminPdf,
      pptx_final_storage_path: cheminPptx,
    })
    .eq("id", dossierId);

  revalidatePath(`/export/${dossierId}`);
  revalidatePath("/export");
  return { ok: true };
}
