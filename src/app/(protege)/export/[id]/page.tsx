import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { BasculeElement } from "./BasculeElement";
import { EditeurTexteElement } from "./EditeurTexteElement";
import { BoutonFinaliser } from "./BoutonFinaliser";

const DUREE_SIGNATURE_SECONDES = 60 * 60;

export default async function PageDossierExport({
  params,
}: {
  params: { id: string };
}) {
  const supabase = creerClientServeur();

  const { data: dossier } = await supabase
    .from("dossiers_export")
    .select(
      "id, titre, statut, parcours_id, pdf_final_storage_path, parcours_scolaires(enfants(prenom), annees_scolaires(libelle))"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!dossier) notFound();

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

  const enTete = (
    <div className="mb-6">
      <Link href="/export" className="mb-4 inline-block text-sm text-ardoise hover:text-encre">
        ← Retour aux dossiers
      </Link>
      <h1 className="font-display text-2xl italic text-encre">{dossier.titre}</h1>
      <p className="text-sm text-ardoise">
        {enfant?.prenom} · {annee?.libelle}
      </p>
    </div>
  );

  if (dossier.statut === "finalise") {
    let urlPdf: string | null = null;
    if (dossier.pdf_final_storage_path) {
      const { data } = await supabase.storage
        .from("traces-pedagogiques")
        .createSignedUrl(dossier.pdf_final_storage_path, DUREE_SIGNATURE_SECONDES);
      urlPdf = data?.signedUrl ?? null;
    }

    const { data: elementsSnapshot } = await supabase
      .from("dossiers_export_elements")
      .select("id, type_element, snapshot_titre, snapshot_date, snapshot_texte, snapshot_legende")
      .eq("dossier_id", params.id);

    return (
      <div>
        {enTete}
        <span className="mb-6 inline-block rounded-full bg-mousse/10 px-2.5 py-0.5 text-xs text-mousse-fonce">
          Finalisé
        </span>

        {urlPdf && (
          <p className="mb-6">
            <a
              href={urlPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white hover:bg-mousse"
            >
              Télécharger le PDF
            </a>
          </p>
        )}

        <p className="mb-3 text-sm font-medium text-encre">
          Contenu figé ({elementsSnapshot?.length ?? 0} élément
          {(elementsSnapshot?.length ?? 0) > 1 ? "s" : ""})
        </p>
        <ul className="space-y-2">
          {(elementsSnapshot ?? []).map((e) => (
            <li
              key={e.id}
              className="rounded-doux border border-trait bg-white/80 p-3 text-sm shadow-doux"
            >
              {e.type_element === "activite" ? (
                <>
                  <p className="text-encre">{e.snapshot_titre}</p>
                  <p className="text-xs text-ardoise">
                    {e.snapshot_date &&
                      new Date(e.snapshot_date as string).toLocaleDateString("fr-FR")}
                  </p>
                  {e.snapshot_texte && (
                    <p className="mt-1 text-xs text-encre">{e.snapshot_texte}</p>
                  )}
                </>
              ) : (
                <p className="text-encre">{e.snapshot_legende || "Trace"}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // --- Dossier en brouillon : edition en direct des sources ---
  const [{ data: activitesBrutes }, { data: elementsBruts }] = await Promise.all([
    supabase
      .from("activites")
      .select("id, titre, date_activite, contextes_activite(libelle)")
      .eq("parcours_id", dossier.parcours_id)
      .order("date_activite", { ascending: false }),
    supabase
      .from("dossiers_export_elements")
      .select("id, type_element, activite_id, trace_id, texte_synthese_modifie")
      .eq("dossier_id", params.id),
  ]);

  const elementsParActivite = new Map<
    string,
    { elementId: string; texte: string }
  >();
  const traceIdsInclus = new Set<string>();
  for (const el of elementsBruts ?? []) {
    if (el.type_element === "activite" && el.activite_id) {
      elementsParActivite.set(el.activite_id, {
        elementId: el.id,
        texte: (el.texte_synthese_modifie as string) ?? "",
      });
    } else if (el.type_element === "trace" && el.trace_id) {
      traceIdsInclus.add(el.trace_id);
    }
  }

  const activiteIds = (activitesBrutes ?? []).map((a) => a.id as string);
  const { data: tracesBrutes } =
    activiteIds.length > 0
      ? await supabase
          .from("traces")
          .select("id, legende, activite_id, types_trace(libelle)")
          .in("activite_id", activiteIds)
      : { data: [] };

  const tracesParActivite = new Map<string, typeof tracesBrutes>();
  for (const t of tracesBrutes ?? []) {
    const liste = tracesParActivite.get(t.activite_id as string) ?? [];
    liste.push(t);
    tracesParActivite.set(t.activite_id as string, liste);
  }

  const nombreInclus = elementsParActivite.size + traceIdsInclus.size;

  return (
    <div>
      {enTete}
      <span className="mb-6 inline-block rounded-full bg-trait px-2.5 py-0.5 text-xs text-ardoise">
        Brouillon
      </span>

      <p className="mb-4 text-sm text-ardoise">
        Choisissez les activités et traces à inclure dans ce dossier. Vous
        pouvez modifier le texte affiché pour chaque activité avant de
        finaliser.
      </p>

      {(activitesBrutes ?? []).length === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Aucune activité enregistrée pour ce parcours.
        </p>
      ) : (
        <ul className="mb-8 space-y-3">
          {(activitesBrutes ?? []).map((a) => {
            const contexte = Array.isArray(a.contextes_activite)
              ? a.contextes_activite[0]
              : a.contextes_activite;
            const inclusion = elementsParActivite.get(a.id as string);
            const inclus = Boolean(inclusion);
            const traces = tracesParActivite.get(a.id as string) ?? [];

            return (
              <li
                key={a.id}
                className="rounded-doux border border-trait bg-white/80 p-4 shadow-doux"
              >
                <BasculeElement
                  dossierId={params.id}
                  cibleId={a.id as string}
                  inclus={inclus}
                  type="activite"
                  label={`${a.titre} — ${new Date(
                    a.date_activite as string
                  ).toLocaleDateString("fr-FR")}${contexte ? ` · ${contexte.libelle}` : ""}`}
                />

                {inclus && inclusion && (
                  <EditeurTexteElement
                    elementId={inclusion.elementId}
                    dossierId={params.id}
                    texteInitial={inclusion.texte}
                  />
                )}

                {traces.length > 0 && (
                  <div className="mt-3 ml-6 space-y-1 border-l border-trait pl-3">
                    {traces.map((t) => {
                      const type = Array.isArray(t.types_trace)
                        ? t.types_trace[0]
                        : t.types_trace;
                      return (
                        <BasculeElement
                          key={t.id}
                          dossierId={params.id}
                          cibleId={t.id as string}
                          inclus={traceIdsInclus.has(t.id as string)}
                          type="trace"
                          label={`${type?.libelle ?? "Trace"}${
                            t.legende ? ` — ${t.legende}` : ""
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {nombreInclus > 0 && <BoutonFinaliser dossierId={params.id} />}
    </div>
  );
}
