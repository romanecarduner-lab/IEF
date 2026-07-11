import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { supprimerEnfant } from "./actions";

export default async function PageEnfants() {
  const supabase = creerClientServeur();
  const { data: enfants } = await supabase
    .from("enfants")
    .select("id, prenom, date_naissance, remarques")
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl italic text-encre">Enfants</h1>
        <Link
          href="/enfants/nouveau"
          className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse"
        >
          Ajouter un enfant
        </Link>
      </div>

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
                <p className="font-display text-lg italic text-encre">
                  {enfant.prenom}
                </p>
                {enfant.date_naissance && (
                  <p className="text-sm text-ardoise">
                    Né(e) le{" "}
                    {new Date(enfant.date_naissance).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                )}
                {enfant.remarques && (
                  <p className="mt-1 text-sm text-ardoise">
                    {enfant.remarques}
                  </p>
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
  );
}
