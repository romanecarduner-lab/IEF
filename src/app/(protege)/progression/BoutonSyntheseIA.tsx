"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { genererSyntheseCompetenceIA, modifierSyntheseIA } from "./actionsIA";
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
  const [texteModifie, setTexteModifie] = useState(false);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

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
      setTexteModifie(false);
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors de la génération de la synthèse IA", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  async function enregistrerModification() {
    setEnregistrementEnCours(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(
        modifierSyntheseIA(parcoursId, elementProgrammeId, texteLocal ?? "")
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setTexteModifie(false);
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors de l'enregistrement de la modification", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  return (
    <div className="mt-3 w-full border-t border-trait pt-3">
      {texteLocal !== null && (
        <div className="mb-2 rounded-doux bg-mousse/5 p-3">
          <textarea
            value={texteLocal}
            onChange={(e) => {
              setTexteLocal(e.target.value);
              setTexteModifie(true);
            }}
            rows={4}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            {syntheseExistante?.genereeLe && (
              <p className="text-xs text-ardoise">
                Générée le{" "}
                {new Date(syntheseExistante.genereeLe).toLocaleDateString("fr-FR")}
                {texteModifie ? " — modifiée depuis" : ""}
              </p>
            )}
            {texteModifie && (
              <button
                type="button"
                onClick={enregistrerModification}
                disabled={enregistrementEnCours}
                className="rounded-doux bg-mousse-fonce px-3 py-1 text-xs font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enregistrementEnCours ? "Enregistrement…" : "Enregistrer la modification"}
              </button>
            )}
          </div>
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
