import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";

const DUREE_SIGNATURE_SECONDES = 60 * 60;

export default async function PagePortfolio({
  searchParams,
}: {
  searchParams: { enfant?: string; annee?: string; type?: string };
}) {
  const supabase = creerClientServeur();

  const [{ data: enfants }, { data: annees }, { data: types }] = await Promise.all([
    supabase.from("enfants").select("id, prenom").order("prenom"),
    supabase
      .from("annees_scolaires")
      .select("id, libelle")
      .order("date_debut", { ascending: false }),
    supabase.from("types_trace").select("code, libelle").eq("actif", true).order("ordre"),
  ]);

  const enfantId = searchParams.enfant ?? "";
  const anneeId = searchParams.annee ?? "";
  const typeCode = searchParams.type ?? "";

  let requete = supabase
    .from("traces")
    .select(
      `id, legende, date_trace, contenu_texte, chemin_stockage, miniature_chemin_stockage,
       types_trace!inner(code, libelle),
       activites!inner(id, titre, parcours_scolaires!inner(enfant_id, annee_scolaire_id, enfants(prenom)))`
    )
    .order("date_trace", { ascending: false })
    .limit(100);

  if (enfantId) requete = requete.eq("activites.parcours_scolaires.enfant_id", enfantId);
  if (anneeId) requete = requete.eq("activites.parcours_scolaires.annee_scolaire_id", anneeId);
  if (typeCode) requete = requete.eq("types_trace.code", typeCode);

  const { data: tracesBrutes } = await requete;

  const traces = await Promise.all(
    (tracesBrutes ?? []).map(async (t) => {
      const type = Array.isArray(t.types_trace) ? t.types_trace[0] : t.types_trace;
      const activite = Array.isArray(t.activites) ? t.activites[0] : t.activites;
      const parcours = activite
        ? Array.isArray(activite.parcours_scolaires)
          ? activite.parcours_scolaires[0]
          : activite.parcours_scolaires
        : null;
      const enfant = parcours
        ? Array.isArray(parcours.enfants)
          ? parcours.enfants[0]
          : parcours.enfants
        : null;

      let urlMiniature: string | null = null;
      if (t.miniature_chemin_stockage) {
        const { data } = await supabase.storage
          .from("traces-pedagogiques")
          .createSignedUrl(t.miniature_chemin_stockage as string, DUREE_SIGNATURE_SECONDES);
        urlMiniature = data?.signedUrl ?? null;
      }

      return {
        id: t.id as string,
        legende: t.legende as string | null,
        date: t.date_trace as string,
        contenuTexte: t.contenu_texte as string | null,
        typeCode: type?.code as string | undefined,
        typeLibelle: type?.libelle as string | undefined,
        activiteId: activite?.id as string | undefined,
        activiteTitre: activite?.titre as string | undefined,
        enfant: enfant?.prenom as string | undefined,
        urlMiniature,
      };
    })
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl italic text-encre">Portfolio</h1>

      <form
        method="get"
        className="mb-8 grid gap-3 rounded-doux border border-trait bg-white/80 p-4 shadow-doux sm:grid-cols-3"
      >
        <div>
          <label htmlFor="enfant" className="mb-1.5 block text-sm font-medium text-encre">
            Enfant
          </label>
          <select
            id="enfant"
            name="enfant"
            defaultValue={enfantId}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            <option value="">Tous</option>
            {(enfants ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.prenom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="annee" className="mb-1.5 block text-sm font-medium text-encre">
            Année scolaire
          </label>
          <select
            id="annee"
            name="annee"
            defaultValue={anneeId}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            <option value="">Toutes</option>
            {(annees ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-encre">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={typeCode}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            <option value="">Tous</option>
            {(types ?? []).map((t) => (
              <option key={t.code} value={t.code}>
                {t.libelle}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse"
          >
            Filtrer
          </button>
        </div>
      </form>

      {traces.length === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Aucune trace ne correspond à ces critères.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {traces.map((t) => (
            <li key={t.id}>
              <Link
                href={t.activiteId ? `/journal/${t.activiteId}` : "/journal"}
                className="block rounded-doux border border-trait bg-white/80 p-2 shadow-doux hover:border-mousse-clair"
              >
                {t.urlMiniature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.urlMiniature}
                    alt={t.legende ?? t.typeLibelle ?? "Trace"}
                    className="mb-2 h-28 w-full rounded object-cover"
                  />
                ) : (
                  <div className="mb-2 flex h-28 w-full flex-col items-center justify-center rounded bg-lin p-2 text-center">
                    <span className="text-xl">
                      {t.typeCode === "citation" || t.typeCode === "observation_parentale"
                        ? "💬"
                        : "📄"}
                    </span>
                    {t.contenuTexte && (
                      <span className="mt-1 line-clamp-2 text-xs text-encre">
                        {t.contenuTexte}
                      </span>
                    )}
                  </div>
                )}
                <p className="truncate text-xs text-encre">
                  {t.legende || t.activiteTitre}
                </p>
                <p className="text-xs text-ardoise">
                  {t.enfant} · {new Date(t.date).toLocaleDateString("fr-FR")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
