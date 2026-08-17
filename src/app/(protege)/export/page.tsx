import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { supprimerDossier } from "./actions";

export default async function PageExport() {
  const supabase = creerClientServeur();

  const { data: dossiersBruts } = await supabase
    .from("dossiers_export")
    .select(
      "id, titre, statut, created_at, parcours_scolaires(enfants(prenom), annees_scolaires(libelle))"
    )
    .order("created_at", { ascending: false });

  const dossiers = (dossiersBruts ?? []).map((d) => {
    const parcours = Array.isArray(d.parcours_scolaires)
      ? d.parcours_scolaires[0]
      : d.parcours_scolaires;
    const enfant = parcours
      ? Array.isArray(parcours.enfants)
        ? parcours.enfants[0]
        : parcours.enfants
      : null;
    const annee = parcours
      ? Array.isArray(parcours.annees_scolaires)
        ? parcours.annees_scolaires[0]
        : parcours.annees_scolaires
      : null;
    return {
      id: d.id as string,
      titre: d.titre as string,
      statut: d.statut as string,
      enfant: enfant?.prenom as string | undefined,
      annee: annee?.libelle as string | undefined,
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl italic text-encre">
          Dossiers d&rsquo;export
        </h1>
        <Link
          href="/export/nouveau"
          className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse"
        >
          Nouveau dossier
        </Link>
      </div>

      {dossiers.length === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Aucun dossier créé pour l&rsquo;instant.
        </p>
      ) : (
        <ul className="space-y-3">
          {dossiers.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-doux border border-trait bg-white/80 p-5 shadow-doux"
            >
              <div>
                <Link
                  href={`/export/${d.id}`}
                  className="font-display text-lg italic text-encre hover:text-mousse-fonce"
                >
                  {d.titre}
                </Link>
                <p className="text-sm text-ardoise">
                  {d.enfant} · {d.annee}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs ${
                    d.statut === "finalise"
                      ? "bg-mousse/10 text-mousse-fonce"
                      : "bg-trait text-ardoise"
                  }`}
                >
                  {d.statut === "finalise" ? "Finalisé" : "Brouillon"}
                </span>
              </div>
              <form action={supprimerDossier.bind(null, d.id)}>
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
  );
}
