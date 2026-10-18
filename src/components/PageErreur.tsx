"use client";

import Link from "next/link";

/**
 * Ecran affiche quand une page plante. Ton rassurant, une action claire
 * (reessayer), une sortie (retour a l'accueil) et un code court que la
 * personne peut transmettre a l'administratrice ou l'administrateur.
 */
export function PageErreur({
  reset,
  code,
  lienAccueil = "/tableau-de-bord",
}: {
  reset: () => void;
  code?: string;
  lienAccueil?: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="carte p-6 text-center">
        <p className="text-4xl" aria-hidden="true">
          🌱
        </p>
        <h1 className="mt-3 font-display text-2xl italic text-encre">
          Quelque chose n&rsquo;a pas fonctionné
        </h1>
        <p className="mt-3 text-sm text-ardoise">
          Ce n&rsquo;est pas de votre fait. Ce que vous avez déjà enregistré
          n&rsquo;est pas touché. Vous pouvez réessayer, ou revenir à
          l&rsquo;accueil.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => reset()} className="bouton-primaire">
            Réessayer
          </button>
          <Link href={lienAccueil} className="bouton-secondaire">
            Retour à l&rsquo;accueil
          </Link>
        </div>
        <p className="mt-6 text-xs text-ardoise">
          Si cela se reproduit, notez ce que vous étiez en train de faire
          {code ? (
            <>
              {" "}
              et le code <span className="font-mono">{code}</span>
            </>
          ) : null}
          , puis transmettez-le à la personne qui administre l&rsquo;application.
        </p>
      </div>
    </main>
  );
}
