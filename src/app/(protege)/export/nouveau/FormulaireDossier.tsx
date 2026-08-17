"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { creerDossier } from "../actions";
import { Champ, MessageStatut } from "@/components/Formulaire";

const ETAT_INITIAL: { erreur?: string } = {};

function BoutonCreer({ remplissageAuto }: { remplissageAuto: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Création…"
        : remplissageAuto
        ? "Créer et remplir automatiquement"
        : "Créer le dossier vide"}
    </button>
  );
}

export function FormulaireDossier({
  parcours,
}: {
  parcours: { id: string; libelle: string }[];
}) {
  const [etat, action] = useFormState(creerDossier, ETAT_INITIAL);
  const [remplissageAuto, setRemplissageAuto] = useState(true);

  return (
    <form
      action={action}
      className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux"
    >
      {etat.erreur && <MessageStatut type="erreur">{etat.erreur}</MessageStatut>}

      <Champ
        label="Titre du dossier"
        id="titre"
        type="text"
        placeholder="Dossier pédagogique 2026-2027"
        required
        autoFocus
      />

      <div className="mb-4">
        <label htmlFor="parcours_id" className="mb-1.5 block text-sm font-medium text-encre">
          Enfant / année scolaire
        </label>
        <select
          id="parcours_id"
          name="parcours_id"
          required
          className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
        >
          <option value="">Sélectionner…</option>
          {parcours.map((p) => (
            <option key={p.id} value={p.id}>
              {p.libelle}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 rounded-doux border border-mousse/30 bg-mousse/5 p-3">
        <label className="flex items-start gap-2 text-sm text-encre">
          <input
            type="checkbox"
            name="remplissage_auto"
            checked={remplissageAuto}
            onChange={(e) => setRemplissageAuto(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Remplir automatiquement (recommandé) — sélectionne, pour chaque
            domaine déjà abordé, vos activités favorites en priorité puis
            les plus récentes. Vous pourrez toujours ajuster ensuite.
          </span>
        </label>

        {remplissageAuto && (
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="max_par_domaine" className="text-xs text-ardoise">
              Exemples par domaine
            </label>
            <input
              id="max_par_domaine"
              type="number"
              name="max_par_domaine"
              min={1}
              max={10}
              defaultValue={3}
              className="w-16 rounded-doux border border-trait bg-white px-2 py-1 text-sm text-encre focus:border-mousse focus:outline-none"
            />
          </div>
        )}
      </div>

      <BoutonCreer remplissageAuto={remplissageAuto} />
    </form>
  );
}
