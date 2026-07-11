"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { creerAnneeScolaire } from "./actions";
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
      {pending ? "Enregistrement…" : "Ajouter cette année"}
    </button>
  );
}

export function FormulaireNouvelleAnnee() {
  const [etat, action] = useFormState(creerAnneeScolaire, ETAT_INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!etat.erreur) {
      formRef.current?.reset();
    }
  }, [etat]);

  return (
    <div className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux">
      <p className="mb-4 text-sm font-medium text-encre">
        Ajouter une année scolaire
      </p>
      {etat.erreur && <MessageStatut type="erreur">{etat.erreur}</MessageStatut>}
      <form ref={formRef} action={action}>
        <Champ
          label="Libellé"
          id="libelle"
          type="text"
          placeholder="2026-2027"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Champ label="Date de début" id="date-debut" type="date" required />
          <Champ label="Date de fin" id="date-fin" type="date" required />
        </div>
        <BoutonEnregistrer />
      </form>
    </div>
  );
}
