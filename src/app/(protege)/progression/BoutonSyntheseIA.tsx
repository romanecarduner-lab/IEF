"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { genererSyntheseCompetenceIA } from "./actionsIA";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonSyntheseIA({
  parcoursId,
  elementProgrammeId,
  syntheseExistante,
}: {
  parcoursId: string;
  elementProgrammeId: string;
  syntheseExistante: { texte: string; genereeLe: string | null } | null;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [texteLocal, setTexteLocal] = useState(syntheseExistante?.texte ?? null);

  async function gererClic() {
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(
        genererSyntheseCompetenceIA(parcoursId, elementProgrammeId),
        30000
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setTexteLocal(resultat.texte);
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors de la génération de la synthèse IA", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mt-3 w-full border-t border-trait pt-3">
      {texteLocal && (
        <div className="mb-2 rounded-doux bg-mousse/5 p-3">
          <p className="text-sm text-encre">{texteLocal}</p>
          {syntheseExistante?.genereeLe && (
            <p className="mt-1.5 text-xs text-ardoise">
              Générée le{" "}
              {new Date(syntheseExistante.genereeLe).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={gererClic}
        disabled={enCours}
        className="text-xs font-medium text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enCours
          ? "L'IA rédige…"
          : texteLocal
          ? "✨ Régénérer la synthèse (avec les observations les plus récentes)"
          : "✨ Générer une synthèse pédagogique IA"}
      </button>
      {erreur && <p className="mt-1.5 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
