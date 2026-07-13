"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Champ, MessageStatut } from "@/components/Formulaire";
import { creerActivite, type DonneesActivite } from "../actions";
import {
  lireBrouillon,
  sauvegarderBrouillon,
  supprimerBrouillon,
  type DonneesBrouillonActivite,
} from "@/lib/brouillonLocal";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

type Option = { id: string; libelle: string };

const DONNEES_VIDES: DonneesBrouillonActivite = {
  parcoursId: "",
  dateActivite: new Date().toISOString().slice(0, 10),
  titre: "",
  description: "",
  contexteId: "",
  lieu: "",
  observations: "",
  parolesEnfant: "",
  personnesPresentes: "",
  autonomieGeneraleId: "",
  statutCode: "brouillon",
};

function genererIdLocal(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Repli très improbable (environnements très anciens) : suffisant pour
  // un identifiant local temporaire, jamais utilisé comme clé définitive
  // en cas d'absence de crypto.randomUUID.
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function FormulaireActivite({
  parcours,
  contextes,
  autonomies,
}: {
  parcours: Option[];
  contextes: Option[];
  autonomies: Option[];
}) {
  const router = useRouter();
  const idLocalRef = useRef<string>(genererIdLocal());
  const delaiAutosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [donnees, setDonnees] = useState<DonneesBrouillonActivite>(DONNEES_VIDES);
  const [statutSync, setStatutSync] = useState<
    "aucun_changement" | "non_synchronise" | "en_cours" | "synchronise"
  >("aucun_changement");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [brouillonPropose, setBrouillonPropose] = useState<{
    idLocal: string;
    donnees: DonneesBrouillonActivite;
    sauvegardeLe: number;
  } | null>(null);

  // Au montage : un brouillon non synchronisé existe-t-il déjà (perte de
  // connexion, fermeture accidentelle) ?
  useEffect(() => {
    lireBrouillon()
      .then((brouillon) => {
        if (brouillon) setBrouillonPropose(brouillon);
      })
      .catch(() => {
        // IndexedDB indisponible (navigation privée stricte, etc.) : le
        // formulaire reste utilisable, simplement sans filet de sécurité.
      });
  }, []);

  function modifierChamp<K extends keyof DonneesBrouillonActivite>(
    champ: K,
    valeur: DonneesBrouillonActivite[K]
  ) {
    const nouvellesDonnees = { ...donnees, [champ]: valeur };
    setDonnees(nouvellesDonnees);
    setStatutSync("non_synchronise");

    if (delaiAutosaveRef.current) clearTimeout(delaiAutosaveRef.current);
    delaiAutosaveRef.current = setTimeout(() => {
      sauvegarderBrouillon(idLocalRef.current, nouvellesDonnees).catch(() => {
        // Échec silencieux de l'autosave local : ne bloque jamais la
        // saisie, le pire cas est de perdre le filet de sécurité local.
      });
    }, 600);
  }

  function restaurerBrouillon() {
    if (!brouillonPropose) return;
    idLocalRef.current = brouillonPropose.idLocal;
    setDonnees(brouillonPropose.donnees);
    setStatutSync("non_synchronise");
    setBrouillonPropose(null);
  }

  function ignorerBrouillon() {
    supprimerBrouillon().catch(() => {});
    setBrouillonPropose(null);
  }

  async function gererEnvoi(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);

    if (!donnees.parcoursId || !donnees.contexteId || !donnees.titre.trim()) {
      setErreur("Le parcours, le titre et le contexte sont requis.");
      return;
    }

    setChargement(true);
    setStatutSync("en_cours");

    const donneesEnvoyees: DonneesActivite = {
      idLocal: idLocalRef.current,
      ...donnees,
    };

    try {
      const resultat = await avecDelaiMaximal(creerActivite(donneesEnvoyees));

      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        setStatutSync("non_synchronise");
        return;
      }

      setStatutSync("synchronise");
      await supprimerBrouillon().catch(() => {});
      router.push("/journal");
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de la création de l'activité", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
      setStatutSync("non_synchronise");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div>
      {brouillonPropose && (
        <div className="mb-6 rounded-doux border border-mousse/30 bg-mousse/5 p-4 text-sm text-mousse-fonce">
          <p className="mb-2">
            Un brouillon non enregistré a été retrouvé (
            {new Date(brouillonPropose.sauvegardeLe).toLocaleString("fr-FR")}
            ).
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={restaurerBrouillon}
              className="font-medium underline underline-offset-2"
            >
              Restaurer ce brouillon
            </button>
            <button
              type="button"
              onClick={ignorerBrouillon}
              className="text-ardoise underline underline-offset-2"
            >
              Ignorer et repartir de zéro
            </button>
          </div>
        </div>
      )}

      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}

      <form
        onSubmit={gererEnvoi}
        className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux"
      >
        <div className="mb-4">
          <label
            htmlFor="parcours"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
            Enfant / année scolaire
          </label>
          <select
            id="parcours"
            required
            value={donnees.parcoursId}
            onChange={(e) => modifierChamp("parcoursId", e.target.value)}
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

        <div className="grid grid-cols-2 gap-4">
          <Champ
            label="Date"
            id="date-activite"
            type="date"
            required
            value={donnees.dateActivite}
            onChange={(e) => modifierChamp("dateActivite", e.target.value)}
          />
          <div className="mb-4">
            <label
              htmlFor="contexte"
              className="mb-1.5 block text-sm font-medium text-encre"
            >
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
        </div>

        <Champ
          label="Titre"
          id="titre"
          type="text"
          required
          placeholder="Cabane dans les bois"
          value={donnees.titre}
          onChange={(e) => modifierChamp("titre", e.target.value)}
        />

        <div className="mb-4">
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
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
          <label
            htmlFor="observations"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
            Observations (facultatif)
          </label>
          <textarea
            id="observations"
            rows={2}
            value={donnees.observations}
            onChange={(e) => modifierChamp("observations", e.target.value)}
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          />
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

        <div className="mb-4">
          <label
            htmlFor="autonomie-generale"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
            Autonomie générale (facultatif)
          </label>
          <select
            id="autonomie-generale"
            value={donnees.autonomieGeneraleId}
            onChange={(e) => modifierChamp("autonomieGeneraleId", e.target.value)}
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            <option value="">Non précisé</option>
            {autonomies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.libelle}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ardoise">
            Décrit le déroulement général de l&rsquo;activité, indépendamment
            des compétences qui seront associées plus tard.
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="statut"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
            Statut
          </label>
          <select
            id="statut"
            value={donnees.statutCode}
            onChange={(e) =>
              modifierChamp("statutCode", e.target.value as "brouillon" | "valide")
            }
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            <option value="brouillon">Brouillon</option>
            <option value="valide">Validé</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={chargement}
            className="rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
          >
            {chargement ? "Enregistrement…" : "Enregistrer l'activité"}
          </button>
          <IndicateurSynchronisation statut={statutSync} />
        </div>
      </form>
    </div>
  );
}

function IndicateurSynchronisation({
  statut,
}: {
  statut: "aucun_changement" | "non_synchronise" | "en_cours" | "synchronise";
}) {
  if (statut === "aucun_changement") return null;

  const config = {
    non_synchronise: { texte: "Brouillon non synchronisé", couleur: "text-ardoise" },
    en_cours: { texte: "Synchronisation…", couleur: "text-mousse-fonce" },
    synchronise: { texte: "Synchronisé", couleur: "text-mousse-fonce" },
  }[statut];

  return <span className={`text-xs ${config.couleur}`}>{config.texte}</span>;
}
