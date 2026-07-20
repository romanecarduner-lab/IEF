"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validerStatutProgression } from "./actions";

type Statut = { code: string; libelle: string };

export function SelecteurStatutProgression({
  parcoursId,
  elementProgrammeId,
  statutActuelCode,
  statuts,
}: {
  parcoursId: string;
  elementProgrammeId: string;
  statutActuelCode: string;
  statuts: Statut[];
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function gererChangement(evenement: React.ChangeEvent<HTMLSelectElement>) {
    const nouveauCode = evenement.target.value;
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await validerStatutProgression(
        parcoursId,
        elementProgrammeId,
        nouveauCode,
        ""
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <select
        defaultValue={statutActuelCode}
        onChange={gererChangement}
        disabled={enCours}
        className="rounded-doux border border-trait bg-white px-2.5 py-1.5 text-xs text-encre focus:border-mousse focus:outline-none disabled:opacity-60"
      >
        {statuts.map((s) => (
          <option key={s.code} value={s.code}>
            {s.libelle}
          </option>
        ))}
      </select>
      {erreur && <p className="mt-1 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
