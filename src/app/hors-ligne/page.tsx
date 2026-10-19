import Link from "next/link";

// Page de secours affichee quand une page n'est pas disponible sans reseau.
// Elle est gardee par le service worker des l'installation (public/sw.js).
export default function PageHorsLigne() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="carte p-6 text-center">
        <p className="text-4xl" aria-hidden="true">
          📡
        </p>
        <h1 className="mt-3 font-display text-2xl italic text-encre">Pas de réseau pour le moment</h1>
        <p className="mt-3 text-sm text-ardoise">
          Cette page a besoin d&rsquo;une connexion. Vous pouvez quand même saisir une activité : elle sera
          gardée sur ce téléphone et envoyée dès que le réseau sera de retour.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/journal/nouvelle" prefetch={false} className="bouton-primaire">
            Ajouter une activité
          </Link>
          {/* Lien classique : la copie du journal gardée sur ce téléphone s'ouvre si elle existe. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/journal" className="bouton-secondaire">
            Lire mon journal
          </a>
          {/* Lien classique (rechargement complet) : seul moyen fiable de retenter la page. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/tableau-de-bord" className="bouton-secondaire">
            Réessayer
          </a>
        </div>
      </div>
    </main>
  );
}
