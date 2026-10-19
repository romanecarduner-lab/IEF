"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Champ, MessageStatut } from "@/components/Formulaire";
import { modifierActivite, type DonneesModificationActivite } from "../../actions";
import { proposerFormulationPedagogique } from "../../nouvelle/actionsIA";
import { EtapesActivite } from "../../nouvelle/EtapesActivite";
import { SelecteurCompetences } from "../competences/SelecteurCompetences";
import { supprimerObservation } from "../competences/actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

type NoeudArbre = { id: string; parentId: string | null; type: string; libelle: string };
type Observation = { id: string; elementId: string; libelle: string; niveau: string };

/**
 * Modification d'une activite, en trois etapes comme a la creation :
 * 1. Activite  2. Competences  3. Observation.
 * Les trois etapes restent dans la page (rien n'est perdu en changeant
 * d'etape). Les competences s'enregistrent avec leur propre bouton, comme
 * avant ; le reste s'enregistre avec « Enregistrer les modifications ».
 * Ce n'est volontairement pas un <form> : le choix des competences en
 * contient un.
 */
export function FormulaireModifierActivite({
  activiteId,
  valeursInitiales,
  contextes,
  observations,
  arbre,
  niveaux,
  cycleId,
}: {
  activiteId: string;
  valeursInitiales: DonneesModificationActivite;
  contextes: { id: string; libelle: string }[];
  observations: Observation[];
  arbre: NoeudArbre[];
  niveaux: { id: string; libelle: string }[];
  cycleId: string | null;
}) {
  const router = useRouter();
  const [etape, setEtape] = useState<1 | 2 | 3>(1);
  const [donnees, setDonnees] = useState(valeursInitiales);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [chargementFormulation, setChargementFormulation] = useState(false);
  const [erreurFormulation, setErreurFormulation] = useState<string | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null);

  const competencesReliees = useMemo(
    () => observations.map((o) => o.libelle).filter(Boolean),
    [observations]
  );
  const elementsDejaObserves = useMemo(
    () => new Set(observations.map((o) => o.elementId)),
    [observations]
  );

  function modifierChamp<K extends keyof DonneesModificationActivite>(
    champ: K,
    valeur: DonneesModificationActivite[K]
  ) {
    setDonnees((precedent) => ({ ...precedent, [champ]: valeur }));
  }

  function allerEtape(n: 1 | 2 | 3) {
    setEtape(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function demanderFormulation() {
    setChargementFormulation(true);
    setErreurFormulation(null);
    try {
      const resultat = await avecDelaiMaximal(
        proposerFormulationPedagogique(
          donnees.titre,
          donnees.description,
          competencesReliees,
          undefined,
          activiteId
        ),
        55000
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

  async function retirerCompetence(id: string) {
    setSuppressionEnCours(id);
    try {
      await supprimerObservation(id, activiteId);
      router.refresh();
    } finally {
      setSuppressionEnCours(null);
    }
  }

  async function enregistrer() {
    setErreur(null);
    if (!donnees.titre.trim() || !donnees.dateActivite || !donnees.contexteId) {
      setErreur("Merci de renseigner la date, le contexte et le titre (étape 1).");
      allerEtape(1);
      return;
    }
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
    <div>
      <EtapesActivite
        etape={etape}
        onChoisir={allerEtape}
        titreOk={Boolean(donnees.titre.trim())}
        nbCompetences={observations.length}
        libelleAria="Étapes de la modification"
      />

      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}

      {/* Étape 1 : l'activité */}
      <div className={etape === 1 ? "carte p-6" : "hidden"} aria-hidden={etape !== 1}>
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
            className="champ-saisie w-full"
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
            rows={4}
            value={donnees.description}
            onChange={(e) => modifierChamp("description", e.target.value)}
            className="champ-saisie w-full"
          />
        </div>

        <Champ
          label="Lieu (facultatif)"
          id="lieu"
          type="text"
          value={donnees.lieu}
          onChange={(e) => modifierChamp("lieu", e.target.value)}
        />
      </div>

      {/* Étape 2 : les compétences */}
      <div className={etape === 2 ? "space-y-6" : "hidden"} aria-hidden={etape !== 2}>
        <div className="carte p-4">
          <p className="mb-3 text-sm font-medium text-encre">
            Déjà reliées à cette activité ({observations.length})
          </p>
          {observations.length === 0 ? (
            <p className="text-sm text-ardoise">Aucune pour l&rsquo;instant.</p>
          ) : (
            <ul className="space-y-2">
              {observations.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-start justify-between gap-2 border-b border-trait pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-encre">{o.libelle}</p>
                    {o.niveau && <p className="text-xs text-ardoise">{o.niveau}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={suppressionEnCours === o.id}
                    onClick={() => void retirerCompetence(o.id)}
                    className="min-h-[40px] px-1 text-xs text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte disabled:opacity-50"
                  >
                    {suppressionEnCours === o.id ? "Retrait…" : "Retirer"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-3 text-xs text-ardoise">
            Pour en ajouter, choisissez des compétences puis utilisez le bouton « Enregistrer » du
            choix ci-dessous : elles sont ajoutées tout de suite.
          </p>
          <SelecteurCompetences
            activiteId={activiteId}
            arbre={arbre}
            niveaux={niveaux}
            elementsDejaObserves={elementsDejaObserves}
            cycleId={cycleId}
          />
        </div>
      </div>

      {/* Étape 3 : l'observation */}
      <div className={etape === 3 ? "carte p-6" : "hidden"} aria-hidden={etape !== 3}>
        <div className="mb-4">
          <label htmlFor="observations" className="mb-1.5 block text-sm font-medium text-encre">
            Observations (facultatif)
          </label>
          <textarea
            id="observations"
            rows={4}
            value={donnees.observations}
            onChange={(e) => modifierChamp("observations", e.target.value)}
            className="champ-saisie w-full"
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
            {chargementFormulation ? "Rédaction en cours…" : "✨ Proposer une formulation pédagogique"}
          </button>
          {erreurFormulation && <p className="mt-1.5 text-xs text-alerte">{erreurFormulation}</p>}
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
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {etape > 1 && (
          <button
            type="button"
            onClick={() => allerEtape((etape - 1) as 1 | 2 | 3)}
            className="bouton-secondaire"
          >
            Précédent
          </button>
        )}
        {etape < 3 ? (
          <button
            type="button"
            onClick={() => allerEtape((etape + 1) as 1 | 2 | 3)}
            className="bouton-primaire"
          >
            {etape === 1 ? "Suivant : compétences" : "Suivant : observation"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void enregistrer()}
            disabled={chargement}
            className="bouton-primaire"
          >
            {chargement ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        )}
      </div>
      {etape < 3 && (
        <div className="mt-4 border-t border-trait/60 pt-3">
          <button
            type="button"
            onClick={() => void enregistrer()}
            disabled={chargement}
            className="min-h-[40px] text-xs text-ardoise underline underline-offset-2 hover:text-encre disabled:opacity-50"
          >
            {chargement ? "Enregistrement…" : "Enregistrer maintenant, sans finir les étapes"}
          </button>
        </div>
      )}
    </div>
  );
}
