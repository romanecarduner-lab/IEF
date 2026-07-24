import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";

export default async function PageRecherche({
  searchParams,
}: {
  searchParams: { q?: string; enfant?: string; du?: string; au?: string };
}) {
  const supabase = creerClientServeur();

  const { data: enfants } = await supabase
    .from("enfants")
    .select("id, prenom")
    .order("prenom");

  const texte = searchParams.q?.trim() ?? "";
  const enfantId = searchParams.enfant ?? "";
  const du = searchParams.du ?? "";
  const au = searchParams.au ?? "";

  const rechercheLancee = Boolean(texte || enfantId || du || au);

  let requete = supabase
    .from("activites")
    .select(
      "id, titre, description, date_activite, contextes_activite(libelle), parcours_scolaires!inner(enfant_id, enfants(prenom), annees_scolaires(libelle))"
    )
    .order("date_activite", { ascending: false })
    .limit(50);

  if (texte) {
    requete = requete.or(
      `titre.ilike.%${texte}%,description.ilike.%${texte}%,observations.ilike.%${texte}%,paroles_enfant.ilike.%${texte}%`
    );
  }
  if (enfantId) {
    requete = requete.eq("parcours_scolaires.enfant_id", enfantId);
  }
  if (du) {
    requete = requete.gte("date_activite", du);
  }
  if (au) {
    requete = requete.lte("date_activite", au);
  }

  const { data: resultatsBruts } = rechercheLancee
    ? await requete
    : { data: [] };

  const resultats = (resultatsBruts ?? []).map((a) => {
    const parcours = Array.isArray(a.parcours_scolaires)
      ? a.parcours_scolaires[0]
      : a.parcours_scolaires;
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
    const contexte = Array.isArray(a.contextes_activite)
      ? a.contextes_activite[0]
      : a.contextes_activite;
    return {
      id: a.id as string,
      titre: a.titre as string,
      description: a.description as string | null,
      date: a.date_activite as string,
      enfant: enfant?.prenom as string | undefined,
      annee: annee?.libelle as string | undefined,
      contexte: contexte?.libelle as string | undefined,
    };
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl italic text-encre">Recherche</h1>

      <form
        method="get"
        className="mb-8 grid gap-3 rounded-doux border border-trait bg-white/80 p-4 shadow-doux sm:grid-cols-2 md:grid-cols-4"
      >
        <div className="sm:col-span-2 md:col-span-1">
          <label htmlFor="q" className="mb-1.5 block text-sm font-medium text-encre">
            Mot-clé
          </label>
          <input
            type="search"
            id="q"
            name="q"
            defaultValue={texte}
            placeholder="cabane, comptine…"
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>
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
          <label htmlFor="du" className="mb-1.5 block text-sm font-medium text-encre">
            Du
          </label>
          <input
            type="date"
            id="du"
            name="du"
            defaultValue={du}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="au" className="mb-1.5 block text-sm font-medium text-encre">
            Au
          </label>
          <input
            type="date"
            id="au"
            name="au"
            defaultValue={au}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2 md:col-span-4">
          <button
            type="submit"
            className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse"
          >
            Rechercher
          </button>
        </div>
      </form>

      {!rechercheLancee ? (
        <p className="text-sm text-ardoise">
          Renseignez au moins un critère pour lancer la recherche.
        </p>
      ) : resultats.length === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Aucune activité ne correspond à ces critères.
        </p>
      ) : (
        <ul className="space-y-3">
          {resultats.map((r) => (
            <li key={r.id}>
              <Link
                href={`/journal/${r.id}`}
                className="block rounded-doux border border-trait bg-white/80 p-4 shadow-doux hover:border-mousse-clair"
              >
                <p className="font-display text-lg italic text-encre">{r.titre}</p>
                <p className="text-sm text-ardoise">
                  {r.enfant} · {r.annee} · {new Date(r.date).toLocaleDateString("fr-FR")}
                  {r.contexte ? ` · ${r.contexte}` : ""}
                </p>
                {r.description && (
                  <p className="mt-1 text-sm text-encre">{r.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
