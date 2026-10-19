import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireModifierActivite } from "./FormulaireModifierActivite";

// Les redactions automatiques lancees depuis cette page (description, observation)
// peuvent depasser la duree par defaut d'une fonction serveur.
export const maxDuration = 60;

const TYPES_ARBRE = ["domaine", "sous_domaine", "competence", "repere_annuel"];

export default async function PageModifierActivite({
  params,
}: {
  params: { id: string };
}) {
  const supabase = creerClientServeur();

  const [
    { data: activite },
    { data: contextes },
    { data: competencesBrutes },
    { data: niveaux },
  ] = await Promise.all([
    supabase
      .from("activites")
      .select(
        "id, date_activite, titre, description, contexte_id, lieu, observations, paroles_enfant, personnes_presentes, parcours_scolaires(cycle_id)"
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("contextes_activite")
      .select("id, libelle")
      .eq("actif", true)
      .order("ordre"),
    supabase
      .from("observations_elements_programme")
      .select("id, element_programme_id, elements_programme(libelle), niveaux_autonomie(libelle)")
      .eq("activite_id", params.id)
      .order("created_at", { ascending: false }),
    supabase.from("niveaux_autonomie").select("id, libelle").eq("actif", true).order("ordre"),
  ]);

  if (!activite) notFound();

  const parcoursActivite = Array.isArray(activite.parcours_scolaires)
    ? activite.parcours_scolaires[0]
    : activite.parcours_scolaires;
  const cycleId = (parcoursActivite?.cycle_id as string | undefined) ?? null;

  const { data: arbreBrut } = await supabase
    .from("elements_programme")
    .select("id, parent_id, libelle, types_element_programme!inner(code)")
    .in("types_element_programme.code", TYPES_ARBRE)
    .eq("cycle_id", cycleId ?? "")
    .order("ordre");

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

  const observations = (competencesBrutes ?? []).map((o) => {
    const element = Array.isArray(o.elements_programme) ? o.elements_programme[0] : o.elements_programme;
    const niveau = Array.isArray(o.niveaux_autonomie) ? o.niveaux_autonomie[0] : o.niveaux_autonomie;
    return {
      id: o.id as string,
      elementId: o.element_programme_id as string,
      libelle: (element?.libelle as string | undefined) ?? "",
      niveau: (niveau?.libelle as string | undefined) ?? "",
    };
  });


  return (
    <div className="max-w-2xl">
      <Link
        href={`/journal/${params.id}`}
        className="mb-6 inline-block text-sm text-ardoise hover:text-encre"
      >
        ← Retour à l&rsquo;activité
      </Link>
      <h1 className="mb-6 font-display text-2xl italic text-encre">
        Modifier l&rsquo;activité
      </h1>

      <FormulaireModifierActivite
        activiteId={activite.id}
        valeursInitiales={{
          dateActivite: activite.date_activite as string,
          titre: activite.titre as string,
          description: (activite.description as string | null) ?? "",
          contexteId: activite.contexte_id as string,
          lieu: (activite.lieu as string | null) ?? "",
          observations: (activite.observations as string | null) ?? "",
          parolesEnfant: (activite.paroles_enfant as string | null) ?? "",
          personnesPresentes: (activite.personnes_presentes as string | null) ?? "",
        }}
        contextes={contextes ?? []}
        observations={observations}
        arbre={arbre}
        niveaux={niveaux ?? []}
        cycleId={cycleId}
      />
    </div>
  );
}
