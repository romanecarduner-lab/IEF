"use client";

import { useFormState, useFormStatus } from "react-dom";
import { creerDossier } from "../actions";
import { Champ, MessageStatut } from "@/components/Formulaire";

const ETAT_INITIAL: { erreur?: string } = {};

function BoutonCreer() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Création…" : "Créer le dossier"}
    </button>
  );
}

export function FormulaireDossier({
  parcours,
}: {
  parcours: { id: string; libelle: string }[];
}) {
  const [etat, action] = useFormState(creerDossier, ETAT_INITIAL);

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

      <BoutonCreer />
    </form>
  );
}
