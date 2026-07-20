"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Champ, MessageStatut } from "@/components/Formulaire";
import { creerActivite, type DonneesActivite } from "../actions";
import { creerTrace } from "../[id]/actions";
import { creerObservations } from "../[id]/competences/actions";
import { suggererObjectifsIA, proposerFormulationPedagogique } from "./actionsIA";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { televerserFichierTrace } from "@/lib/televersementTrace";
import { estImage } from "@/lib/compressionImage";
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
  familleId,
}: {
  parcours: Option[];
  contextes: Option[];
  autonomies: Option[];
  familleId: string;
}) {
  const router = useRouter();
  const idLocalRef = useRef<string>(genererIdLocal());
  const delaiAutosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputPhotoRef = useRef<HTMLInputElement>(null);

  const [donnees, setDonnees] = useState<DonneesBrouillonActivite>(DONNEES_VIDES);
  const [statutSync, setStatutSync] = useState<
    "aucun_changement" | "non_synchronise" | "en_cours" | "synchronise"
  >("aucun_changement");
  const [chargement, setChargement] = useState(false);
  const [etapeEnvoi, setEtapeEnvoi] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [brouillonPropose, setBrouillonPropose] = useState<{
    idLocal: string;
    donnees: DonneesBrouillonActivite;
    sauvegardeLe: number;
  } | null>(null);

  const [suggestions, setSuggestions] = useState<
    { id: string; libelle: string; chemin: string | null }[]
  >([]);
  const [chargementSuggestions, setChargementSuggestions] = useState(false);
  const [suggestionsChoisies, setSuggestionsChoisies] = useState<Map<string, string>>(
    new Map()
  );
  const delaiSuggestionsRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [suggestionsIA, setSuggestionsIA] = useState<
    { id: string; libelle: string; chemin: string | null }[]
  >([]);
  const [chargementIA, setChargementIA] = useState(false);
  const [erreurIA, setErreurIA] = useState<string | null>(null);
  const [demandeIAFaite, setDemandeIAFaite] = useState(false);

  const [formulationProposee, setFormulationProposee] = useState<string | null>(null);
  const [chargementFormulation, setChargementFormulation] = useState(false);
  const [erreurFormulation, setErreurFormulation] = useState<string | null>(null);

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

  // Suggère des objectifs du programme par rapprochement de mots-clés avec
  // le titre saisi. Simple recherche lexicale, pas une IA sémantique : le
  // parent valide toujours en cochant lui-même.
  useEffect(() => {
    if (delaiSuggestionsRef.current) clearTimeout(delaiSuggestionsRef.current);

    if (donnees.titre.trim().length < 4) {
      setSuggestions([]);
      return;
    }

    delaiSuggestionsRef.current = setTimeout(async () => {
      setChargementSuggestions(true);
      try {
        const supabase = creerClientNavigateur();
        const { data } = await supabase.rpc("suggerer_objectifs_programme", {
          p_texte: donnees.titre,
        });
        setSuggestions(data ?? []);
      } finally {
        setChargementSuggestions(false);
      }
    }, 500);
  }, [donnees.titre]);

  function basculerSuggestion(id: string, libelle: string) {
    setSuggestionsChoisies((precedent) => {
      const nouveau = new Map(precedent);
      if (nouveau.has(id)) nouveau.delete(id);
      else nouveau.set(id, libelle);
      return nouveau;
    });
  }

  async function demanderSuggestionsIA() {
    if (!donnees.titre.trim()) return;
    setChargementIA(true);
    setErreurIA(null);
    setDemandeIAFaite(true);
    try {
      const resultat = await avecDelaiMaximal(
        suggererObjectifsIA(donnees.titre, donnees.description),
        20000
      );
      if ("erreur" in resultat) {
        setErreurIA(resultat.erreur);
        setSuggestionsIA([]);
        return;
      }
      setSuggestionsIA(resultat.suggestions);
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de la demande de suggestions IA", erreurInattendue);
      setErreurIA(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargementIA(false);
    }
  }

  async function demanderFormulation() {
    setChargementFormulation(true);
    setErreurFormulation(null);
    setFormulationProposee(null);
    try {
      const resultat = await avecDelaiMaximal(
        proposerFormulationPedagogique(
          donnees.titre,
          donnees.description,
          Array.from(suggestionsChoisies.values())
        ),
        20000
      );
      if ("erreur" in resultat) {
        setErreurFormulation(resultat.erreur);
        return;
      }
      setFormulationProposee(resultat.texte);
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de la demande de formulation", erreurInattendue);
      setErreurFormulation(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargementFormulation(false);
    }
  }

  function utiliserFormulation() {
    if (!formulationProposee) return;
    modifierChamp("observations", formulationProposee);
    setFormulationProposee(null);
  }

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

      const fichier = inputPhotoRef.current?.files?.[0] ?? null;
      if (fichier) {
        try {
          const supabase = creerClientNavigateur();
          const televersement = await televerserFichierTrace(
            supabase,
            familleId,
            fichier,
            setEtapeEnvoi
          );
          await creerTrace({
            activiteId: resultat.id,
            typeCode: estImage(fichier) ? "photo" : "document",
            cheminStockage: televersement.cheminStockage,
            miniatureCheminStockage: televersement.miniatureCheminStockage,
            contenuTexte: null,
            legende: "",
            dateTrace: donnees.dateActivite,
          });
        } catch (erreurPhoto) {
          console.error("Erreur lors de l'ajout de la photo", erreurPhoto);
          // L'activité est déjà enregistrée : on ne bloque jamais sur l'échec
          // de la photo, on redirige vers la fiche pour permettre de réessayer.
          router.push(`/journal/${resultat.id}`);
          router.refresh();
          setErreur(
            "L'activité a été enregistrée, mais l'ajout de la photo a échoué. Vous pouvez réessayer depuis la fiche de l'activité."
          );
          return;
        }
      }

      if (suggestionsChoisies.size > 0) {
        try {
          await creerObservations({
            activiteId: resultat.id,
            elementProgrammeIds: Array.from(suggestionsChoisies.keys()),
            niveauAutonomieId: donnees.autonomieGeneraleId || autonomies[0]?.id || "",
            justification: "",
            commentairePedagogique: "",
          });
        } catch (erreurCompetences) {
          console.error(
            "Erreur lors de l'enregistrement des compétences suggérées",
            erreurCompetences
          );
          // Non bloquant : l'activité (et la photo éventuelle) restent
          // enregistrées ; les compétences pourront être ajoutées depuis la
          // fiche de l'activité.
        }
      }

      router.push(fichier || suggestionsChoisies.size > 0 ? `/journal/${resultat.id}` : "/journal");
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de la création de l'activité", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
      setStatutSync("non_synchronise");
    } finally {
      setChargement(false);
      setEtapeEnvoi(null);
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

        {chargementSuggestions && (
          <p className="mb-4 -mt-2 text-xs text-ardoise">Recherche de compétences…</p>
        )}

        {!chargementSuggestions && suggestions.length > 0 && (
          <div className="mb-4 -mt-2 rounded-doux border border-mousse/30 bg-mousse/5 p-3">
            <p className="mb-2 text-xs font-medium text-mousse-fonce">
              Compétences qui pourraient correspondre (rapprochement par
              mots-clés — à vous de valider) :
            </p>
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <label className="flex items-start gap-2 text-sm text-encre">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={suggestionsChoisies.has(s.id)}
                      onChange={() => basculerSuggestion(s.id, s.libelle)}
                    />
                    <span>
                      {s.libelle}
                      {s.chemin && (
                        <span className="block text-xs text-ardoise">{s.chemin}</span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {suggestionsChoisies.size > 0 && (
              <p className="mt-2 text-xs text-mousse-fonce">
                {suggestionsChoisies.size} compétence(s) sera(ont) enregistrée(s)
                avec cette activité.
              </p>
            )}
          </div>
        )}

        <div className="mb-4 -mt-2">
          <button
            type="button"
            onClick={demanderSuggestionsIA}
            disabled={chargementIA || !donnees.titre.trim()}
            className="text-xs font-medium text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chargementIA ? "L'IA réfléchit…" : "✨ Demander des suggestions à l'IA"}
          </button>

          {erreurIA && (
            <p className="mt-1.5 text-xs text-alerte">{erreurIA}</p>
          )}

          {!chargementIA && demandeIAFaite && !erreurIA && suggestionsIA.length === 0 && (
            <p className="mt-1.5 text-xs text-ardoise">
              L&rsquo;IA n&rsquo;a trouvé aucun objectif clairement lié.
            </p>
          )}

          {suggestionsIA.length > 0 && (
            <div className="mt-2 rounded-doux border border-argile/30 bg-argile/5 p-3">
              <p className="mb-2 text-xs font-medium text-encre">
                Suggestions de l&rsquo;IA (à valider) :
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {suggestionsIA.map((s) => (
                  <li key={s.id}>
                    <label className="flex items-start gap-2 text-sm text-encre">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={suggestionsChoisies.has(s.id)}
                        onChange={() => basculerSuggestion(s.id, s.libelle)}
                      />
                      <span>
                        {s.libelle}
                        {s.chemin && (
                          <span className="block text-xs text-ardoise">{s.chemin}</span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

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

          <button
            type="button"
            onClick={demanderFormulation}
            disabled={chargementFormulation || suggestionsChoisies.size === 0}
            title={
              suggestionsChoisies.size === 0
                ? "Sélectionnez d'abord au moins une compétence"
                : undefined
            }
            className="mt-1.5 text-xs font-medium text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chargementFormulation
              ? "L'IA rédige…"
              : "✨ Proposer une formulation pédagogique"}
          </button>

          {erreurFormulation && (
            <p className="mt-1.5 text-xs text-alerte">{erreurFormulation}</p>
          )}

          {formulationProposee && (
            <div className="mt-2 rounded-doux border border-mousse/30 bg-mousse/5 p-3">
              <p className="mb-2 text-sm text-encre">{formulationProposee}</p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={utiliserFormulation}
                  className="text-xs font-medium text-mousse-fonce underline underline-offset-2"
                >
                  Utiliser ce texte
                </button>
                <button
                  type="button"
                  onClick={() => setFormulationProposee(null)}
                  className="text-xs text-ardoise underline underline-offset-2"
                >
                  Ignorer
                </button>
              </div>
            </div>
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
            htmlFor="photo"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
            Photo ou document (facultatif)
          </label>
          <input
            ref={inputPhotoRef}
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,.docx"
            className="w-full text-sm text-encre"
          />
          <p className="mt-1.5 text-xs text-ardoise">
            Ajoutée automatiquement comme première trace de l&rsquo;activité.
            D&rsquo;autres traces pourront être ajoutées ensuite depuis la
            fiche de l&rsquo;activité.
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
            {chargement ? etapeEnvoi ?? "Enregistrement…" : "Enregistrer l'activité"}
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
