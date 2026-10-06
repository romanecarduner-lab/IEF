"use client";

import { useState } from "react";
import { enregistrerSousDomaine } from "./actionsFormulations";
import { enregistrerSyntheseExemple } from "./actionsExemples";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

/**
 * Zone de texte modifiable : la synthese d'un sous-domaine (sans
 * activiteId) ou le texte d'un exemple precis (avec activiteId).
 */
export function EditeurFormulation({
  dossierId,
  sousDomaine,
  activiteId,
  texteInitial,
  rows = 3,
}: {
  dossierId: string;
  sousDomaine: string;
  activiteId?: string;
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
        activiteId
          ? enregistrerSyntheseExemple(dossierId, sousDomaine, activiteId, texte)
          : enregistrerSousDomaine(dossierId, sousDomaine, texte)
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
