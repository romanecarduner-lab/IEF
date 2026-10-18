import Link from "next/link";

// Page introuvable (lien ancien, adresse mal recopiee, activite supprimee).
export default function PageIntrouvable() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="carte p-6 text-center">
        <p className="text-4xl" aria-hidden="true">
          🍃
        </p>
        <h1 className="mt-3 font-display text-2xl italic text-encre">
          Cette page n&rsquo;existe pas
        </h1>
        <p className="mt-3 text-sm text-ardoise">
          Le lien est peut-être ancien, ou ce que vous cherchiez a été
          supprimé. Rien n&rsquo;est perdu pour autant : retrouvez votre
          chemin depuis l&rsquo;accueil.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/tableau-de-bord" className="bouton-primaire">
            Retour à l&rsquo;accueil
          </Link>
          <Link href="/journal" className="bouton-secondaire">
            Ouvrir le journal
          </Link>
        </div>
      </div>
    </main>
  );
}
