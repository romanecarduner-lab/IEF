import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";

export default async function PageTableauDeBord() {
  const supabase = creerClientServeur();

  const [
    { count: nbEnfants },
    { count: nbActivites },
    { count: nbTraces },
    { count: nbDossiersFinalises },
    { data: parcoursBruts },
    { data: recentesBrutes },
  ] = await Promise.all([
    supabase.from("enfants").select("id", { count: "exact", head: true }),
    supabase.from("activites").select("id", { count: "exact", head: true }),
    supabase.from("traces").select("id", { count: "exact", head: true }),
    supabase
      .from("dossiers_export")
      .select("id", { count: "exact", head: true })
      .eq("statut", "finalise"),
    supabase
      .from("parcours_scolaires")
      .select("id, enfants(prenom), annees_scolaires(libelle), activites(count)")
      .order("created_at", { ascending: false }),
    supabase
      .from("activites")
      .select("id, titre, date_activite, parcours_scolaires(enfants(prenom))")
      .order("date_activite", { ascending: false })
      .limit(5),
  ]);

  const parcours = (parcoursBruts ?? []).map((p) => {
    const enfant = Array.isArray(p.enfants) ? p.enfants[0] : p.enfants;
    const annee = Array.isArray(p.annees_scolaires)
      ? p.annees_scolaires[0]
      : p.annees_scolaires;
    const activitesCount = Array.isArray(p.activites)
      ? (p.activites[0] as { count: number } | undefined)?.count ?? 0
      : 0;
    return {
      id: p.id as string,
      enfant: enfant?.prenom as string | undefined,
      annee: annee?.libelle as string | undefined,
      nbActivites: activitesCount,
    };
  });

  const recentes = (recentesBrutes ?? []).map((a) => {
    const parcoursActivite = Array.isArray(a.parcours_scolaires)
      ? a.parcours_scolaires[0]
      : a.parcours_scolaires;
    const enfant = parcoursActivite
      ? Array.isArray(parcoursActivite.enfants)
        ? parcoursActivite.enfants[0]
        : parcoursActivite.enfants
      : null;
    return {
      id: a.id as string,
      titre: a.titre as string,
      date: a.date_activite as string,
      enfant: enfant?.prenom as string | undefined,
    };
  });

  const cartes = [
    { libelle: "Enfants", valeur: nbEnfants ?? 0 },
    { libelle: "Activités", valeur: nbActivites ?? 0 },
    { libelle: "Traces", valeur: nbTraces ?? 0 },
    { libelle: "Dossiers finalisés", valeur: nbDossiersFinalises ?? 0 },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl italic text-encre">
        Tableau de bord
      </h1>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cartes.map((c) => (
          <div
            key={c.libelle}
            className="rounded-doux border border-trait bg-white/80 p-4 text-center shadow-doux"
          >
            <p className="font-display text-2xl italic text-encre">{c.valeur}</p>
            <p className="text-xs text-ardoise">{c.libelle}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-medium text-encre">Par enfant / année</p>
          {parcours.length === 0 ? (
            <p className="text-sm text-ardoise">Aucun parcours créé pour l&rsquo;instant.</p>
          ) : (
            <ul className="space-y-2">
              {parcours.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-doux border border-trait bg-white/80 p-3 text-sm shadow-doux"
                >
                  <span className="text-encre">
                    {p.enfant} · {p.annee}
                  </span>
                  <span className="text-xs text-ardoise">
                    {p.nbActivites} activité{p.nbActivites > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/progression"
            className="mt-3 inline-block text-xs font-medium text-mousse-fonce underline underline-offset-2"
          >
            Voir la progression détaillée →
          </Link>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-encre">Activité récente</p>
          {recentes.length === 0 ? (
            <p className="text-sm text-ardoise">Aucune activité enregistrée pour l&rsquo;instant.</p>
          ) : (
            <ul className="space-y-2">
              {recentes.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/journal/${a.id}`}
                    className="block rounded-doux border border-trait bg-white/80 p-3 text-sm shadow-doux hover:border-mousse-clair"
                  >
                    <span className="text-encre">{a.titre}</span>
                    <span className="block text-xs text-ardoise">
                      {a.enfant} · {new Date(a.date).toLocaleDateString("fr-FR")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/journal"
            className="mt-3 inline-block text-xs font-medium text-mousse-fonce underline underline-offset-2"
          >
            Voir tout le journal →
          </Link>
        </div>
      </div>
    </div>
  );
}
