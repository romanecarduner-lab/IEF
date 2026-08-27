import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireModifierActivite } from "./FormulaireModifierActivite";

export default async function PageModifierActivite({
  params,
}: {
  params: { id: string };
}) {
  const supabase = creerClientServeur();

  const [{ data: activite }, { data: contextes }, { data: competencesBrutes }] = await Promise.all([
    supabase
      .from("activites")
      .select(
        "id, date_activite, titre, description, contexte_id, lieu, observations, paroles_enfant, personnes_presentes"
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
      .select("elements_programme(libelle)")
      .eq("activite_id", params.id),
  ]);

  if (!activite) notFound();

  const competencesReliees = (competencesBrutes ?? [])
    .map((o) => {
      const element = Array.isArray(o.elements_programme)
        ? o.elements_programme[0]
        : o.elements_programme;
      return element?.libelle as string | undefined;
    })
    .filter((libelle): libelle is string => Boolean(libelle));

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
        competencesReliees={competencesReliees}
      />
    </div>
  );
}
