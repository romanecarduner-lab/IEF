"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { preparerFormulationsExport } from "./actionsFormulations";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonPreparerFormulations({
  dossierId,
  nbEnAttente,
}: {
  dossierId: string;
  nbEnAttente: number;
}) {
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
          ? `${resultat.nbPreparees} formulation${resultat.nbPreparees > 1 ? "s" : ""} préparée${
              resultat.nbPreparees > 1 ? "s" : ""
            } — à relire ci-dessous.`
          : "Rien à préparer : toutes les compétences observées ont déjà une formulation."
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
        {nbEnAttente > 0
          ? `${nbEnAttente} compétence${nbEnAttente > 1 ? "s" : ""} observée${
              nbEnAttente > 1 ? "s" : ""
            } n'${nbEnAttente > 1 ? "ont" : "a"} pas encore de formulation préparée.`
          : "Toutes les compétences observées ont une formulation."}
      </p>
      <button
        type="button"
        onClick={preparer}
        disabled={enCours || nbEnAttente === 0}
        className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enCours ? "Préparation en cours… (peut prendre une minute)" : "Préparer les formulations"}
      </button>
      {message && <p className="mt-2 text-xs text-mousse-fonce">{message}</p>}
      {erreur && <p className="mt-2 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
