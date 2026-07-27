"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { remplirBilanAutomatique } from "./actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";
import { MessageStatut } from "@/components/Formulaire";

export function BoutonRemplissageAutomatique({
  dossierId,
  parcoursId,
}: {
  dossierId: string;
  parcoursId: string;
}) {
  const router = useRouter();
  const [maxParDomaine, setMaxParDomaine] = useState(3);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  async function gererClic() {
    setEnCours(true);
    setErreur(null);
    setSucces(null);
    try {
      const resultat = await avecDelaiMaximal(
        remplirBilanAutomatique(dossierId, parcoursId, maxParDomaine),
        30000
      );
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setSucces(
        resultat.nbAjoutees > 0
          ? `${resultat.nbAjoutees} activité(s) ajoutée(s). Vous pouvez encore ajuster la sélection ci-dessous.`
          : "Tout était déjà inclus."
      );
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors du remplissage automatique", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mb-6 rounded-doux border border-mousse/30 bg-mousse/5 p-4">
      <p className="mb-1 text-sm font-medium text-encre">
        Remplissage automatique pour un bilan de contrôle
      </p>
      <p className="mb-3 text-xs text-ardoise">
        Sélectionne, pour chaque domaine déjà abordé, vos activités
        favorites en priorité puis les plus récentes — sans tout inclure,
        pour garder un document lisible. Vous gardez la main pour ajuster
        ensuite.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="max-par-domaine" className="mb-1 block text-xs text-ardoise">
            Exemples par domaine
          </label>
          <input
            id="max-par-domaine"
            type="number"
            min={1}
            max={10}
            value={maxParDomaine}
            onChange={(e) => setMaxParDomaine(Number(e.target.value))}
            className="w-20 rounded-doux border border-trait bg-white px-2.5 py-1.5 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={gererClic}
          disabled={enCours}
          className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enCours ? "Sélection en cours…" : "Remplir automatiquement"}
        </button>
      </div>
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
      {succes && <MessageStatut type="succes">{succes}</MessageStatut>}
    </div>
  );
}
