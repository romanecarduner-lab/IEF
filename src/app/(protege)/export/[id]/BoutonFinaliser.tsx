"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finaliserDossier } from "./actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";
import { MessageStatut } from "@/components/Formulaire";

export function BoutonFinaliser({ dossierId }: { dossierId: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  async function gererFinalisation() {
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(finaliserDossier(dossierId), 45000);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de la finalisation", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  if (!confirmation) {
    return (
      <button
        type="button"
        onClick={() => setConfirmation(true)}
        className="rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white hover:bg-mousse"
      >
        Finaliser ce dossier
      </button>
    );
  }

  return (
    <div className="rounded-doux border border-argile/30 bg-argile/5 p-4">
      <p className="mb-3 text-sm text-encre">
        Une fois finalisé, le contenu de ce dossier sera figé (les
        modifications ultérieures des activités ou traces sources ne le
        changeront plus). Le PDF sera généré maintenant.
      </p>
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={gererFinalisation}
          disabled={enCours}
          className="rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enCours ? "Génération du PDF…" : "Confirmer et générer le PDF"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          disabled={enCours}
          className="text-sm text-ardoise underline underline-offset-2"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
