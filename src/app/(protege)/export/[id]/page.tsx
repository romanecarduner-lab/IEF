import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { BasculeElement } from "./BasculeElement";
import { BoutonFinaliser } from "./BoutonFinaliser";
import { BoutonFinaliserJournal } from "./BoutonFinaliserJournal";
import { BoutonPreparerFormulations } from "./BoutonPreparerFormulations";
import { EditeurFormulation } from "./EditeurFormulation";
import { AideContextuelle } from "@/components/AideContextuelle";
import { SelecteurExemples } from "./SelecteurExemples";
import { lireExemples, morceaux } from "@/lib/exemplesExport";

// Duree maximale d'execution des actions serveur declenchees depuis cette page
// (preparation groupee, rattrapage) : par defaut trop courte pour plusieurs
// appels de redaction successifs.
export const maxDuration = 60;

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

  const estJournalPeriode = dossier.type_dossier === "journal_periode";

  const enTete = (
    <div className="mb-6">
      <Link href="/export" className="mb-4 inline-block text-sm text-ardoise hover:text-encre">
        ← Retour aux dossiers
      </Link>
      <h1 className="font-display text-2xl italic text-encre">
        {dossier.titre}
        <AideContextuelle
          titre={estJournalPeriode ? "Le journal de période" : "Le dossier pédagogique"}
          variante="page"
        >
          {estJournalPeriode ? (
            <>
              La liste chronologique des activités de cette période.
              Cochez celles à inclure, puis cliquez sur &laquo; Finaliser &raquo; pour
              générer le document final (PDF). Une fois finalisé, le
              dossier est figé.
            </>
          ) : (
            <>
              Ce dossier couvre automatiquement toutes les compétences du
              cycle, organisées par domaine puis sous-domaine, avec leur
              statut réel. Cliquez sur &laquo; Préparer les formulations &raquo; pour
              générer en une fois une synthèse et des exemples pour
              chaque sous-domaine déjà abordé — relisez et corrigez-les
              librement, puis cliquez sur &laquo; Finaliser &raquo; pour générer le
              document (PDF et PowerPoint). Une fois finalisé, le
              dossier est figé.
            </>
          )}
        </AideContextuelle>
      </h1>
      <p className="text-sm text-ardoise">
        {enfant?.prenom} · {annee?.libelle}
      </p>
      <p className="mt-2 text-sm text-ardoise">
        {estJournalPeriode
          ? "Cochez les activités de cette période à inclure dans le document, puis finalisez pour générer le PDF."
          : "Préparez les formulations ci-dessous, relisez-les, puis finalisez pour générer le document."}
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

  // --- Synthese par sous-domaine (ce qui a ete observe, melange et
  // ecrit au positif), avec deux exemples illustres par sous-domaine --
  // remplace la liste competence par competence dans ce document,
  // laquelle reste disponible telle quelle sur la page Progression.
  const { data: sousDomainesBruts } = await supabase
    .from("dossiers_export_sous_domaines")
    .select("domaine, sous_domaine, synthese, exemples")
    .eq("dossier_id", params.id)
    .order("domaine")
    .order("sous_domaine");

  const exemplesParSousDomaine = new Map(
    (sousDomainesBruts ?? []).map((s) => [s.sous_domaine as string, lireExemples(s)])
  );
  const idsActivitesExemples = Array.from(
    new Set(Array.from(exemplesParSousDomaine.values()).flatMap((l) => l.map((e) => e.activite_id)))
  );
  const idsPhotosRetenues = Array.from(
    new Set(Array.from(exemplesParSousDomaine.values()).flatMap((l) => l.flatMap((e) => e.trace_ids)))
  );

  const [{ data: activitesExemples }, { data: photosRetenues }] = await Promise.all([
    idsActivitesExemples.length > 0
      ? supabase.from("activites").select("id, titre, date_activite").in("id", idsActivitesExemples)
      : Promise.resolve({ data: [] }),
    idsPhotosRetenues.length > 0
      ? supabase
          .from("traces")
          .select("id, chemin_stockage, miniature_chemin_stockage")
          .in("id", idsPhotosRetenues)
      : Promise.resolve({ data: [] }),
  ]);

  const activiteParId = new Map((activitesExemples ?? []).map((a) => [a.id as string, a]));

  // Liens temporaires des photos retenues, en une seule requete groupee.
  const cheminParPhoto = new Map(
    (photosRetenues ?? []).flatMap((t) => {
      const chemin = (t.miniature_chemin_stockage ?? t.chemin_stockage) as string | null;
      return chemin ? [[t.id as string, chemin] as const] : [];
    })
  );
  const urlParChemin = new Map<string, string>();
  const cheminsUniques = Array.from(new Set(cheminParPhoto.values()));
  for (const groupe of morceaux(cheminsUniques, 80)) {
    const { data } = await supabase.storage
      .from("traces-pedagogiques")
      .createSignedUrls(groupe, DUREE_SIGNATURE_SECONDES);
    for (const e of data ?? []) {
      if (e.path && e.signedUrl) urlParChemin.set(e.path, e.signedUrl);
    }
  }
  const urlPhoto = (traceId: string): string | undefined => {
    const chemin = cheminParPhoto.get(traceId);
    return chemin ? urlParChemin.get(chemin) : undefined;
  };

  const sousDomainesParDomaine = new Map<string, typeof sousDomainesBruts>();
  for (const s of sousDomainesBruts ?? []) {
    const liste = sousDomainesParDomaine.get(s.domaine as string) ?? [];
    liste.push(s);
    sousDomainesParDomaine.set(s.domaine as string, liste);
  }

  const resume = (
    <div className="mb-8 rounded-doux border border-argile/30 bg-argile/5 p-5">
      <p className="mb-1 text-sm font-medium text-encre">Contenu du dossier</p>
      <p className="text-sm text-encre">
        {(sousDomainesBruts ?? []).length} sous-domaine
        {(sousDomainesBruts ?? []).length > 1 ? "s" : ""} déjà renseigné
        {(sousDomainesBruts ?? []).length > 1 ? "s" : ""}, à partir des compétences
        validées, cumulées sur tout le cycle. La liste complète,
        compétence par compétence, reste consultable sur{" "}
        <Link href="/progression" className="underline underline-offset-2 hover:text-encre">
          Progression
        </Link>
        .
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

  // --- Dossier en brouillon : preparation et relecture ---
  return (
    <div>
      {enTete}
      <span className="mb-6 inline-block rounded-full bg-trait px-2.5 py-0.5 text-xs text-ardoise">
        Brouillon
      </span>

      {resume}

      <p className="mb-4 text-sm text-ardoise">
        Pour chaque sous-domaine déjà abordé, une synthèse à relire et
        deux exemples illustrés. Les sous-domaines pas encore abordés
        n&rsquo;apparaissent pas ici.
      </p>

      <BoutonPreparerFormulations dossierId={params.id} />

      {(sousDomainesBruts ?? []).length === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Aucun sous-domaine préparé pour l&rsquo;instant. Cliquez sur
          &laquo; Préparer les formulations &raquo; ci-dessus pour commencer.
        </p>
      ) : (
        <div className="space-y-3">
          {Array.from(sousDomainesParDomaine.entries()).map(([domaine, sousDomaines]) => (
            <details
              key={domaine}
              className="rounded-doux border border-trait bg-white/80 shadow-doux"
              open
            >
              <summary className="cursor-pointer list-none p-4 text-sm font-medium text-encre">
                {domaine}
              </summary>
              <div className="space-y-5 border-t border-trait p-4 pt-3">
                {(sousDomaines ?? []).map((s) => {
                  const nomSousDomaine = s.sous_domaine as string;
                  const exemples = exemplesParSousDomaine.get(nomSousDomaine) ?? [];

                  return (
                    <div key={nomSousDomaine}>
                      <p className="mb-2 text-sm font-medium text-encre">{nomSousDomaine}</p>
                      <EditeurFormulation
                        dossierId={params.id}
                        sousDomaine={nomSousDomaine}
                        texteInitial={(s.synthese as string) ?? ""}
                        rows={4}
                      />

                      {exemples.length > 0 && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {exemples.map((e) => {
                            const activite = activiteParId.get(e.activite_id);
                            const photos = e.trace_ids.map(urlPhoto).filter((u): u is string => Boolean(u));
                            return (
                              <div
                                key={e.activite_id}
                                className="rounded-doux border border-trait bg-white p-3"
                              >
                                {photos.length > 0 && (
                                  <div
                                    className={`mb-2 grid gap-1 ${
                                      photos.length === 1 ? "grid-cols-1" : "grid-cols-2"
                                    }`}
                                  >
                                    {photos.map((url, i) => (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        key={i}
                                        src={url}
                                        alt=""
                                        className={`w-full rounded-doux object-cover ${
                                          photos.length === 1 ? "h-32" : "h-20"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs font-medium text-encre">
                                  {activite?.titre as string | undefined}
                                </p>
                                <p className="mb-1 text-xs text-ardoise">
                                  {activite?.date_activite
                                    ? new Date(activite.date_activite as string).toLocaleDateString("fr-FR")
                                    : ""}
                                </p>
                                <EditeurFormulation
                                  dossierId={params.id}
                                  sousDomaine={nomSousDomaine}
                                  activiteId={e.activite_id}
                                  texteInitial={e.synthese ?? ""}
                                  rows={3}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <SelecteurExemples dossierId={params.id} sousDomaine={nomSousDomaine} />
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      )}

      <div className="mt-8">
        <BoutonFinaliser dossierId={params.id} />
      </div>
    </div>
  );
}
