"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { creerParcours } from "./actions";
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
      {pending ? "Enregistrement…" : "Créer ce parcours"}
    </button>
  );
}

export function FormulaireNouveauParcours({
  enfants,
  annees,
  cycles,
}: {
  enfants: { id: string; prenom: string }[];
  annees: { id: string; libelle: string }[];
  cycles: { id: string; libelle: string }[];
}) {
  const [etat, action] = useFormState(creerParcours, ETAT_INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!etat.erreur) {
      formRef.current?.reset();
    }
  }, [etat]);

  const impossible = enfants.length === 0 || annees.length === 0;

  return (
    <div className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux">
      <p className="mb-4 text-sm font-medium text-encre">
        Créer un parcours scolaire
      </p>

      {impossible && (
        <MessageStatut type="erreur">
          Il faut d&rsquo;abord au moins un enfant et une année scolaire
          enregistrés.
        </MessageStatut>
      )}
      {etat.erreur && <MessageStatut type="erreur">{etat.erreur}</MessageStatut>}

      <form ref={formRef} action={action}>
        <div className="mb-4">
          <label
            htmlFor="enfant_id"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
            Enfant
          </label>
          <select
            id="enfant_id"
            name="enfant_id"
            required
            disabled={impossible}
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            <option value="">Sélectionner…</option>
            {enfants.map((enfant) => (
              <option key={enfant.id} value={enfant.id}>
                {enfant.prenom}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="annee_scolaire_id"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
            Année scolaire
          </label>
          <select
            id="annee_scolaire_id"
            name="annee_scolaire_id"
            required
            disabled={impossible}
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            <option value="">Sélectionner…</option>
            {annees.map((annee) => (
              <option key={annee.id} value={annee.id}>
                {annee.libelle}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="cycle_id"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
            Cycle
          </label>
          <select
            id="cycle_id"
            name="cycle_id"
            required
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.libelle}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ardoise">
            Cycle du programme officiel (École maternelle).
          </p>
        </div>

        <Champ
          label="Niveau indicatif (facultatif)"
          id="niveau_indicatif"
          type="text"
          placeholder="Grande section"
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
            rows={2}
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>

        <BoutonEnregistrer />
      </form>
    </div>
  );
}
