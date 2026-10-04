"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { preparerFormulationsExport } from "./actionsFormulations";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonPreparerFormulations({ dossierId }: { dossierId: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function preparer() {
    setEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      const resultat = await avecDelaiMaximal(
        preparerFormulationsExport(dossierId),
        120000
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setMessage(
        resultat.nbPreparees > 0
          ? `${resultat.nbPreparees} sous-domaine${resultat.nbPreparees > 1 ? "s" : ""} préparé${
              resultat.nbPreparees > 1 ? "s" : ""
            } — à relire ci-dessous.`
          : "Rien de nouveau à préparer pour l'instant."
      );
      router.refresh();
    } catch (erreurInattendue) {
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mb-6 rounded-doux border border-mousse/30 bg-mousse/5 p-4">
      <p className="mb-3 text-sm text-encre">
        Prépare, pour chaque sous-domaine ayant au moins une compétence
        observée, une synthèse et deux exemples illustrés.
      </p>
      <button
        type="button"
        onClick={preparer}
        disabled={enCours}
        className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enCours ? "Préparation en cours… (peut prendre une minute)" : "Préparer les formulations"}
      </button>
      {message && <p className="mt-2 text-xs text-mousse-fonce">{message}</p>}
      {erreur && <p className="mt-2 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
