"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rattraperEstimationsManquantes } from "./actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonRattrapageEstimations({
  enfantId,
  cycleId,
}: {
  enfantId: string;
  cycleId: string;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function rattraper() {
    setEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      const resultat = await avecDelaiMaximal(
        rattraperEstimationsManquantes(enfantId, cycleId),
        180000
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setMessage(
        resultat.nbTraitees === 0
          ? "Rien à rattraper : toutes les compétences déjà observées ont déjà un statut."
          : `${resultat.nbEstimees} compétence${resultat.nbEstimees > 1 ? "s" : ""} estimée${
              resultat.nbEstimees > 1 ? "s" : ""
            } sur ${resultat.nbTraitees} examinée${resultat.nbTraitees > 1 ? "s" : ""}${
              resultat.nbNonConcluantes > 0
                ? ` (${resultat.nbNonConcluantes} restée${resultat.nbNonConcluantes > 1 ? "s" : ""} sans statut, situation trop ambiguë pour conclure automatiquement)`
                : ""
            }.`
      );
      router.refresh();
    } catch (erreurInattendue) {
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mb-4 rounded-doux border border-mousse/30 bg-mousse/5 p-3">
      <p className="mb-2 text-xs text-ardoise">
        Des compétences observées avant la mise en place de la
        validation automatique peuvent ne pas avoir encore de statut.
        Ce bouton les rattrape une fois, sans toucher à celles déjà
        validées.
      </p>
      <button
        type="button"
        onClick={rattraper}
        disabled={enCours}
        className="rounded-doux bg-mousse-fonce px-3.5 py-2 text-xs font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enCours ? "Rattrapage en cours… (peut prendre un moment)" : "Rattraper les compétences déjà observées"}
      </button>
      {message && <p className="mt-2 text-xs text-mousse-fonce">{message}</p>}
      {erreur && <p className="mt-2 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
