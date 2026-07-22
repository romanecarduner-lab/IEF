import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireDossier } from "./FormulaireDossier";

export default async function PageNouveauDossier() {
  const supabase = creerClientServeur();

  const { data: parcoursBruts } = await supabase
    .from("parcours_scolaires")
    .select("id, enfants(prenom), annees_scolaires(libelle)")
    .order("created_at", { ascending: false });

  const parcours = (parcoursBruts ?? []).map((p) => {
    const enfant = Array.isArray(p.enfants) ? p.enfants[0] : p.enfants;
    const annee = Array.isArray(p.annees_scolaires)
      ? p.annees_scolaires[0]
      : p.annees_scolaires;
    return {
      id: p.id as string,
      libelle: `${enfant?.prenom ?? "?"} — ${annee?.libelle ?? "?"}`,
    };
  });

  return (
    <div className="max-w-lg">
      <Link href="/export" className="mb-6 inline-block text-sm text-ardoise hover:text-encre">
        ← Retour
      </Link>
      <h1 className="mb-6 font-display text-2xl italic text-encre">
        Nouveau dossier d&rsquo;export
      </h1>

      {parcours.length === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Il faut d&rsquo;abord créer un parcours scolaire (enfant + année).
        </p>
      ) : (
        <FormulaireDossier parcours={parcours} />
      )}
    </div>
  );
}
