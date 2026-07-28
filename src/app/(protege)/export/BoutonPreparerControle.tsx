"use client";

import { useState } from "react";
import { creerBilanControle } from "./actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";
import { MessageStatut } from "@/components/Formulaire";

export function BoutonPreparerControle({
  parcours,
}: {
  parcours: { id: string; libelle: string }[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [parcoursId, setParcoursId] = useState(parcours[0]?.id ?? "");
  const [maxParDomaine, setMaxParDomaine] = useState(3);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function gererClic() {
    if (!parcoursId) return;
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(
        creerBilanControle(parcoursId, maxParDomaine),
        45000
      );
      // Si on arrive ici, c'est qu'il y a eu une erreur : en cas de succes,
      // creerBilanControle redirige et ne retourne jamais.
      if (resultat && "erreur" in resultat) {
        setErreur(resultat.erreur);
      }
    } catch (erreurInattendue) {
      console.error("Erreur lors de la préparation du contrôle", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  if (parcours.length === 0) return null;

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="mb-8 rounded-doux bg-mousse-fonce px-5 py-3 text-sm font-medium text-white hover:bg-mousse"
      >
        ✨ Préparer mon contrôle
      </button>
    );
  }

  return (
    <div className="mb-8 rounded-doux border border-mousse/30 bg-mousse/5 p-5">
      <p className="mb-1 text-sm font-medium text-encre">Préparer mon contrôle</p>
      <p className="mb-3 text-xs text-ardoise">
        Crée un dossier et le remplit automatiquement (favoris en
        priorité, puis les plus récents, par domaine) — vous pourrez
        encore tout ajuster avant de le finaliser.
      </p>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-encre">
            Enfant / année
          </label>
          <select
            value={parcoursId}
            onChange={(e) => setParcoursId(e.target.value)}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            {parcours.map((p) => (
              <option key={p.id} value={p.id}>
                {p.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-encre">
            Exemples par domaine
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={maxParDomaine}
            onChange={(e) => setMaxParDomaine(Number(e.target.value))}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>
      </div>

      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={gererClic}
          disabled={enCours}
          className="rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enCours ? "Préparation en cours…" : "Générer mon dossier de contrôle"}
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          disabled={enCours}
          className="text-sm text-ardoise underline underline-offset-2"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
