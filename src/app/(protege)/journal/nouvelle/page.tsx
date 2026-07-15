import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireActivite } from "./FormulaireActivite";

export default async function PageNouvelleActivite() {
  const supabase = creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: parcoursBruts }, { data: contextes }, { data: autonomies }, { data: appartenance }] =
    await Promise.all([
      supabase
        .from("parcours_scolaires")
        .select("id, enfants(prenom), annees_scolaires(libelle)")
        .order("created_at", { ascending: false }),
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
      supabase
        .from("utilisateurs_familles")
        .select("famille_id")
        .eq("user_id", user?.id ?? "")
        .limit(1)
        .maybeSingle(),
    ]);

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
    <div className="max-w-2xl">
      <Link
        href="/journal"
        className="mb-6 inline-block text-sm text-ardoise hover:text-encre"
      >
        ← Retour
      </Link>
      <h1 className="mb-6 font-display text-2xl italic text-encre">
        Ajouter une activité
      </h1>

      {parcours.length === 0 || !appartenance ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Il faut d&rsquo;abord créer un parcours scolaire (enfant + année)
          avant de pouvoir ajouter une activité.
        </p>
      ) : (
        <FormulaireActivite
          parcours={parcours}
          contextes={contextes ?? []}
          autonomies={autonomies ?? []}
          familleId={appartenance.famille_id}
        />
      )}
    </div>
  );
}
