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

  const domaines: DomaineDocument[] = Array.from(domainesMap.entries()).map(
    ([nom, activites]) => ({ nom, activites })
  );

  // --- Synthese de progression par domaine, pour ce parcours ---
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
