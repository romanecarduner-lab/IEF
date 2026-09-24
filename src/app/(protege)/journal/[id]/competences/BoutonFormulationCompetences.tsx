"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { proposerFormulationPedagogique } from "../../nouvelle/actionsIA";
import { modifierObservationsActivite } from "../../actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonFormulationCompetences({
  activiteId,
  titre,
  description,
  competencesReliees,
}: {
  activiteId: string;
  titre: string;
  description: string;
  competencesReliees: string[];
}) {
  const router = useRouter();
  const [texte, setTexte] = useState<string | null>(null);
  const [modifie, setModifie] = useState(false);
  const [chargementGeneration, setChargementGeneration] = useState(false);
  const [chargementEnregistrement, setChargementEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function generer() {
    setChargementGeneration(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(
        proposerFormulationPedagogique(
          titre,
          description,
          competencesReliees,
          undefined,
          activiteId
        ),
        30000
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setTexte(resultat.texte);
      setModifie(true);
    } catch (erreurInattendue) {
      console.error("Erreur lors de la génération de la formulation", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargementGeneration(false);
    }
  }

  async function enregistrer() {
    setChargementEnregistrement(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(
        modifierObservationsActivite(activiteId, texte ?? "")
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setModifie(false);
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors de l'enregistrement", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargementEnregistrement(false);
    }
  }

  return (
    <div className="mt-6 rounded-doux border border-trait bg-white/80 p-4 shadow-doux">
      <p className="mb-1 text-sm font-medium text-encre">Formulation pédagogique</p>
      <p className="mb-3 text-xs text-ardoise">
        Rédige (ou met à jour) le champ Observations de l&rsquo;activité, à
        partir de toutes les compétences actuellement reliées ci-contre.
      </p>

      {texte !== null && (
        <div className="mb-2">
          <textarea
            value={texte}
            onChange={(e) => {
              setTexte(e.target.value);
              setModifie(true);
            }}
            rows={4}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          />
          {modifie && (
            <button
              type="button"
              onClick={enregistrer}
              disabled={chargementEnregistrement}
              className="mt-1.5 rounded-doux bg-mousse-fonce px-3 py-1.5 text-xs font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chargementEnregistrement ? "Enregistrement…" : "Enregistrer dans Observations"}
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={generer}
        disabled={chargementGeneration || competencesReliees.length === 0}
        title={
          competencesReliees.length === 0
            ? "Reliez d'abord au moins une compétence"
            : undefined
        }
        className="text-xs font-medium text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse disabled:cursor-not-allowed disabled:opacity-50"
      >
        {chargementGeneration
          ? "L'IA rédige…"
          : texte !== null
          ? "✨ Régénérer avec les compétences actuelles"
          : "✨ Générer la formulation pédagogique"}
      </button>
      {erreur && <p className="mt-1.5 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
