import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { terminerOnboarding } from "./actions";

export const dynamic = "force-dynamic";

const ETAPES = [
  {
    titre: "Journal",
    description:
      "Notez chaque activité de votre enfant — un titre, une description, des photos si vous le souhaitez.",
  },
  {
    titre: "Progression",
    description:
      "L'application relie vos activités aux compétences du programme officiel, pour voir ce qui a déjà été abordé.",
  },
  {
    titre: "Export",
    description:
      "Préparez un dossier pédagogique ou un simple journal d'une période, prêt à présenter.",
  },
];

export default async function PageBienvenue() {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: appartenance } = await supabase
    .from("utilisateurs_familles")
    .select("familles(onboarding_termine)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const famille = Array.isArray(appartenance?.familles)
    ? appartenance.familles[0]
    : appartenance?.familles;

  // Deja vu (retour manuel sur cette page) : on ne la remontre pas.
  if (famille?.onboarding_termine) {
    redirect("/tableau-de-bord");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brume px-4 py-10">
      <div className="w-full max-w-lg rounded-doux border border-trait bg-white/90 p-6 shadow-doux sm:p-8">
        <p className="mb-1 text-sm text-ardoise">🌿 Chemins d&rsquo;apprentissage</p>
        <h1 className="mb-4 font-display text-2xl italic text-encre sm:text-3xl">
          Bienvenue !
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-ardoise">
          Cette application vous accompagne au quotidien dans le suivi
          pédagogique de votre enfant en instruction en famille — de la
          simple note d&rsquo;activité jusqu&rsquo;au dossier à présenter
          pour un contrôle. Vous restez à chaque étape seule ou seul
          décisionnaire : rien n&rsquo;est automatique ni définitif sans
          votre validation.
        </p>

        <div className="mb-6 space-y-4">
          {ETAPES.map((etape, i) => (
            <div key={etape.titre} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lin text-sm font-medium text-mousse-fonce">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-encre">{etape.titre}</p>
                <p className="text-sm text-ardoise">{etape.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mb-6 rounded-doux bg-lin px-3.5 py-3 text-xs leading-relaxed text-encre">
          À tout moment, un bouton <span className="font-medium">?</span> en
          haut de chaque page vous rappelle à quoi elle sert.
        </p>

        <form action={terminerOnboarding}>
          <button
            type="submit"
            className="w-full rounded-doux bg-mousse-fonce px-4 py-3 text-sm font-medium text-white hover:bg-mousse"
          >
            Commencer
          </button>
        </form>
      </div>
    </div>
  );
}
