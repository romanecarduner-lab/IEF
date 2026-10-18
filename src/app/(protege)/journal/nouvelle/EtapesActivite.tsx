"use client";

/**
 * Fil d'Ariane de la creation d'une activite : trois temps cliquables.
 * Chaque pastille indique ce qui est deja rempli, sans jamais bloquer :
 * on peut enregistrer des la premiere etape.
 */
export function EtapesActivite({
  etape,
  onChoisir,
  titreOk,
  nbCompetences,
}: {
  etape: 1 | 2 | 3;
  onChoisir: (n: 1 | 2 | 3) => void;
  titreOk: boolean;
  nbCompetences: number;
}) {
  const etapes: { n: 1 | 2 | 3; libelle: string; detail: string }[] = [
    { n: 1, libelle: "Activité", detail: titreOk ? "Titre rempli" : "Titre à saisir" },
    {
      n: 2,
      libelle: "Compétences",
      detail:
        nbCompetences > 0
          ? `${nbCompetences} choisie${nbCompetences > 1 ? "s" : ""}`
          : "Facultatif",
    },
    { n: 3, libelle: "Observation", detail: "Facultatif" },
  ];
  return (
    <ol className="mb-6 grid grid-cols-3 gap-1.5 sm:gap-2" aria-label="Étapes de la création">
      {etapes.map((e) => {
        const actif = e.n === etape;
        return (
          <li key={e.n}>
            <button
              type="button"
              onClick={() => onChoisir(e.n)}
              aria-current={actif ? "step" : undefined}
              className={`w-full rounded-doux border px-1.5 py-2 text-left sm:px-2 transition-colors ${
                actif
                  ? "border-mousse-fonce bg-mousse-fonce text-white"
                  : "border-trait bg-white text-encre hover:bg-lin"
              }`}
            >
              <span className="block text-xs opacity-80">Étape {e.n}</span>
              <span className="block text-[12px] font-medium leading-tight min-[400px]:text-[13px] sm:text-sm">{e.libelle}</span>
              <span className="block text-xs opacity-80">{e.detail}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
