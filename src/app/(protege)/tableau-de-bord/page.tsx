import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { GraphiqueProgression, type DonneesDomaine } from "../progression/GraphiqueProgression";

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

  const parcoursPrincipal = parcours[0];

  let donneesGraphique: DonneesDomaine[] = [];
  if (parcoursPrincipal) {
    const [{ data: totauxDomaine }, { data: repartitionDomaine }] = await Promise.all([
      supabase.from("v_total_objectifs_par_domaine").select("domaine, total_objectifs"),
      supabase
        .from("v_progression_par_domaine")
        .select("domaine, statut_code, nb")
        .eq("parcours_id", parcoursPrincipal.id),
    ]);

    donneesGraphique = (totauxDomaine ?? []).map((t) => {
      const domaine = t.domaine as string;
      const parStatut: Record<string, number> = {};
      for (const r of repartitionDomaine ?? []) {
        if (r.domaine === domaine) parStatut[r.statut_code as string] = r.nb as number;
      }
      return { domaine, totalObjectifs: t.total_objectifs as number, parStatut };
    });
  }

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

      <Link
        href="/journal/nouvelle"
        className="mb-8 flex items-center justify-center rounded-doux bg-mousse-fonce px-6 py-4 text-lg font-medium text-white shadow-doux transition-colors hover:bg-mousse"
      >
        + Ajouter une activité
      </Link>

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

      {parcoursPrincipal && donneesGraphique.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-sm font-medium text-encre">
            Où en est {parcoursPrincipal.enfant} ({parcoursPrincipal.annee})
          </p>
          <GraphiqueProgression donnees={donneesGraphique} />
          <Link
            href={`/progression?parcours=${parcoursPrincipal.id}`}
            className="text-xs font-medium text-mousse-fonce underline underline-offset-2"
          >
            Voir le détail par compétence →
          </Link>
        </div>
      )}

      <Link
        href="/export/nouveau"
        className="mb-8 block rounded-doux border border-mousse/40 bg-mousse/5 p-5 shadow-doux hover:border-mousse"
      >
        <p className="font-display text-lg italic text-encre">
          ✨ Préparer un contrôle
        </p>
        <p className="text-sm text-ardoise">
          Génère un dossier pédagogique complet, prêt à ajuster puis à
          finaliser en PDF.
        </p>
      </Link>

      <div>
        <p className="mb-3 text-sm font-medium text-encre">Activité récente</p>
        {recentes.length === 0 ? (
          <p className="text-sm text-ardoise">
            Aucune activité enregistrée pour l&rsquo;instant.
          </p>
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
  );
}
