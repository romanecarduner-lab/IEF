"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rouvrirDossier } from "./actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";
import { MessageStatut } from "@/components/Formulaire";

export function BoutonRouvrir({ dossierId }: { dossierId: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  async function gererReouverture() {
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(rouvrirDossier(dossierId), 30000);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de la réouverture", erreurInattendue);
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
        className="text-sm text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse"
      >
        Rouvrir pour modifier
      </button>
    );
  }

  return (
    <div className="rounded-doux border border-argile/30 bg-argile/5 p-4">
      <p className="mb-3 text-sm text-encre">
        Le dossier repassera en brouillon : vous pourrez modifier les
        descriptions, les formulations et les exemples. Le PDF et le
        PowerPoint actuels restent conservés dans l&rsquo;historique. Une
        nouvelle version ne sera créée que lorsque vous finaliserez à
        nouveau.
      </p>
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={gererReouverture}
          disabled={enCours}
          className="bouton-primaire"
        >
          {enCours ? "Réouverture…" : "Confirmer et rouvrir"}
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
