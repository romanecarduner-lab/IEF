import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { BasculeElement } from "./BasculeElement";
import { BoutonFinaliser } from "./BoutonFinaliser";
import { BoutonFinaliserJournal } from "./BoutonFinaliserJournal";
import { BoutonPreparerFormulations } from "./BoutonPreparerFormulations";
import { EditeurFormulation } from "./EditeurFormulation";

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
      "id, titre, statut, parcours_id, type_dossier, periode_debut, periode_fin, pdf_final_storage_path, pptx_final_storage_path, parcours_scolaires(cycle_id, enfant_id, enfants(prenom), annees_scolaires(libelle))"
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

  // --- Journal d'une periode : editeur volontairement beaucoup plus
  // simple que le dossier pedagogique (pas de domaines, pas de synthese
  // IA, pas de points cles a l'oral) -- juste la liste chronologique des
  // activites de la periode, incluses ou non. Retour anticipe pour ne
  // jamais toucher a la logique pedagogique plus bas dans ce fichier.
  if (dossier.type_dossier === "journal_periode") {
    if (dossier.statut === "finalise") {
      let urlPdf: string | null = null;
      if (dossier.pdf_final_storage_path) {
        const { data } = await supabase.storage
          .from("traces-pedagogiques")
          .createSignedUrl(dossier.pdf_final_storage_path, DUREE_SIGNATURE_SECONDES);
        urlPdf = data?.signedUrl ?? null;
      }
      let urlPptx: string | null = null;
      if (dossier.pptx_final_storage_path) {
        const { data } = await supabase.storage
          .from("traces-pedagogiques")
          .createSignedUrl(dossier.pptx_final_storage_path, DUREE_SIGNATURE_SECONDES);
        urlPptx = data?.signedUrl ?? null;
      }
      return (
        <div className="max-w-2xl">
          {enTete}
          <div className="rounded-doux border border-mousse/40 bg-mousse/5 p-6 text-center">
            <p className="mb-4 text-sm text-encre">
              Ce journal est finalisé et figé.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {urlPdf && (
                <a
                  href={urlPdf}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white hover:bg-mousse"
                >
                  Télécharger le PDF
                </a>
              )}
              {urlPptx && (
                <a
                  href={urlPptx}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-doux border border-mousse-fonce px-4 py-2.5 text-sm font-medium text-mousse-fonce hover:bg-mousse/10"
                >
                  Télécharger en PowerPoint (pour Canva…)
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    const { data: activitesPeriode } = await supabase
      .from("activites")
      .select("id, titre, date_activite, contextes_activite(libelle)")
      .eq("parcours_id", dossier.parcours_id)
      .gte("date_activite", dossier.periode_debut as string)
      .lte("date_activite", dossier.periode_fin as string)
      .order("date_activite", { ascending: true });

    const { data: elementsInclus } = await supabase
      .from("dossiers_export_elements")
      .select("activite_id")
      .eq("dossier_id", dossier.id)
      .eq("type_element", "activite");

    const idsInclus = new Set((elementsInclus ?? []).map((e) => e.activite_id as string));

    return (
      <div className="max-w-2xl">
        {enTete}
        <p className="mb-4 text-sm text-ardoise">
          Du {new Date(dossier.periode_debut as string).toLocaleDateString("fr-FR")} au{" "}
          {new Date(dossier.periode_fin as string).toLocaleDateString("fr-FR")} —{" "}
          {idsInclus.size} activité{idsInclus.size > 1 ? "s" : ""} incluse
          {idsInclus.size > 1 ? "s" : ""} sur {activitesPeriode?.length ?? 0}.
        </p>

        {!activitesPeriode || activitesPeriode.length === 0 ? (
          <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
            Aucune activité enregistrée sur cette période.
          </p>
        ) : (
          <ul className="mb-6 space-y-2">
            {activitesPeriode.map((a) => {
              const contexte = Array.isArray(a.contextes_activite)
                ? a.contextes_activite[0]
                : a.contextes_activite;
              return (
                <li
                  key={a.id}
                  className="rounded-doux border border-trait bg-white/80 p-3 shadow-doux"
                >
                  <BasculeElement
                    dossierId={dossier.id}
                    cibleId={a.id}
                    inclus={idsInclus.has(a.id)}
                    type="activite"
                    label={a.titre as string}
                  />
                  <p className="ml-6 text-xs text-ardoise">
                    {new Date(a.date_activite as string).toLocaleDateString("fr-FR")}
                    {contexte ? ` · ${contexte.libelle}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <BoutonFinaliserJournal dossierId={dossier.id} />
      </div>
    );
  }

  // --- Couverture complete des competences du cycle, statut cumulatif
  // reel (voir v_synthese_cumulee_cycle) -- plus de selection curatee
  // d'activites par domaine : chaque competence du programme apparait,
  // avec son statut reel, meme si elle n'a jamais ete observee.
  const enfantId = parcours?.enfant_id as string | undefined;
  const cycleId = parcours?.cycle_id as string | undefined;

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
      .eq("cycle_id", cycleId ?? "")
      .order("domaine"),
    supabase
      .from("v_synthese_cumulee_cycle")
      .select("element_programme_id, statut_code")
      .eq("enfant_id", enfantId ?? "")
      .eq("cycle_id", cycleId ?? ""),
    supabase.from("statuts_progression").select("code, libelle").order("ordre"),
    supabase.from("v_chemin_complet_objectif").select("objectif_id, chemin"),
    supabase
      .from("dossiers_export_formulations")
      .select("element_programme_id, texte, exemple_activite_ids")
      .eq("dossier_id", params.id),
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

  // Details des activites utilisees comme exemples (titre, date, texte),
  // recuperes en une seule requete groupee pour tous les exemples de
  // toutes les competences a la fois.
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

  const objectifsParDomaine = new Map<string, typeof tousLesObjectifs>();
  for (const o of tousLesObjectifs ?? []) {
    const liste = objectifsParDomaine.get(o.domaine as string) ?? [];
    liste.push(o);
    objectifsParDomaine.set(o.domaine as string, liste);
  }

  const totalObjectifs = (tousLesObjectifs ?? []).length;
  const nbObserves = (tousLesObjectifs ?? []).filter((o) => {
    const s = statutParObjectif.get(o.objectif_id as string);
    return s && s !== "non_encore_observe";
  }).length;
  const nbEnAttenteFormulation = (tousLesObjectifs ?? []).filter((o) => {
    const id = o.objectif_id as string;
    const s = statutParObjectif.get(id);
    return s && s !== "non_encore_observe" && !formulationParObjectif.get(id)?.texte;
  }).length;

  const resume = (
    <div className="mb-8 rounded-doux border border-argile/30 bg-argile/5 p-5">
      <p className="mb-1 text-sm font-medium text-encre">
        Couverture du programme
      </p>
      <p className="text-sm text-encre">
        {nbObserves} compétence{nbObserves > 1 ? "s" : ""} observée
        {nbObserves > 1 ? "s" : ""} sur {totalObjectifs} au total pour ce
        cycle. Statut cumulé sur toutes les années du cycle, comme sur la
        page Progression.
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
    let urlPptx: string | null = null;
    if (dossier.pptx_final_storage_path) {
      const { data } = await supabase.storage
        .from("traces-pedagogiques")
        .createSignedUrl(dossier.pptx_final_storage_path, DUREE_SIGNATURE_SECONDES);
      urlPptx = data?.signedUrl ?? null;
    }

    return (
      <div>
        {enTete}
        <span className="mb-6 inline-block rounded-full bg-mousse/10 px-2.5 py-0.5 text-xs text-mousse-fonce">
          Finalisé
        </span>

        {resume}

        {(urlPdf || urlPptx) && (
          <p className="mb-6 flex flex-wrap gap-3">
            {urlPdf && (
              <a
                href={urlPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white hover:bg-mousse"
              >
                Télécharger le PDF
              </a>
            )}
            {urlPptx && (
              <a
                href={urlPptx}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-doux border border-mousse-fonce px-4 py-2.5 text-sm font-medium text-mousse-fonce hover:bg-mousse/10"
              >
                Télécharger en PowerPoint (pour Canva…)
              </a>
            )}
          </p>
        )}

        <p className="text-sm text-ardoise">
          Ce dossier est figé : le contenu ci-dessus correspond au document
          téléchargeable, tel qu&rsquo;il a été généré.
        </p>
      </div>
    );
  }

  // --- Dossier en brouillon : preparation et relecture des formulations ---
  return (
    <div>
      {enTete}
      <span className="mb-6 inline-block rounded-full bg-trait px-2.5 py-0.5 text-xs text-ardoise">
        Brouillon
      </span>

      {resume}

      <p className="mb-4 text-sm text-ardoise">
        Chaque compétence du cycle apparaît ci-dessous avec son statut réel.
        Préparez les formulations, relisez-les et corrigez-les si besoin,
        puis finalisez le document.
      </p>

      <BoutonPreparerFormulations dossierId={params.id} nbEnAttente={nbEnAttenteFormulation} />

      <div className="space-y-3">
        {Array.from(objectifsParDomaine.entries()).map(([domaine, objectifs]) => {
          const compteParLibelle = new Map<string, number>();
          for (const o of objectifs ?? []) {
            const l = o.libelle as string;
            compteParLibelle.set(l, (compteParLibelle.get(l) ?? 0) + 1);
          }
          return (
            <details
              key={domaine}
              className="rounded-doux border border-trait bg-white/80 shadow-doux"
              open
            >
              <summary className="cursor-pointer list-none p-4 text-sm font-medium text-encre">
                {domaine}
              </summary>
              <ul className="space-y-4 border-t border-trait p-4 pt-3">
                {(objectifs ?? []).map((o) => {
                  const objectifId = o.objectif_id as string;
                  const statutCode = statutParObjectif.get(objectifId) ?? "non_encore_observe";
                  const statutLibelle =
                    libellesStatuts.get(statutCode) ?? "Non encore abordée";
                  const observee = statutCode !== "non_encore_observe";
                  const formulation = formulationParObjectif.get(objectifId);
                  const dupliqueDansLeDomaine = (compteParLibelle.get(o.libelle as string) ?? 0) > 1;

                  return (
                    <li key={objectifId} className="border-b border-trait pb-3 last:border-b-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-encre">{o.libelle}</p>
                          {dupliqueDansLeDomaine && cheminParObjectif.has(objectifId) && (
                            <p className="text-xs text-ardoise">{cheminParObjectif.get(objectifId)}</p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${
                            observee
                              ? "bg-mousse/15 text-mousse-fonce"
                              : "bg-trait text-ardoise"
                          }`}
                        >
                          {statutLibelle}
                        </span>
                      </div>

                      {!observee && (
                        <p className="mt-1 text-xs text-ardoise">
                          Aucune activité n&rsquo;a encore porté sur cette compétence.
                        </p>
                      )}

                      {observee && formulation && formulation.exempleIds.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {formulation.exempleIds.map((id) => {
                            const a = exempleActiviteParId.get(id);
                            if (!a) return null;
                            return (
                              <li key={id} className="text-xs text-ardoise">
                                {new Date(a.date_activite as string).toLocaleDateString("fr-FR")} —{" "}
                                {a.titre as string}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {observee && formulation?.texte && (
                        <EditeurFormulation
                          dossierId={params.id}
                          elementProgrammeId={objectifId}
                          texteInitial={formulation.texte}
                        />
                      )}

                      {observee && !formulation?.texte && (
                        <p className="mt-1 text-xs text-ardoise">
                          Formulation pas encore préparée.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>

      <div className="mt-8">
        <BoutonFinaliser dossierId={params.id} />
      </div>
    </div>
  );
}
