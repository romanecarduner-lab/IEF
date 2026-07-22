"use server";

import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { creerClientServeur } from "@/lib/supabase/server";
import { DocumentDossier, type ActiviteDocument, type TraceDocument } from "./DocumentDossier";

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
 * Finalise le dossier : copie un instantane (snapshot) des donnees
 * actuelles dans dossiers_export_elements, genere le PDF, l'envoie dans
 * le bucket prive, et passe le dossier en statut 'finalise'. Un dossier
 * finalise n'est plus jamais recalcule automatiquement a partir des
 * sources (voir Corrections-Schema-et-Lot1.md, A9).
 */
export async function finaliserDossier(
  dossierId: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();

  const { data: dossier } = await supabase
    .from("dossiers_export")
    .select(
      "id, titre, parcours_id, parcours_scolaires(enfants(prenom, famille_id), annees_scolaires(libelle))"
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
  const familleId = enfant?.famille_id as string | undefined;

  if (!familleId) return { erreur: "Famille introuvable pour ce dossier." };

  const { data: elements } = await supabase
    .from("dossiers_export_elements")
    .select(
      "id, type_element, texte_synthese_modifie, activites(titre, date_activite, description, observations, contextes_activite(libelle)), traces(legende, contenu_texte, chemin_stockage, activite_id, types_trace(code))"
    )
    .eq("dossier_id", dossierId);

  const activitesDoc: ActiviteDocument[] = [];
  const tracesDoc: TraceDocument[] = [];

  for (const el of elements ?? []) {
    if (el.type_element === "activite") {
      const a = Array.isArray(el.activites) ? el.activites[0] : el.activites;
      if (!a) continue;
      const contexte = Array.isArray(a.contextes_activite)
        ? a.contextes_activite[0]
        : a.contextes_activite;
      activitesDoc.push({
        titre: a.titre as string,
        date: a.date_activite as string,
        contexte: contexte?.libelle as string | undefined,
        texte:
          (el.texte_synthese_modifie as string | null) ||
          [a.description, a.observations].filter(Boolean).join(" — ") ||
          "",
      });

      // Copie l'instantane des donnees de l'activite au moment de la finalisation.
      await supabase
        .from("dossiers_export_elements")
        .update({
          snapshot_titre: a.titre,
          snapshot_date: a.date_activite,
          snapshot_texte:
            (el.texte_synthese_modifie as string | null) ||
            [a.description, a.observations].filter(Boolean).join(" — "),
        })
        .eq("id", el.id);
    } else if (el.type_element === "trace") {
      const t = Array.isArray(el.traces) ? el.traces[0] : el.traces;
      if (!t) continue;
      const type = Array.isArray(t.types_trace) ? t.types_trace[0] : t.types_trace;

      let imageBase64: string | null = null;
      if (t.chemin_stockage && type?.code === "photo") {
        const { data: fichier } = await supabase.storage
          .from("traces-pedagogiques")
          .download(t.chemin_stockage as string);
        if (fichier) {
          const buffer = Buffer.from(await fichier.arrayBuffer());
          imageBase64 = buffer.toString("base64");
        }
      }

      tracesDoc.push({
        legende: (t.legende as string | null) ?? undefined,
        contenuTexte: (t.contenu_texte as string | null) ?? undefined,
        imageBase64: imageBase64 ?? undefined,
      });

      await supabase
        .from("dossiers_export_elements")
        .update({
          snapshot_legende: t.legende,
          snapshot_chemin_fichier: t.chemin_stockage,
        })
        .eq("id", el.id);
    }
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(
      DocumentDossier({
        titreDossier: dossier.titre as string,
        enfant: (enfant?.prenom as string) ?? "",
        annee: (annee?.libelle as string) ?? "",
        activites: activitesDoc,
        traces: tracesDoc,
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
