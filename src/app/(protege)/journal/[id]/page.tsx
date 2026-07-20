import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireTrace } from "./FormulaireTrace";
import { supprimerTrace } from "./actions";
import { supprimerObservation } from "./competences/actions";

const DUREE_SIGNATURE_SECONDES = 60 * 60; // 1 heure, cf. Corrections-Schema-et-Lot1.md, section 11

export default async function PageActivite({ params }: { params: { id: string } }) {
  const supabase = creerClientServeur();

  const { data: activite } = await supabase
    .from("activites")
    .select(
      `id, titre, description, date_activite, lieu, observations, paroles_enfant,
       contextes_activite(libelle), statuts_activite(libelle),
       parcours_scolaires(enfants(prenom, famille_id), annees_scolaires(libelle))`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!activite) notFound();

  const parcoursBrut = Array.isArray(activite.parcours_scolaires)
    ? activite.parcours_scolaires[0]
    : activite.parcours_scolaires;
  const enfant = parcoursBrut
    ? Array.isArray(parcoursBrut.enfants)
      ? parcoursBrut.enfants[0]
      : parcoursBrut.enfants
    : null;
  const annee = parcoursBrut
    ? Array.isArray(parcoursBrut.annees_scolaires)
      ? parcoursBrut.annees_scolaires[0]
      : parcoursBrut.annees_scolaires
    : null;
  const contexte = Array.isArray(activite.contextes_activite)
    ? activite.contextes_activite[0]
    : activite.contextes_activite;

  const familleId = enfant?.famille_id as string | undefined;

  const [{ data: tracesBrutes }, { data: typesBruts }, { data: observationsBrutes }] =
    await Promise.all([
      supabase
        .from("traces")
        .select(
          "id, legende, date_trace, contenu_texte, chemin_stockage, miniature_chemin_stockage, types_trace(libelle)"
        )
        .eq("activite_id", params.id)
        .order("date_trace", { ascending: false }),
      supabase
        .from("types_trace")
        .select("code, libelle")
        .eq("actif", true)
        .neq("code", "audio") // pas encore implémenté côté interface (V1)
        .order("ordre"),
      supabase
        .from("observations_elements_programme")
        .select(
          "id, justification, elements_programme(libelle), niveaux_autonomie(libelle)"
        )
        .eq("activite_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

  const observations = (observationsBrutes ?? []).map((o) => {
    const element = Array.isArray(o.elements_programme)
      ? o.elements_programme[0]
      : o.elements_programme;
    const niveau = Array.isArray(o.niveaux_autonomie)
      ? o.niveaux_autonomie[0]
      : o.niveaux_autonomie;
    return {
      id: o.id as string,
      elementLibelle: element?.libelle as string | undefined,
      niveauLibelle: niveau?.libelle as string | undefined,
      justification: o.justification as string | null,
    };
  });

  const traces = await Promise.all(
    (tracesBrutes ?? []).map(async (t) => {
      const type = Array.isArray(t.types_trace) ? t.types_trace[0] : t.types_trace;
      let urlMiniature: string | null = null;
      let urlFichier: string | null = null;

      if (t.miniature_chemin_stockage) {
        const { data } = await supabase.storage
          .from("traces-pedagogiques")
          .createSignedUrl(t.miniature_chemin_stockage, DUREE_SIGNATURE_SECONDES);
        urlMiniature = data?.signedUrl ?? null;
      }

      if (t.chemin_stockage) {
        const { data } = await supabase.storage
          .from("traces-pedagogiques")
          .createSignedUrl(t.chemin_stockage, DUREE_SIGNATURE_SECONDES);
        urlFichier = data?.signedUrl ?? null;
      }

      return {
        id: t.id as string,
        legende: t.legende as string | null,
        date: t.date_trace as string,
        contenuTexte: t.contenu_texte as string | null,
        typeLibelle: type?.libelle as string | undefined,
        urlMiniature,
        urlFichier,
      };
    })
  );

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_360px]">
      <div>
        <Link href="/journal" className="mb-6 inline-block text-sm text-ardoise hover:text-encre">
          ← Retour au journal
        </Link>

        <h1 className="mb-1 font-display text-2xl italic text-encre">{activite.titre}</h1>
        <p className="mb-6 text-sm text-ardoise">
          {enfant?.prenom} · {annee?.libelle} ·{" "}
          {new Date(activite.date_activite as string).toLocaleDateString("fr-FR")}
          {contexte ? ` · ${contexte.libelle}` : ""}
        </p>

        {activite.description && (
          <p className="mb-4 text-sm text-encre">{activite.description}</p>
        )}
        {activite.observations && (
          <p className="mb-4 text-sm text-ardoise">
            <span className="font-medium text-encre">Observations : </span>
            {activite.observations}
          </p>
        )}
        {activite.paroles_enfant && (
          <p className="mb-6 text-sm italic text-ardoise">
            « {activite.paroles_enfant} »
          </p>
        )}

        <Link
          href={`/journal/${params.id}/competences`}
          className="mb-4 inline-block rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse"
        >
          Relier à des compétences
        </Link>

        {observations.length > 0 && (
          <ul className="mb-6 space-y-2">
            {observations.map((o) => (
              <li
                key={o.id}
                className="flex items-start justify-between gap-3 rounded-doux border border-trait bg-white/80 p-3 text-sm shadow-doux"
              >
                <div>
                  <p className="text-encre">{o.elementLibelle}</p>
                  <p className="text-xs text-ardoise">{o.niveauLibelle}</p>
                  {o.justification && (
                    <p className="mt-1 text-xs text-ardoise">{o.justification}</p>
                  )}
                </div>
                <form action={supprimerObservation.bind(null, o.id, params.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-xs text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mb-4 font-display text-xl italic text-encre">Traces</h2>

        {traces.length === 0 ? (
          <p className="rounded-doux border border-dashed border-trait bg-white/50 p-6 text-center text-sm text-ardoise">
            Aucune trace ajoutée pour l&rsquo;instant.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {traces.map((t) => (
              <li
                key={t.id}
                className="rounded-doux border border-trait bg-white/80 p-3 shadow-doux"
              >
                {t.urlMiniature ? (
                  <a href={t.urlFichier ?? t.urlMiniature} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.urlMiniature}
                      alt={t.legende ?? t.typeLibelle ?? "Trace"}
                      className="mb-2 h-24 w-full rounded object-cover"
                    />
                  </a>
                ) : t.urlFichier ? (
                  <a
                    href={t.urlFichier}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2 flex h-24 flex-col items-center justify-center gap-1 rounded bg-lin text-center text-mousse-fonce hover:bg-trait"
                  >
                    <span className="text-2xl">📄</span>
                    <span className="text-xs underline underline-offset-2">
                      Ouvrir le document
                    </span>
                  </a>
                ) : (
                  <p className="mb-2 line-clamp-3 text-sm text-encre">
                    {t.contenuTexte}
                  </p>
                )}
                <p className="text-xs text-ardoise">{t.typeLibelle}</p>
                {t.legende && <p className="text-xs text-encre">{t.legende}</p>}
                <form action={supprimerTrace.bind(null, t.id, params.id)} className="mt-1">
                  <button
                    type="submit"
                    className="text-xs text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      {familleId && (
        <FormulaireTrace
          activiteId={params.id}
          familleId={familleId}
          types={typesBruts ?? []}
        />
      )}
    </div>
  );
}
