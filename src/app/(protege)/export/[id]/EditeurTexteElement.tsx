"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierTexteElement } from "./actions";

export function EditeurTexteElement({
  elementId,
  dossierId,
  texteInitial,
}: {
  elementId: string;
  dossierId: string;
  texteInitial: string;
}) {
  const router = useRouter();
  const [texte, setTexte] = useState(texteInitial);
  const [enregistre, setEnregistre] = useState(true);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer() {
    setEnCours(true);
    try {
      await modifierTexteElement(elementId, dossierId, texte);
      setEnregistre(true);
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mt-2">
      <textarea
        rows={2}
        value={texte}
        onChange={(e) => {
          setTexte(e.target.value);
          setEnregistre(false);
        }}
        placeholder="Texte affiché dans le PDF pour cette activité…"
        className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-xs text-encre focus:border-mousse focus:outline-none"
      />
      {!enregistre && (
        <button
          type="button"
          onClick={enregistrer}
          disabled={enCours}
          className="mt-1 text-xs font-medium text-mousse-fonce underline underline-offset-2"
        >
          {enCours ? "Enregistrement…" : "Enregistrer ce texte"}
        </button>
      )}
    </div>
  );
}
