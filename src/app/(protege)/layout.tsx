import Link from "next/link";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { BoutonDeconnexion } from "@/components/BoutonDeconnexion";

const LIENS_NAVIGATION = [
  { href: "/tableau-de-bord", libelle: "Tableau de bord" },
  { href: "/enfants", libelle: "Enfants" },
  { href: "/annees-scolaires", libelle: "Années scolaires" },
  { href: "/parcours", libelle: "Parcours" },
  { href: "/journal", libelle: "Journal" },
  { href: "/progression", libelle: "Progression" },
];

// Ces pages dépendent systématiquement de la session de l'utilisateur
// (cookies) : elles ne doivent jamais être pré-rendues statiquement au
// build. Sans cette ligne, Next.js tente de les générer comme pages
// statiques tant qu'il n'a pas explicitement détecté un appel à cookies()
// pendant le rendu — ce qui échoue bruyamment si la validation des
// variables d'environnement lève une erreur avant même d'atteindre cet
// appel (voir le correctif d'authentification précédent).
export const dynamic = "force-dynamic";

/**
 * Garantit, avant d'afficher toute page protégée, que l'utilisateur
 * appartient à un espace familial. Si ce n'est pas encore le cas
 * (première visite après confirmation du mail), l'espace est créé de
 * façon transactionnelle via la fonction Postgres rpc_creer_espace_familial
 * (voir supabase/migrations/0003_fonction_creation_famille.sql).
 *
 * Défense en profondeur : le middleware protège déjà ces routes, mais ce
 * contrôle est répété ici pour ne jamais dépendre uniquement du middleware.
 */
export default async function LayoutProtege({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: appartenances } = await supabase
    .from("utilisateurs_familles")
    .select("famille_id, familles(nom)")
    .eq("user_id", user.id)
    .limit(1);

  let nomFamille: string;

  if (!appartenances || appartenances.length === 0) {
    const nomDemande =
      (user.user_metadata?.nom_famille as string | undefined) || "Ma famille";

    const { error } = await supabase.rpc("rpc_creer_espace_familial", {
      p_nom_famille: nomDemande,
    });

    if (error) {
      // La création de l'espace familial est une étape critique : on ne
      // rend jamais une page protégée si elle échoue.
      throw new Error(
        "Impossible de créer votre espace familial. Merci de réessayer."
      );
    }
    nomFamille = nomDemande;
  } else {
    const famille = appartenances[0]?.familles as unknown as
      | { nom: string }
      | { nom: string }[]
      | null;
    nomFamille = Array.isArray(famille)
      ? famille[0]?.nom ?? "Votre espace"
      : famille?.nom ?? "Votre espace";
  }

  return (
    <div className="min-h-screen bg-brume">
      <header className="border-b border-trait bg-white/60">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <p className="font-display text-lg italic text-encre">
            {nomFamille}
          </p>
          <nav className="flex flex-wrap items-center gap-5">
            {LIENS_NAVIGATION.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="text-sm font-medium text-ardoise hover:text-mousse-fonce"
              >
                {lien.libelle}
              </Link>
            ))}
            <BoutonDeconnexion />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
    </div>
  );
}
