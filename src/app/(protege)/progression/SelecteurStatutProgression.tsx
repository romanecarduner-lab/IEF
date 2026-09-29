"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validerStatutProgression } from "./actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

type Statut = { code: string; libelle: string };
type Jumelle = { elementId: string; chemin: string | null };

export function SelecteurStatutProgression({
  parcoursId,
  elementProgrammeId,
  statutActuelCode,
  dejaValide,
  statuts,
  jumelles = [],
}: {
  parcoursId: string;
  elementProgrammeId: string;
  statutActuelCode: string;
  dejaValide: boolean;
  statuts: Statut[];
  jumelles?: Jumelle[];
}) {
  const router = useRouter();
  const [valeur, setValeur] = useState(statutActuelCode);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirme, setConfirme] = useState(dejaValide);
  const [appliquerAuxJumelles, setAppliquerAuxJumelles] = useState(jumelles.length > 0);

  async function gererConfirmation() {
    setEnCours(true);
    setErreur(null);
    try {
      const cibles = appliquerAuxJumelles
        ? [elementProgrammeId, ...jumelles.map((j) => j.elementId)]
        : [elementProgrammeId];

      const resultats = await Promise.all(
        cibles.map((id) =>
          avecDelaiMaximal(validerStatutProgression(parcoursId, id, valeur, ""), 30000)
        )
      );
      const echec = resultats.find((r) => "erreur" in r);
      if (echec && "erreur" in echec) {
        setErreur(echec.erreur);
        return;
      }
      setConfirme(true);
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de la confirmation du statut", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
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
      </div>
      {!confirme && jumelles.length > 0 && (
        <label className="mt-1.5 flex items-start gap-1.5 text-xs text-ardoise">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={appliquerAuxJumelles}
            onChange={(e) => setAppliquerAuxJumelles(e.target.checked)}
            disabled={enCours}
          />
          <span>
            Appliquer aussi à la même compétence pour{" "}
            {jumelles.map((j) => j.chemin?.split(" > ").at(-2) ?? "l'autre tranche d'âge").join(", ")}
          </span>
        </label>
      )}
      {erreur && <p className="mt-1 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
