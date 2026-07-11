import { creerClientServeur } from "@/lib/supabase/server";
import { supprimerParcours } from "./actions";
import { FormulaireNouveauParcours } from "./FormulaireNouveauParcours";

export default async function PageParcours() {
  const supabase = creerClientServeur();

  const [{ data: parcours }, { data: enfants }, { data: annees }, { data: cycles }] =
    await Promise.all([
      supabase
        .from("parcours_scolaires")
        .select(
          "id, niveau_indicatif, remarques, enfants(prenom), annees_scolaires(libelle), cycles(libelle)"
        )
        .order("created_at", { ascending: true }),
      supabase.from("enfants").select("id, prenom").order("prenom"),
      supabase
        .from("annees_scolaires")
        .select("id, libelle")
        .order("date_debut", { ascending: false }),
      supabase.from("cycles").select("id, libelle").order("ordre"),
    ]);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_360px]">
      <div>
        <h1 className="mb-6 font-display text-2xl italic text-encre">
          Parcours scolaires
        </h1>

        {!parcours || parcours.length === 0 ? (
          <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
            Aucun parcours enregistré pour l&rsquo;instant.
          </p>
        ) : (
          <ul className="space-y-3">
            {parcours.map((p) => {
              const enfant = Array.isArray(p.enfants) ? p.enfants[0] : p.enfants;
              const annee = Array.isArray(p.annees_scolaires)
                ? p.annees_scolaires[0]
                : p.annees_scolaires;
              const cycle = Array.isArray(p.cycles) ? p.cycles[0] : p.cycles;

              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-doux border border-trait bg-white/80 p-5 shadow-doux"
                >
                  <div>
                    <p className="font-display text-lg italic text-encre">
                      {enfant?.prenom} — {annee?.libelle}
                    </p>
                    <p className="text-sm text-ardoise">
                      {cycle?.libelle}
                      {p.niveau_indicatif ? ` · ${p.niveau_indicatif}` : ""}
                    </p>
                    {p.remarques && (
                      <p className="mt-1 text-sm text-ardoise">
                        {p.remarques}
                      </p>
                    )}
                  </div>
                  <form action={supprimerParcours.bind(null, p.id)}>
                    <button
                      type="submit"
                      className="text-sm text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
                    >
                      Supprimer
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <FormulaireNouveauParcours
        enfants={enfants ?? []}
        annees={annees ?? []}
        cycles={cycles ?? []}
      />
    </div>
  );
}
