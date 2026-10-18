/**
 * Fil d'etapes du dossier pedagogique : preparer, relire, finaliser.
 * Chaque etape mene a sa section par un lien ; l'etape en cours est
 * mise en avant. Rien n'est bloque : on peut aller et venir librement.
 */
export function EtapesExport({ etapeCourante }: { etapeCourante: 1 | 2 | 3 }) {
  const etapes = [
    { n: 1, ancre: "#preparer", libelle: "Préparer", detail: "Le logiciel rédige" },
    { n: 2, ancre: "#relire", libelle: "Relire", detail: "Ajuster, choisir les exemples" },
    { n: 3, ancre: "#finaliser", libelle: "Finaliser", detail: "PDF et PowerPoint" },
  ];
  return (
    <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Étapes du dossier">
      {etapes.map((e) => {
        const faite = e.n < etapeCourante;
        const courante = e.n === etapeCourante;
        return (
          <li key={e.n}>
            <a
              href={e.ancre}
              aria-current={courante ? "step" : undefined}
              className={`block h-full rounded-doux border px-2 py-2 transition-colors ${
                courante
                  ? "border-mousse-fonce bg-mousse-fonce text-white"
                  : faite
                    ? "border-mousse/40 bg-mousse/10 text-mousse-fonce"
                    : "border-trait bg-white text-encre hover:bg-lin"
              }`}
            >
              <span className="block text-xs opacity-80">
                Étape {e.n}
                {faite ? " · faite" : ""}
              </span>
              <span className="block text-sm font-medium leading-tight">{e.libelle}</span>
              <span className="block text-xs opacity-80">{e.detail}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
