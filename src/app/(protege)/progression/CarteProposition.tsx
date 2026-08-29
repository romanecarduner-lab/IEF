"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { appliquerPropositionProgression, ignorerPropositionProgression } from "./actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function CarteProposition({
  parcoursId,
  elementProgrammeId,
  statutProposeLibelle,
  justification,
}: {
  parcoursId: string;
  elementProgrammeId: string;
  statutProposeLibelle: string;
  justification: string | null;
}) {
  const router = useRouter();
  const [garderAutomatique, setGarderAutomatique] = useState(true);
  const [enCours, setEnCours] = useState<"appliquer" | "ignorer" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function appliquer() {
    setEnCours("appliquer");
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(
        appliquerPropositionProgression(parcoursId, elementProgrammeId, garderAutomatique)
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors de l'application de la proposition", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(null);
    }
  }

  async function ignorer() {
    setEnCours("ignorer");
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(
        ignorerPropositionProgression(parcoursId, elementProgrammeId)
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors de l'ignorance de la proposition", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="mt-2 rounded-doux border border-ocre/40 bg-ocre/10 p-3">
      <p className="mb-1 text-sm font-medium text-encre">
        💡 Estimation automatique disponible : {statutProposeLibelle}
      </p>
      {justification && <p className="mb-2 text-xs text-ardoise">{justification}</p>}

      <label className="mb-2 flex items-center gap-2 text-xs text-encre">
        <input
          type="checkbox"
          checked={garderAutomatique}
          onChange={(e) => setGarderAutomatique(e.target.checked)}
        />
        Garder ce suivi automatique ensuite (sinon, protégé comme une validation manuelle)
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={appliquer}
          disabled={enCours !== null}
          className="rounded-doux bg-mousse-fonce px-3 py-1.5 text-xs font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enCours === "appliquer" ? "Application…" : "Appliquer"}
        </button>
        <button
          type="button"
          onClick={ignorer}
          disabled={enCours !== null}
          className="text-xs text-ardoise underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enCours === "ignorer" ? "…" : "Ignorer"}
        </button>
      </div>
      {erreur && <p className="mt-1.5 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
