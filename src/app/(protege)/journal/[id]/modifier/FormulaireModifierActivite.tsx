"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Champ, MessageStatut } from "@/components/Formulaire";
import { modifierActivite, type DonneesModificationActivite } from "../../actions";
import { proposerFormulationPedagogique } from "../../nouvelle/actionsIA";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function FormulaireModifierActivite({
  activiteId,
  valeursInitiales,
  contextes,
  competencesReliees,
}: {
  activiteId: string;
  valeursInitiales: DonneesModificationActivite;
  contextes: { id: string; libelle: string }[];
  competencesReliees: string[];
}) {
  const router = useRouter();
  const [donnees, setDonnees] = useState(valeursInitiales);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [chargementFormulation, setChargementFormulation] = useState(false);
  const [erreurFormulation, setErreurFormulation] = useState<string | null>(null);

  function modifierChamp<K extends keyof DonneesModificationActivite>(
    champ: K,
    valeur: DonneesModificationActivite[K]
  ) {
    setDonnees((precedent) => ({ ...precedent, [champ]: valeur }));
  }

  async function demanderFormulation() {
    setChargementFormulation(true);
    setErreurFormulation(null);
    try {
      const resultat = await avecDelaiMaximal(
        proposerFormulationPedagogique(donnees.titre, donnees.description, competencesReliees),
        20000
      );
      if ("erreur" in resultat) {
        setErreurFormulation(resultat.erreur);
        return;
      }
      modifierChamp("observations", resultat.texte);
    } catch (erreurInattendue) {
      console.error("Erreur lors de la génération de la formulation", erreurInattendue);
      setErreurFormulation(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargementFormulation(false);
    }
  }

  async function gererEnvoi(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const resultat = await avecDelaiMaximal(modifierActivite(activiteId, donnees));
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      router.push(`/journal/${activiteId}`);
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors de la modification de l'activité", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargement(false);
    }
  }

  return (
    <form
      onSubmit={gererEnvoi}
      className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux"
    >
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}

      <Champ
        label="Date"
        id="date-activite"
        type="date"
        required
        value={donnees.dateActivite}
        onChange={(e) => modifierChamp("dateActivite", e.target.value)}
      />

      <div className="mb-4">
        <label htmlFor="contexte" className="mb-1.5 block text-sm font-medium text-encre">
          Contexte
        </label>
        <select
          id="contexte"
          required
          value={donnees.contexteId}
          onChange={(e) => modifierChamp("contexteId", e.target.value)}
          className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
        >
          <option value="">Sélectionner…</option>
          {contextes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.libelle}
            </option>
          ))}
        </select>
      </div>

      <Champ
        label="Titre"
        id="titre"
        type="text"
        required
        value={donnees.titre}
        onChange={(e) => modifierChamp("titre", e.target.value)}
      />

      <div className="mb-4">
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-encre">
          Description libre
        </label>
        <textarea
          id="description"
          rows={3}
          value={donnees.description}
          onChange={(e) => modifierChamp("description", e.target.value)}
          className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
        />
      </div>

      <Champ
        label="Lieu (facultatif)"
        id="lieu"
        type="text"
        value={donnees.lieu}
        onChange={(e) => modifierChamp("lieu", e.target.value)}
      />

      <div className="mb-4">
        <label htmlFor="observations" className="mb-1.5 block text-sm font-medium text-encre">
          Observations (facultatif)
        </label>
        <textarea
          id="observations"
          rows={3}
          value={donnees.observations}
          onChange={(e) => modifierChamp("observations", e.target.value)}
          className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
        />
        <button
          type="button"
          onClick={demanderFormulation}
          disabled={chargementFormulation || competencesReliees.length === 0}
          title={
            competencesReliees.length === 0
              ? "Reliez d'abord au moins une compétence à cette activité"
              : undefined
          }
          className="mt-1.5 text-xs font-medium text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse disabled:cursor-not-allowed disabled:opacity-50"
        >
          {chargementFormulation ? "L'IA rédige…" : "✨ Proposer une formulation pédagogique"}
        </button>
        {erreurFormulation && (
          <p className="mt-1.5 text-xs text-alerte">{erreurFormulation}</p>
        )}
      </div>

      <Champ
        label="Paroles exactes de l'enfant (facultatif)"
        id="paroles-enfant"
        type="text"
        value={donnees.parolesEnfant}
        onChange={(e) => modifierChamp("parolesEnfant", e.target.value)}
      />

      <Champ
        label="Personnes présentes (facultatif)"
        id="personnes-presentes"
        type="text"
        value={donnees.personnesPresentes}
        onChange={(e) => modifierChamp("personnesPresentes", e.target.value)}
      />

      <button
        type="submit"
        disabled={chargement}
        className="mt-2 rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {chargement ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
