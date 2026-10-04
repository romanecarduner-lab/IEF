"use client";

import { libelleCourtDomaine } from "@/lib/libelleCourtDomaine";

/**
 * Barre de raccourcis pour aller directement a un domaine de la liste
 * (la liste peut compter plusieurs centaines de competences). Reste
 * visible en haut de l'ecran pendant le defilement, sur une seule ligne
 * deplacable lateralement pour ne pas occuper trop de place sur mobile.
 * Ouvre le domaine choisi s'il avait ete replie.
 */
export function NavigationDomaines({
  domaines,
}: {
  domaines: { id: string; nom: string; nb: number }[];
}) {
  function aller(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    if (element instanceof HTMLDetailsElement) element.open = true;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (domaines.length < 2) return null;

  return (
    <nav
      aria-label="Aller à un domaine"
      className="sticky top-0 z-10 -mx-4 mb-4 overflow-x-auto bg-brume/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0"
    >
      <div className="flex gap-1.5 whitespace-nowrap">
        <span className="shrink-0 self-center pr-1 text-xs text-ardoise">Aller à :</span>
        {domaines.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => aller(d.id)}
            className="shrink-0 rounded-full border border-trait bg-white px-3 py-1 text-xs text-encre hover:border-mousse hover:text-mousse-fonce"
          >
            {libelleCourtDomaine(d.nom)} <span className="text-ardoise">{d.nb}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
