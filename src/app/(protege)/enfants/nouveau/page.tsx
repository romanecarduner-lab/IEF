"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { creerEnfant } from "../actions";
import { Champ, MessageStatut } from "@/components/Formulaire";
import type { EtatFormulaire } from "@/lib/typesFormulaire";

const ETAT_INITIAL: EtatFormulaire = {};

function BoutonEnregistrer() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enregistrement…" : "Enregistrer"}
    </button>
  );
}

export default function PageNouvelEnfant() {
  const [etat, action] = useFormState(creerEnfant, ETAT_INITIAL);

  return (
    <div className="max-w-lg">
      <Link
        href="/enfants"
        className="mb-6 inline-block text-sm text-ardoise hover:text-encre"
      >
        ← Retour
      </Link>
      <h1 className="mb-6 font-display text-2xl italic text-encre">
        Ajouter un enfant
      </h1>

      {etat.erreur && <MessageStatut type="erreur">{etat.erreur}</MessageStatut>}

      <form
        action={action}
        className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux"
      >
        <Champ label="Prénom" id="prenom" type="text" required autoFocus />
        <Champ
          label="Date de naissance (facultatif)"
          id="date-naissance"
          type="date"
        />
        <div className="mb-4">
          <label
            htmlFor="remarques"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
            Remarques (facultatif)
          </label>
          <textarea
            id="remarques"
            name="remarques"
            rows={3}
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>
        <BoutonEnregistrer />
      </form>
    </div>
  );
}
