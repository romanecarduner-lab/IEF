"use client";

import { useState } from "react";
import { modifierPronomEnfant } from "../enfants/actions";

export function SelecteurPronomEnfant({
  enfantId,
  pronomActuel,
}: {
  enfantId: string;
  pronomActuel: string | null;
}) {
  const [pronom, setPronom] = useState(pronomActuel ?? "");
  const [enCours, setEnCours] = useState(false);

  async function changer(valeur: string) {
    setPronom(valeur);
    setEnCours(true);
    try {
      await modifierPronomEnfant(enfantId, valeur as "il" | "elle" | "");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <select
      value={pronom}
      disabled={enCours}
      onChange={(e) => changer(e.target.value)}
      className="mt-1 rounded-doux border border-trait bg-white px-2 py-1 text-xs text-encre focus:border-mousse focus:outline-none disabled:opacity-60"
      title="Pronom à utiliser dans les textes générés automatiquement"
    >
      <option value="">Pronom non précisé</option>
      <option value="il">Il</option>
      <option value="elle">Elle</option>
    </select>
  );
}
