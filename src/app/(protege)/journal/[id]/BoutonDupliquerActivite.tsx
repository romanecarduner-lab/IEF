"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dupliquerActiviteVersParcours } from "../actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonDupliquerActivite({
  activiteId,
  autresEnfants,
}: {
  activiteId: string;
  autresEnfants: { id: string; prenom: string }[];
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function dupliquer(enfantCibleId: string) {
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(
        dupliquerActiviteVersParcours(activiteId, enfantCibleId)
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      router.push(`/journal/${resultat.id}`);
      router.refresh();
    } catch (erreurInattendue) {
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="text-sm font-medium text-mousse-fonce underline underline-offset-2 hover:text-mousse"
      >
        Dupliquer pour un autre enfant
      </button>
    );
  }

  return (
    <div className="relative">
      <select
        defaultValue=""
        disabled={enCours}
        onChange={(e) => {
          if (e.target.value) dupliquer(e.target.value);
        }}
        onBlur={() => setOuvert(false)}
        autoFocus
        className="rounded-doux border border-trait bg-white px-2.5 py-1.5 text-sm text-encre focus:border-mousse focus:outline-none"
      >
        <option value="" disabled>
          {enCours ? "Duplication…" : "Choisir l'enfant…"}
        </option>
        {autresEnfants.map((e) => (
          <option key={e.id} value={e.id}>
            {e.prenom}
          </option>
        ))}
      </select>
      {erreur && <p className="mt-1 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
