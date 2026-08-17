import { creerClientServeur } from "@/lib/supabase/server";

export async function VueATravailler({
  parcoursId,
  cycleId,
}: {
  parcoursId: string;
  cycleId: string;
}) {
  const supabase = creerClientServeur();

  const [{ data: tousLesObjectifs }, { data: observations }] = await Promise.all([
    supabase
      .from("v_objectif_domaine")
      .select("objectif_id, libelle, domaine")
      .eq("cycle_id", cycleId)
      .order("domaine"),
    supabase
      .from("observations_elements_programme")
      .select("element_programme_id, activites!inner(parcours_id)")
      .eq("activites.parcours_id", parcoursId),
  ]);

  const idsAbordes = new Set(
    (observations ?? []).map((o) => o.element_programme_id as string)
  );

  const nonAbordesParDomaine = new Map<string, { id: string; libelle: string }[]>();
  for (const o of tousLesObjectifs ?? []) {
    const id = o.objectif_id as string;
    if (idsAbordes.has(id)) continue;
    const domaine = o.domaine as string;
    const liste = nonAbordesParDomaine.get(domaine) ?? [];
    liste.push({ id, libelle: o.libelle as string });
    nonAbordesParDomaine.set(domaine, liste);
  }

  const totalObjectifs = (tousLesObjectifs ?? []).length;
  const totalNonAborde = Array.from(nonAbordesParDomaine.values()).reduce(
    (acc, l) => acc + l.length,
    0
  );

  return (
    <div>
      <p className="mb-6 text-sm text-ardoise">
        {totalNonAborde} objectif{totalNonAborde > 1 ? "s" : ""} du programme
        officiel jamais encore relié{totalNonAborde > 1 ? "s" : ""} à une
        activité, sur {totalObjectifs} au total. Un objectif qui n&rsquo;est
        pas encore abordé n&rsquo;est pas forcément un souci — beaucoup ne
        concernent peut-être pas encore l&rsquo;âge de l&rsquo;enfant — mais
        ça peut aider à repérer un domaine resté de côté.
      </p>

      {nonAbordesParDomaine.size === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Tous les objectifs du programme ont déjà été abordés au moins une
          fois pour ce parcours.
        </p>
      ) : (
        <div className="space-y-3">
          {Array.from(nonAbordesParDomaine.entries()).map(([domaine, objectifs]) => (
            <details
              key={domaine}
              className="rounded-doux border border-trait bg-white/80 shadow-doux"
            >
              <summary className="cursor-pointer list-none p-4 text-sm font-medium text-encre">
                <span className="flex items-center justify-between">
                  <span>{domaine}</span>
                  <span className="rounded-full bg-trait px-2.5 py-0.5 text-xs text-ardoise">
                    {objectifs.length} non abordé{objectifs.length > 1 ? "s" : ""}
                  </span>
                </span>
              </summary>
              <ul className="space-y-1.5 border-t border-trait p-4 pt-3">
                {objectifs.map((o) => (
                  <li key={o.id} className="text-sm text-encre">
                    {o.libelle}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
