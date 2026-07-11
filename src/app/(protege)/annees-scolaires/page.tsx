import { creerClientServeur } from "@/lib/supabase/server";
import { supprimerAnneeScolaire } from "./actions";
import { FormulaireNouvelleAnnee } from "./FormulaireNouvelleAnnee";

export default async function PageAnneesScolaires() {
  const supabase = creerClientServeur();
  const { data: annees } = await supabase
    .from("annees_scolaires")
    .select("id, libelle, date_debut, date_fin")
    .order("date_debut", { ascending: true });

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="mb-6 font-display text-2xl italic text-encre">
          Années scolaires
        </h1>

        {!annees || annees.length === 0 ? (
          <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
            Aucune année scolaire enregistrée pour l&rsquo;instant.
          </p>
        ) : (
          <ul className="space-y-3">
            {annees.map((annee) => (
              <li
                key={annee.id}
                className="flex items-center justify-between rounded-doux border border-trait bg-white/80 p-5 shadow-doux"
              >
                <div>
                  <p className="font-display text-lg italic text-encre">
                    {annee.libelle}
                  </p>
                  <p className="text-sm text-ardoise">
                    Du{" "}
                    {new Date(annee.date_debut).toLocaleDateString("fr-FR")}{" "}
                    au {new Date(annee.date_fin).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <form action={supprimerAnneeScolaire.bind(null, annee.id)}>
                  <button
                    type="submit"
                    className="text-sm text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormulaireNouvelleAnnee />
    </div>
  );
}
