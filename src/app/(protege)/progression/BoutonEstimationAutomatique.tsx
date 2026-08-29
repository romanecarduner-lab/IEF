"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { estimerProgressionAutomatique } from "./actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonEstimationAutomatique({
  parcoursId,
  elementProgrammeId,
}: {
  parcoursId: string;
  elementProgrammeId: string;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);

  async function gererClic() {
    setEnCours(true);
    setResultat(null);
    try {
      const reponse = await avecDelaiMaximal(
        estimerProgressionAutomatique(parcoursId, elementProgrammeId)
      );
      if ("erreur" in reponse) {
        setResultat(`Erreur : ${reponse.erreur}`);
        return;
      }
      if (!reponse.concluant) {
        setResultat(`Non concluant — ${reponse.raison}`);
        return;
      }
      const suite = reponse.appliqueDirectement
        ? `appliqué directement (${reponse.statutLibelle}, ${reponse.niveauConfiance})`
        : reponse.propositionEnregistree
        ? `proposition enregistrée (${reponse.statutLibelle}, ${reponse.niveauConfiance}) — le statut actuel étant manuel, elle n'a pas été appliquée seule`
        : `déjà à jour ou proposition non renouvelée — ${reponse.justification}`;
      setResultat(`${suite}. Justification : ${reponse.justification}`);
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors de l'estimation automatique", erreurInattendue);
      setResultat(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={gererClic}
        disabled={enCours}
        className="text-xs font-medium text-argile underline decoration-argile/50 underline-offset-2 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enCours ? "Estimation en cours…" : "🔍 Tester le moteur d'estimation (étape 3)"}
      </button>
      {resultat && (
        <p className="mt-1.5 rounded-doux bg-argile/5 p-2 text-xs text-encre">{resultat}</p>
      )}
    </div>
  );
}
