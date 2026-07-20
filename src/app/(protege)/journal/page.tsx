import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { supprimerActivite, basculerFavori, basculerStatutActivite } from "./actions";

export default async function PageJournal() {
  const supabase = creerClientServeur();

  const { data: activitesBrutes } = await supabase
    .from("activites")
    .select(
      `id, date_activite, titre, description, favori,
       contextes_activite(libelle), statuts_activite(code, libelle),
       parcours_scolaires(enfants(prenom), annees_scolaires(libelle))`
    )
    .order("date_activite", { ascending: false });

  const activites = (activitesBrutes ?? []).map((a) => {
    const contexte = Array.isArray(a.contextes_activite)
      ? a.contextes_activite[0]
      : a.contextes_activite;
    const statut = Array.isArray(a.statuts_activite)
      ? a.statuts_activite[0]
      : a.statuts_activite;
    const parcoursBrut = Array.isArray(a.parcours_scolaires)
      ? a.parcours_scolaires[0]
      : a.parcours_scolaires;
    const enfant = parcoursBrut
      ? Array.isArray(parcoursBrut.enfants)
        ? parcoursBrut.enfants[0]
        : parcoursBrut.enfants
      : null;
    const annee = parcoursBrut
      ? Array.isArray(parcoursBrut.annees_scolaires)
        ? parcoursBrut.annees_scolaires[0]
        : parcoursBrut.annees_scolaires
      : null;

    return {
      id: a.id as string,
      date: a.date_activite as string,
      titre: a.titre as string,
      description: a.description as string | null,
      favori: a.favori as boolean,
      contexte: contexte?.libelle as string | undefined,
      statutCode: statut?.code as string | undefined,
      statutLibelle: statut?.libelle as string | undefined,
      enfant: enfant?.prenom as string | undefined,
      annee: annee?.libelle as string | undefined,
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl italic text-encre">
          Journal pédagogique
        </h1>
        <Link
          href="/journal/nouvelle"
          className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse"
        >
          Ajouter une activité
        </Link>
      </div>

      {activites.length === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Aucune activité enregistrée pour l&rsquo;instant.
        </p>
      ) : (
        <ul className="space-y-3">
          {activites.map((a) => (
            <li
              key={a.id}
              className="rounded-doux border border-trait bg-white/80 p-5 shadow-doux"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/journal/${a.id}`}
                    className="font-display text-lg italic text-encre hover:text-mousse-fonce"
                  >
                    {a.titre}
                  </Link>
                  <p className="text-sm text-ardoise">
                    {a.enfant} · {a.annee} ·{" "}
                    {new Date(a.date).toLocaleDateString("fr-FR")}
                    {a.contexte ? ` · ${a.contexte}` : ""}
                  </p>
                  {a.description && (
                    <p className="mt-2 text-sm text-encre">{a.description}</p>
                  )}
                  <form action={basculerStatutActivite.bind(null, a.id, a.statutCode ?? "brouillon")}>
                    <button
                      type="submit"
                      title={
                        a.statutCode === "valide"
                          ? "Remettre en brouillon"
                          : "Valider cette activité"
                      }
                      className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                        a.statutCode === "valide"
                          ? "bg-mousse/10 text-mousse-fonce hover:bg-mousse/20"
                          : "bg-trait text-ardoise hover:bg-argile/20"
                      }`}
                    >
                      {a.statutLibelle}
                      {a.statutCode !== "valide" && " · cliquer pour valider"}
                    </button>
                  </form>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <form action={basculerFavori.bind(null, a.id, a.favori)}>
                    <button
                      type="submit"
                      title={
                        a.favori
                          ? "Retirer des favoris"
                          : "Marquer comme favori"
                      }
                      className={`text-lg ${
                        a.favori ? "text-argile" : "text-trait hover:text-argile"
                      }`}
                    >
                      ★
                    </button>
                  </form>
                  <form action={supprimerActivite.bind(null, a.id)}>
                    <button
                      type="submit"
                      className="text-sm text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
