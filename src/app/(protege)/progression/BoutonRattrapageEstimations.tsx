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
  const [progression, setProgression] = useState<string | null>(null);
  const [termine, setTermine] = useState(false);

  async function rattraper() {
    setEnCours(true);
    setErreur(null);
    setTermine(false);
    let totalTraites = 0;
    let totalEstimees = 0;

    try {
      // Enchaine les lots les uns apres les autres (plutot qu'un seul
      // tres long appel) : chaque lot reste rapide, et la progression
      // s'affiche au fur et a mesure.
      for (;;) {
        const resultat = await avecDelaiMaximal(
          rattraperEstimationsManquantes(enfantId, cycleId),
          60000
        );
        if ("erreur" in resultat) {
          setErreur(resultat.erreur);
          return;
        }

        totalTraites += resultat.nbTraitees;
        totalEstimees += resultat.nbEstimees;

        if (totalTraites === 0) {
          setProgression("Rien à rattraper : toutes les compétences déjà observées ont déjà un statut.");
          break;
        }

        setProgression(
          `${totalEstimees} compétence${totalEstimees > 1 ? "s" : ""} estimée${
            totalEstimees > 1 ? "s" : ""
          } sur ${totalTraites} examinée${totalTraites > 1 ? "s" : ""}${
            resultat.resteAFaire ? ` — encore ${resultat.totalRestant} à traiter…` : ""
          }`
        );

        if (!resultat.resteAFaire) break;
      }
      setTermine(true);
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
        validées — par petits groupes successifs, sans danger à
        relancer si vous quittez la page en cours de route.
      </p>
      <button
        type="button"
        onClick={rattraper}
        disabled={enCours}
        className="rounded-doux bg-mousse-fonce px-3.5 py-2 text-xs font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enCours ? "Rattrapage en cours…" : "Rattraper les compétences déjà observées"}
      </button>
      {progression && (
        <p className={`mt-2 text-xs ${termine ? "text-mousse-fonce" : "text-ardoise"}`}>
          {progression}
          {termine && " — terminé."}
        </p>
      )}
      {erreur && <p className="mt-2 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
