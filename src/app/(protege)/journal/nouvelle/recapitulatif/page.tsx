import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";

export default async function PageRecapitulatifActivite({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const ids = (searchParams.ids ?? "").split(",").filter(Boolean);
  if (ids.length === 0) notFound();

  const supabase = creerClientServeur();
  const { data: activitesBrutes } = await supabase
    .from("activites")
    .select("id, titre, parcours_scolaires(enfants(prenom))")
    .in("id", ids);

  if (!activitesBrutes || activitesBrutes.length === 0) notFound();

  // Meme ordre que la creation (enfant principal en premier).
  const activites = ids
    .map((id) => activitesBrutes.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .map((a) => {
      const parcours = Array.isArray(a.parcours_scolaires)
        ? a.parcours_scolaires[0]
        : a.parcours_scolaires;
      const enfant = parcours
        ? Array.isArray(parcours.enfants)
          ? parcours.enfants[0]
          : parcours.enfants
        : null;
      return {
        id: a.id as string,
        titre: a.titre as string,
        prenomEnfant: (enfant?.prenom as string | undefined) ?? "?",
      };
    });

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 font-display text-2xl italic text-encre">
        Activité enregistrée
      </h1>
      <p className="mb-6 text-sm text-ardoise">
        Une fiche a été créée pour chaque enfant coché. Il ne reste
        plus qu&rsquo;à choisir les compétences et, si besoin, ajouter
        une observation propre à chacun.
      </p>

      <ul className="mb-6 space-y-3">
        {activites.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-doux border border-trait bg-white/80 p-4 shadow-doux"
          >
            <div>
              <p className="text-sm font-medium text-encre">{a.prenomEnfant}</p>
              <p className="text-xs text-ardoise">{a.titre}</p>
            </div>
            <Link
              href={`/journal/${a.id}/competences`}
              className="shrink-0 rounded-doux bg-mousse-fonce px-3.5 py-2 text-xs font-medium text-white hover:bg-mousse"
            >
              Compléter
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/journal"
        className="text-sm font-medium text-mousse-fonce underline underline-offset-2 hover:text-mousse"
      >
        Terminer plus tard, retour au journal →
      </Link>
    </div>
  );
}
