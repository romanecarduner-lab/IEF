"use client";

import { useState } from "react";
import { enregistrerSousDomaine } from "./actionsFormulations";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function EditeurFormulation({
  dossierId,
  sousDomaine,
  champ,
  texteInitial,
  rows = 3,
}: {
  dossierId: string;
  sousDomaine: string;
  champ: "synthese" | "exemple1_synthese" | "exemple2_synthese";
  texteInitial: string;
  rows?: number;
}) {
  const [texte, setTexte] = useState(texteInitial);
  const [enregistre, setEnregistre] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer() {
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(
        enregistrerSousDomaine(dossierId, sousDomaine, champ, texte)
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setEnregistre(true);
    } catch (erreurInattendue) {
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mt-2">
      <textarea
        value={texte}
        onChange={(e) => {
          setTexte(e.target.value);
          setEnregistre(false);
        }}
        rows={rows}
        className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
      />
      <div className="mt-1 flex items-center gap-2">
        {!enregistre && (
          <button
            type="button"
            onClick={enregistrer}
            disabled={enCours}
            className="rounded-doux bg-mousse-fonce px-3 py-1.5 text-xs font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enCours ? "…" : "Enregistrer"}
          </button>
        )}
        {erreur && <p className="text-xs text-alerte">{erreur}</p>}
      </div>
    </div>
  );
}
