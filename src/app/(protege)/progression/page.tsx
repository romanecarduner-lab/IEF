import { creerClientServeur } from "@/lib/supabase/server";
import { SelecteurParcours } from "./SelecteurParcours";
import { SelecteurStatutProgression } from "./SelecteurStatutProgression";
import { GraphiqueProgression, type DonneesDomaine } from "./GraphiqueProgression";

const STATUT_PAR_DEFAUT = "non_encore_observe";

export default async function PageProgression({
  searchParams,
}: {
  searchParams: { parcours?: string };
}) {
  const supabase = creerClientServeur();

  const { data: parcoursBruts } = await supabase
    .from("parcours_scolaires")
    .select("id, enfants(prenom), annees_scolaires(libelle)")
    .order("created_at", { ascending: false });

  const parcoursOptions = (parcoursBruts ?? []).map((p) => {
    const enfant = Array.isArray(p.enfants) ? p.enfants[0] : p.enfants;
    const annee = Array.isArray(p.annees_scolaires)
      ? p.annees_scolaires[0]
      : p.annees_scolaires;
    return {
      id: p.id as string,
      libelle: `${enfant?.prenom ?? "?"} — ${annee?.libelle ?? "?"}`,
    };
  });

  const parcoursId = searchParams.parcours || parcoursOptions[0]?.id;

  if (!parcoursId) {
    return (
      <div>
        <h1 className="mb-6 font-display text-2xl italic text-encre">
          Progression
        </h1>
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Il faut d&rsquo;abord créer un parcours scolaire (enfant + année).
        </p>
      </div>
    );
  }

  const [
    { data: indicateurs },
    { data: statuts },
    { data: synthesesBrutes },
    { data: totauxDomaine },
    { data: repartitionDomaine },
  ] = await Promise.all([
    supabase
      .from("v_indicateurs_observation")
      .select("element_programme_id, nb_observations, nb_dates_distinctes, nb_contextes_distincts")
      .eq("parcours_id", parcoursId),
    supabase
      .from("statuts_progression")
      .select("code, libelle")
      .eq("actif", true)
      .order("ordre"),
    supabase
      .from("syntheses_progression")
      .select("element_programme_id, statuts_progression(code)")
      .eq("parcours_id", parcoursId),
    supabase.from("v_total_objectifs_par_domaine").select("domaine, total_objectifs"),
    supabase
      .from("v_progression_par_domaine")
      .select("domaine, statut_code, nb")
      .eq("parcours_id", parcoursId),
  ]);

  const donneesGraphique: DonneesDomaine[] = (totauxDomaine ?? []).map((t) => {
    const domaine = t.domaine as string;
    const parStatut: Record<string, number> = {};
    for (const r of repartitionDomaine ?? []) {
      if (r.domaine === domaine) {
        parStatut[r.statut_code as string] = r.nb as number;
      }
    }
    return {
      domaine,
      totalObjectifs: t.total_objectifs as number,
      parStatut,
    };
  });

  const statutsParElement = new Map<string, string>();
  for (const s of synthesesBrutes ?? []) {
    const statut = Array.isArray(s.statuts_progression)
      ? s.statuts_progression[0]
      : s.statuts_progression;
    if (statut?.code) {
      statutsParElement.set(s.element_programme_id as string, statut.code);
    }
  }

  const lignes = await Promise.all(
    (indicateurs ?? []).map(async (indic) => {
      const elementId = indic.element_programme_id as string;
      const [{ data: element }, { data: chemin }] = await Promise.all([
        supabase
          .from("elements_programme")
          .select("libelle, parent_id")
          .eq("id", elementId)
          .maybeSingle(),
        supabase.rpc("chemin_element_programme", { p_element_id: elementId }),
      ]);

      const nbObs = indic.nb_observations as number;
      const nbDates = indic.nb_dates_distinctes as number;
      const nbContextes = indic.nb_contextes_distincts as number;
      const aRevoir = nbObs >= 3 && nbDates >= 2 && nbContextes >= 2;

      return {
        elementId,
        libelle: element?.libelle as string | undefined,
        chemin: chemin as string | null,
        nbObs,
        nbDates,
        nbContextes,
        aRevoir,
        statutCode: statutsParElement.get(elementId) ?? STATUT_PAR_DEFAUT,
      };
    })
  );

  lignes.sort((a, b) => (a.chemin ?? "").localeCompare(b.chemin ?? ""));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl italic text-encre">Progression</h1>
        {parcoursOptions.length > 0 && (
          <SelecteurParcours parcoursId={parcoursId} options={parcoursOptions} />
        )}
      </div>

      {donneesGraphique.length > 0 && (
        <GraphiqueProgression donnees={donneesGraphique} />
      )}

      {lignes.length === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Aucune compétence observée pour l&rsquo;instant sur ce parcours.
          Reliez des activités à des compétences depuis le journal pour les
          voir apparaître ici.
        </p>
      ) : (
        <ul className="space-y-3">
          {lignes.map((l) => (
            <li
              key={l.elementId}
              className="rounded-doux border border-trait bg-white/80 p-4 shadow-doux"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-encre">{l.libelle}</p>
                  {l.chemin && (
                    <p className="text-xs text-ardoise">{l.chemin}</p>
                  )}
                  <p className="mt-1 text-xs text-ardoise">
                    {l.nbObs} observation{l.nbObs > 1 ? "s" : ""} ·{" "}
                    {l.nbDates} date{l.nbDates > 1 ? "s" : ""} distincte
                    {l.nbDates > 1 ? "s" : ""} · {l.nbContextes} contexte
                    {l.nbContextes > 1 ? "s" : ""}
                    {l.aRevoir && (
                      <span className="ml-2 rounded-full bg-argile/20 px-2 py-0.5 text-argile">
                        à réexaminer
                      </span>
                    )}
                  </p>
                </div>
                <SelecteurStatutProgression
                  parcoursId={parcoursId}
                  elementProgrammeId={l.elementId}
                  statutActuelCode={l.statutCode}
                  statuts={statuts ?? []}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
