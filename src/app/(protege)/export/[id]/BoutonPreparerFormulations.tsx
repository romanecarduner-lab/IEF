"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { preparerFormulationsExport } from "./actionsFormulations";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonPreparerFormulations({ dossierId }: { dossierId: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [progression, setProgression] = useState<string | null>(null);

  async function preparer() {
    setEnCours(true);
    setErreur(null);
    setProgression(null);
    const dejaTraites: string[] = [];
    let totalPreparees = 0;

    try {
      // Enchaine de petits lots (quelques sous-domaines a la fois) plutot
      // qu'un seul tres long appel : chacun reste rapide, et la
      // progression s'affiche au fur et a mesure.
      for (;;) {
        const resultat = await avecDelaiMaximal(
          preparerFormulationsExport(dossierId, dejaTraites),
          90000
        );
        if ("erreur" in resultat) {
          setErreur(resultat.erreur);
          return;
        }

        dejaTraites.push(...resultat.traites);
        totalPreparees += resultat.nbPreparees;

        setProgression(
          resultat.resteAFaire
            ? `${totalPreparees} sous-domaine${totalPreparees > 1 ? "s" : ""} préparé${
                totalPreparees > 1 ? "s" : ""
              }, encore ${resultat.totalRestant} à traiter…`
            : totalPreparees > 0
            ? `${totalPreparees} sous-domaine${totalPreparees > 1 ? "s" : ""} préparé${
                totalPreparees > 1 ? "s" : ""
              }. À relire ci-dessous.`
            : "Rien de nouveau à préparer pour l'instant."
        );
        router.refresh();

        if (!resultat.resteAFaire) break;
      }
    } catch (erreurInattendue) {
      setErreur(
        `${messagePourErreurInattendue(erreurInattendue)} Les sous-domaines déjà préparés sont conservés : vous pouvez relancer pour continuer.`
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mb-6 rounded-doux border border-mousse/30 bg-mousse/5 p-4">
      <p className="mb-3 text-sm text-encre">
        Prépare, pour chaque sous-domaine ayant au moins une compétence
        observée, une synthèse et deux exemples illustrés. Ça se fait par
        petits groupes successifs, vous pouvez suivre la progression.
      </p>
      <button
        type="button"
        onClick={preparer}
        disabled={enCours}
        className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enCours ? "Préparation en cours…" : "Préparer les formulations"}
      </button>
      {progression && <p className="mt-2 text-xs text-mousse-fonce">{progression}</p>}
      {erreur && <p className="mt-2 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
