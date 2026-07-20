import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { SelecteurCompetences } from "./SelecteurCompetences";
import { supprimerObservation } from "./actions";

const TYPES_ARBRE = ["domaine", "sous_domaine", "competence", "repere_annuel"];

export default async function PageCompetencesActivite({
  params,
}: {
  params: { id: string };
}) {
  const supabase = creerClientServeur();

  const { data: activite } = await supabase
    .from("activites")
    .select("id, titre")
    .eq("id", params.id)
    .maybeSingle();

  if (!activite) notFound();

  const [{ data: arbreBrut }, { data: niveaux }, { data: observationsBrutes }] =
    await Promise.all([
      supabase
        .from("elements_programme")
        .select("id, parent_id, libelle, types_element_programme!inner(code)")
        .in("types_element_programme.code", TYPES_ARBRE)
        .order("ordre"),
      supabase
        .from("niveaux_autonomie")
        .select("id, libelle")
        .eq("actif", true)
        .order("ordre"),
      supabase
        .from("observations_elements_programme")
        .select(
          "id, justification, commentaire_pedagogique, elements_programme(libelle), niveaux_autonomie(libelle)"
        )
        .eq("activite_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

  const arbre = (arbreBrut ?? []).map((n) => {
    const type = Array.isArray(n.types_element_programme)
      ? n.types_element_programme[0]
      : n.types_element_programme;
    return {
      id: n.id as string,
      parentId: n.parent_id as string | null,
      type: type?.code as string,
      libelle: n.libelle as string,
    };
  });

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

  // Ensemble des elements deja observes pour cette activite (pour griser/annoter
  // les objectifs correspondants dans le selecteur).
  const { data: idsObserves } = await supabase
    .from("observations_elements_programme")
    .select("element_programme_id")
    .eq("activite_id", params.id);
  const setIdsObserves = new Set((idsObserves ?? []).map((o) => o.element_programme_id as string));

  return (
    <div>
      <Link
        href={`/journal/${params.id}`}
        className="mb-6 inline-block text-sm text-ardoise hover:text-encre"
      >
        ← Retour à l&rsquo;activité
      </Link>

      <h1 className="mb-1 font-display text-2xl italic text-encre">
        Compétences observées
      </h1>
      <p className="mb-6 text-sm text-ardoise">{activite.titre}</p>

      <div className="grid gap-8 md:grid-cols-[1fr_360px]">
        <SelecteurCompetences
          activiteId={params.id}
          arbre={arbre}
          niveaux={niveaux ?? []}
          elementsDejaObserves={setIdsObserves}
        />

        <div>
          <p className="mb-4 text-sm font-medium text-encre">
            Déjà enregistrées ({observations.length})
          </p>
          {observations.length === 0 ? (
            <p className="text-sm text-ardoise">Aucune pour l&rsquo;instant.</p>
          ) : (
            <ul className="space-y-3">
              {observations.map((o) => (
                <li
                  key={o.id}
                  className="rounded-doux border border-trait bg-white/80 p-3 text-sm shadow-doux"
                >
                  <p className="text-encre">{o.elementLibelle}</p>
                  <p className="text-xs text-ardoise">{o.niveauLibelle}</p>
                  <form action={supprimerObservation.bind(null, o.id, params.id)}>
                    <button
                      type="submit"
                      className="mt-1 text-xs text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
                    >
                      Supprimer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
