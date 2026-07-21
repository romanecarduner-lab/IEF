"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validerStatutProgression } from "./actions";

type Statut = { code: string; libelle: string };

export function SelecteurStatutProgression({
  parcoursId,
  elementProgrammeId,
  statutActuelCode,
  dejaValide,
  statuts,
}: {
  parcoursId: string;
  elementProgrammeId: string;
  statutActuelCode: string;
  dejaValide: boolean;
  statuts: Statut[];
}) {
  const router = useRouter();
  const [valeur, setValeur] = useState(statutActuelCode);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirme, setConfirme] = useState(dejaValide);

  async function gererConfirmation() {
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await validerStatutProgression(
        parcoursId,
        elementProgrammeId,
        valeur,
        ""
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setConfirme(true);
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={valeur}
        onChange={(e) => {
          setValeur(e.target.value);
          setConfirme(false);
        }}
        disabled={enCours}
        className="rounded-doux border border-trait bg-white px-2.5 py-1.5 text-xs text-encre focus:border-mousse focus:outline-none disabled:opacity-60"
      >
        {statuts.map((s) => (
          <option key={s.code} value={s.code}>
            {s.libelle}
          </option>
        ))}
      </select>
      {!confirme && (
        <button
          type="button"
          onClick={gererConfirmation}
          disabled={enCours}
          className="rounded-doux bg-mousse-fonce px-2.5 py-1.5 text-xs font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enCours ? "…" : "Confirmer"}
        </button>
      )}
      {erreur && <p className="text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
