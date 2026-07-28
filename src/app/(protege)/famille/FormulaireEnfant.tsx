"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { creerEnfant } from "../enfants/actions";
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
      {pending ? "Enregistrement…" : "Ajouter cet enfant"}
    </button>
  );
}

export function FormulaireEnfant() {
  const [etat, action] = useFormState(creerEnfant, ETAT_INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // creerEnfant redirige normalement (voir enfants/actions.ts) ; ce cas ne
  // sert que si jamais aucune redirection ne se produit.
  useEffect(() => {
    if (!etat.erreur) formRef.current?.reset();
  }, [etat]);

  return (
    <div className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux">
      <p className="mb-4 text-sm font-medium text-encre">Ajouter un enfant</p>
      {etat.erreur && <MessageStatut type="erreur">{etat.erreur}</MessageStatut>}
      <form ref={formRef} action={action}>
        <Champ label="Prénom" id="prenom" type="text" required />
        <Champ label="Date de naissance (facultatif)" id="date-naissance" type="date" />
        <div className="mb-4">
          <label htmlFor="remarques" className="mb-1.5 block text-sm font-medium text-encre">
            Remarques (facultatif)
          </label>
          <textarea
            id="remarques"
            name="remarques"
            rows={2}
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>
        <BoutonEnregistrer />
      </form>
    </div>
  );
}
