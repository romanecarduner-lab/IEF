import { creerClientServeur } from "@/lib/supabase/server";
import { supprimerEnfant } from "../enfants/actions";
import { supprimerAnneeScolaire } from "../annees-scolaires/actions";
import { supprimerParcours } from "../parcours/actions";
import { FormulaireNouvelleAnnee } from "../annees-scolaires/FormulaireNouvelleAnnee";
import { FormulaireNouveauParcours } from "../parcours/FormulaireNouveauParcours";
import { FormulaireEnfant } from "./FormulaireEnfant";

export default async function PageFamille() {
  const supabase = creerClientServeur();

  const [
    { data: enfants },
    { data: annees },
    { data: parcoursBruts },
    { data: enfantsOptions },
    { data: anneesOptions },
    { data: cyclesOptions },
  ] = await Promise.all([
    supabase
      .from("enfants")
      .select("id, prenom, date_naissance, remarques")
      .order("created_at", { ascending: true }),
    supabase
      .from("annees_scolaires")
      .select("id, libelle, date_debut, date_fin")
      .order("date_debut", { ascending: true }),
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
    supabase
      .from("cycles")
      .select("id, libelle, referentiels_programmes!inner(statut)")
      .eq("referentiels_programmes.statut", "actif")
      .order("ordre"),
  ]);

  return (
    <div className="space-y-12">
      <h1 className="font-display text-2xl italic text-encre">Famille</h1>

      {/* --- Enfants --- */}
      <section className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 font-display text-xl italic text-encre">Enfants</h2>
          {!enfants || enfants.length === 0 ? (
            <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
              Aucun enfant enregistré pour l&rsquo;instant.
            </p>
          ) : (
            <ul className="space-y-3">
              {enfants.map((enfant) => (
                <li
                  key={enfant.id}
                  className="flex items-center justify-between rounded-doux border border-trait bg-white/80 p-5 shadow-doux"
                >
                  <div>
                    <p className="font-display text-lg italic text-encre">{enfant.prenom}</p>
                    {enfant.date_naissance && (
                      <p className="text-sm text-ardoise">
                        Né(e) le {new Date(enfant.date_naissance).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                    {enfant.remarques && (
                      <p className="mt-1 text-sm text-ardoise">{enfant.remarques}</p>
                    )}
                  </div>
                  <form action={supprimerEnfant.bind(null, enfant.id)}>
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
        <FormulaireEnfant />
      </section>

      {/* --- Années scolaires --- */}
      <section className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 font-display text-xl italic text-encre">Années scolaires</h2>
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
                    <p className="font-display text-lg italic text-encre">{annee.libelle}</p>
                    <p className="text-sm text-ardoise">
                      Du {new Date(annee.date_debut).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(annee.date_fin).toLocaleDateString("fr-FR")}
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
      </section>

      {/* --- Parcours scolaires --- */}
      <section className="grid gap-8 md:grid-cols-[1fr_360px]">
        <div>
          <h2 className="mb-4 font-display text-xl italic text-encre">Parcours scolaires</h2>
          {!parcoursBruts || parcoursBruts.length === 0 ? (
            <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
              Aucun parcours enregistré pour l&rsquo;instant.
            </p>
          ) : (
            <ul className="space-y-3">
              {parcoursBruts.map((p) => {
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
                        <p className="mt-1 text-sm text-ardoise">{p.remarques}</p>
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
          enfants={enfantsOptions ?? []}
          annees={anneesOptions ?? []}
          cycles={cyclesOptions ?? []}
        />
      </section>
    </div>
  );
}
