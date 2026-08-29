import { creerClientServeur } from "@/lib/supabase/server";

export async function VueHistorique({ parcoursId }: { parcoursId: string }) {
  const supabase = creerClientServeur();

  // On evite volontairement les jointures imbriquees (statuts_progression(...),
  // elements_programme(...)) : on a deja ete pris en defaut par le cache de
  // relations de PostgREST sur ce type de requete. Trois requetes simples,
  // jointes a la main en JS, sont plus lentes mais beaucoup plus fiables.
  const { data: syntheses } = await supabase
    .from("syntheses_progression")
    .select("id, element_programme_id")
    .eq("parcours_id", parcoursId);

  const syntheseIds = (syntheses ?? []).map((s) => s.id as string);
  const libelleParElement = new Map<string, string>();

  if (syntheses && syntheses.length > 0) {
    const elementIds = Array.from(new Set(syntheses.map((s) => s.element_programme_id as string)));
    const { data: elements } = await supabase
      .from("elements_programme")
      .select("id, libelle")
      .in("id", elementIds);
    for (const e of elements ?? []) {
      libelleParElement.set(e.id as string, e.libelle as string);
    }
  }

  const elementParSynthese = new Map<string, string>();
  for (const s of syntheses ?? []) {
    elementParSynthese.set(s.id as string, s.element_programme_id as string);
  }

  const { data: historique } =
    syntheseIds.length > 0
      ? await supabase
          .from("historique_progression")
          .select(
            "id, synthese_id, ancien_statut, nouveau_statut, change_par_nom_affiche, commentaire, origine, created_at"
          )
          .in("synthese_id", syntheseIds)
          .order("created_at", { ascending: false })
          .limit(100)
      : { data: [] };

  const lignes = (historique ?? []).map((h) => {
    const elementId = elementParSynthese.get(h.synthese_id as string);
    return {
      id: h.id as string,
      competence: (elementId && libelleParElement.get(elementId)) || "Compétence supprimée",
      ancienStatut: h.ancien_statut as string | null,
      nouveauStatut: h.nouveau_statut as string,
      auteur: h.change_par_nom_affiche as string,
      commentaire: h.commentaire as string | null,
      origine: (h.origine as string) ?? "manuel",
      date: h.created_at as string,
    };
  });

  if (lignes.length === 0) {
    return (
      <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
        Aucun changement de statut enregistré pour l&rsquo;instant sur ce
        parcours.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {lignes.map((l) => (
        <li
          key={l.id}
          className="rounded-doux border border-trait bg-white/80 p-3 shadow-doux"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-encre">{l.competence}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                l.origine === "automatique"
                  ? "bg-ocre/20 text-encre"
                  : "bg-mousse/10 text-mousse-fonce"
              }`}
            >
              {l.origine === "automatique" ? "Automatique" : "Manuel"}
            </span>
          </div>
          <p className="text-xs text-ardoise">
            {l.ancienStatut ? `${l.ancienStatut} → ${l.nouveauStatut}` : l.nouveauStatut}
          </p>
          <p className="text-xs text-ardoise">
            {new Date(l.date).toLocaleString("fr-FR")} · {l.auteur}
          </p>
          {l.commentaire && (
            <p className="mt-1 text-xs text-encre">{l.commentaire}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
