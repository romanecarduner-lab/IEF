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

  const [{ data: activite }, { data: contextes }, { data: autonomies }] = await Promise.all([
    supabase
      .from("activites")
      .select(
        "id, date_activite, titre, description, contexte_id, lieu, observations, paroles_enfant, personnes_presentes, autonomie_generale_id"
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("contextes_activite")
      .select("id, libelle")
      .eq("actif", true)
      .order("ordre"),
    supabase
      .from("niveaux_autonomie")
      .select("id, libelle")
      .eq("actif", true)
      .order("ordre"),
  ]);

  if (!activite) notFound();

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
          autonomieGeneraleId: (activite.autonomie_generale_id as string | null) ?? "",
        }}
        contextes={contextes ?? []}
        autonomies={autonomies ?? []}
      />
    </div>
  );
}
