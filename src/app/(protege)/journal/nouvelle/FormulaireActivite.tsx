"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Champ, MessageStatut } from "@/components/Formulaire";
import { creerActivite, dupliquerActiviteVersParcours, type DonneesActivite } from "../actions";
import { creerTrace } from "../[id]/actions";
import { creerObservations } from "../[id]/competences/actions";
import { genererDescriptionEtCompetencesIA, proposerFormulationPedagogique } from "./actionsIA";
import { preparerImage, estImage } from "@/lib/compressionImage";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { televerserFichierTrace } from "@/lib/televersementTrace";
import {
  lireBrouillon,
  sauvegarderBrouillon,
  supprimerBrouillon,
  type DonneesBrouillonActivite,
} from "@/lib/brouillonLocal";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";
import { RechercheCompetences } from "./RechercheCompetences";
import { declencherEstimationArrierePlan } from "@/lib/estimationArrierePlan";

type Option = { id: string; libelle: string };
type OptionParcours = Option & {
  prenomEnfant: string;
  cycleId: string;
  enfantId: string;
  dateDebutAnnee: string;
  dateFinAnnee: string;
};

// Meme si plus de photos sont selectionnees pour l'activite (toutes
// seront quand meme ajoutees comme traces), seules les premieres sont
// envoyees a l'IA -- au-dela, la requete devient trop lourde et l'IA
// finit par echouer silencieusement.
const NB_MAX_PHOTOS_IA = 6;

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
  prerempli,
}: {
  parcours: OptionParcours[];
  contextes: Option[];
  autonomies: Option[];
  familleId: string;
  prerempli?: {
    titre: string;
    description: string;
    parcoursId: string;
    objectifId: string;
    objectifLibelle: string;
  };
}) {
  const router = useRouter();
  const idLocalRef = useRef<string>(genererIdLocal());
  const delaiAutosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputPhotoRef = useRef<HTMLInputElement>(null);
  const erreurRef = useRef<HTMLDivElement>(null);

  // Parcours par defaut si un seul enfant existe dans le foyer -- celui
  // dont l'annee couvre la date du jour, comme dans le selecteur
  // d'enfant ci-dessous, pour que la presequence corresponde a ce qui
  // sera reellement affiche.
  const enfantsDistincts = new Set(parcours.map((p) => p.enfantId));
  const parcoursParDefaut =
    enfantsDistincts.size === 1
      ? parcours.reduce<OptionParcours | undefined>((retenu, p) => {
          const aujourdhui = new Date().toISOString().slice(0, 10);
          const correspondAujourdhui =
            p.dateDebutAnnee &&
            p.dateFinAnnee &&
            aujourdhui >= p.dateDebutAnnee &&
            aujourdhui <= p.dateFinAnnee;
          if (!retenu || correspondAujourdhui) return p;
          return retenu;
        }, undefined)
      : undefined;

  const [donnees, setDonnees] = useState<DonneesBrouillonActivite>(() => {
    if (prerempli?.titre) {
      return {
        ...DONNEES_VIDES,
        titre: prerempli.titre,
        description: prerempli.description,
        parcoursId: prerempli.parcoursId || parcoursParDefaut?.id || "",
      };
    }
    return parcoursParDefaut
      ? { ...DONNEES_VIDES, parcoursId: parcoursParDefaut.id }
      : DONNEES_VIDES;
  });
  const [suggestionsChoisies, setSuggestionsChoisies] = useState<Map<string, string>>(() =>
    prerempli?.objectifId && prerempli.objectifLibelle
      ? new Map([[prerempli.objectifId, prerempli.objectifLibelle]])
      : new Map()
  );
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
  const [niveauCompetencesId, setNiveauCompetencesId] = useState(autonomies[0]?.id ?? "");
  const [niveauParCompetence, setNiveauParCompetence] = useState<Map<string, string>>(new Map());
  const delaiSuggestionsRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [suggestionsIA, setSuggestionsIA] = useState<
    { id: string; libelle: string; chemin: string | null }[]
  >([]);
  const [demandeIAFaite, setDemandeIAFaite] = useState(false);

  const [chargementDescriptionIA, setChargementDescriptionIA] = useState(false);
  const [nbPhotosSelectionnees, setNbPhotosSelectionnees] = useState(0);
  const [noteAnneeAjustee, setNoteAnneeAjustee] = useState<string | null>(null);
  const [erreurAucunParcoursPourDate, setErreurAucunParcoursPourDate] = useState<string | null>(
    null
  );

  // L'annee scolaire doit toujours correspondre a la date reelle de
  // l'activite (1er septembre au 31 aout suivant), pas au parcours
  // choisi manuellement : des qu'une date sort de la plage de l'annee
  // actuellement selectionnee, on bascule automatiquement vers le bon
  // parcours du MEME enfant, sans jamais changer d'enfant tout seul.
  // Si aucun parcours n'existe pour cet enfant sur la bonne annee, on
  // previent clairement plutot que de deviner ou de bloquer en silence.
  useEffect(() => {
    if (!donnees.parcoursId || !donnees.dateActivite) {
      setNoteAnneeAjustee(null);
      setErreurAucunParcoursPourDate(null);
      return;
    }
    const actuel = parcours.find((p) => p.id === donnees.parcoursId);
    if (!actuel || !actuel.dateDebutAnnee || !actuel.dateFinAnnee) return;

    const dateOk =
      donnees.dateActivite >= actuel.dateDebutAnnee && donnees.dateActivite <= actuel.dateFinAnnee;
    if (dateOk) {
      setNoteAnneeAjustee(null);
      setErreurAucunParcoursPourDate(null);
      return;
    }

    const bonParcours = parcours.find(
      (p) =>
        p.enfantId === actuel.enfantId &&
        p.dateDebutAnnee &&
        p.dateFinAnnee &&
        donnees.dateActivite >= p.dateDebutAnnee &&
        donnees.dateActivite <= p.dateFinAnnee
    );

    if (bonParcours) {
      setDonnees((precedent) => ({ ...precedent, parcoursId: bonParcours.id }));
      setNoteAnneeAjustee(
        `Année scolaire ajustée automatiquement d'après la date (${bonParcours.libelle}).`
      );
      setErreurAucunParcoursPourDate(null);
    } else {
      setErreurAucunParcoursPourDate(
        `Aucune année scolaire n'existe pour ${actuel.prenomEnfant} couvrant cette date. Créez-la depuis "Famille" avant d'enregistrer, sinon l'activité restera classée dans "${actuel.libelle}".`
      );
      setNoteAnneeAjustee(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donnees.dateActivite, donnees.parcoursId]);
  const [autresEnfantsChoisis, setAutresEnfantsChoisis] = useState<Set<string>>(new Set());
  const [erreurDescriptionIA, setErreurDescriptionIA] = useState<string | null>(null);

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
        const cycleId = parcours.find((p) => p.id === donnees.parcoursId)?.cycleId;
        const { data } = await supabase.rpc("suggerer_objectifs_programme", {
          p_texte: donnees.titre,
          p_cycle_id: cycleId ?? null,
        });
        setSuggestions(data ?? []);
      } finally {
        setChargementSuggestions(false);
      }
    }, 500);
  }, [donnees.titre, donnees.parcoursId, parcours]);

  function basculerSuggestion(id: string, libelle: string) {
    setSuggestionsChoisies((precedent) => {
      const nouveau = new Map(precedent);
      if (nouveau.has(id)) nouveau.delete(id);
      else nouveau.set(id, libelle);
      return nouveau;
    });
    setNiveauParCompetence((precedent) => {
      if (!precedent.has(id)) return precedent;
      const nouveau = new Map(precedent);
      nouveau.delete(id);
      return nouveau;
    });
  }

  function arrayBufferVersBase64(buffer: ArrayBuffer): string {
    let binaire = "";
    const octets = new Uint8Array(buffer);
    for (let i = 0; i < octets.byteLength; i++) binaire += String.fromCharCode(octets[i] ?? 0);
    return btoa(binaire);
  }

  async function demanderDescriptionEtCompetencesIA() {
    if (!donnees.titre.trim()) return;
    setChargementDescriptionIA(true);
    setErreurDescriptionIA(null);
    setDemandeIAFaite(true);
    try {
      const fichiers = Array.from(inputPhotoRef.current?.files ?? []).filter(estImage);
      const fichiersPourIA = fichiers.slice(0, NB_MAX_PHOTOS_IA);
      const images = await Promise.all(
        fichiersPourIA.map(async (fichier) => {
          const { miniature } = await preparerImage(fichier);
          return {
            base64: arrayBufferVersBase64(await miniature.arrayBuffer()),
            mediaType: "image/jpeg",
          };
        })
      );

      const prenomEnfant =
        parcours.find((p) => p.id === donnees.parcoursId)?.prenomEnfant ?? "";

      const resultat = await avecDelaiMaximal(
        genererDescriptionEtCompetencesIA(
          donnees.titre,
          prenomEnfant,
          images,
          donnees.parcoursId,
          donnees.description
        ),
        45000
      );
      if ("erreur" in resultat) {
        setErreurDescriptionIA(resultat.erreur);
        return;
      }
      modifierChamp("description", resultat.description);
      setSuggestionsIA(resultat.suggestions);
    } catch (erreurInattendue) {
      console.error(
        "Erreur lors de la génération de la description et des compétences IA",
        erreurInattendue
      );
      setErreurDescriptionIA(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargementDescriptionIA(false);
    }
  }

  async function demanderFormulation() {
    setChargementFormulation(true);
    setErreurFormulation(null);
    try {
      const resultat = await avecDelaiMaximal(
        proposerFormulationPedagogique(
          donnees.titre,
          donnees.description,
          Array.from(suggestionsChoisies.values()),
          donnees.parcoursId
        ),
        55000
      );
      if ("erreur" in resultat) {
        setErreurFormulation(resultat.erreur);
        return;
      }
      modifierChamp("observations", resultat.texte);
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de la demande de formulation", erreurInattendue);
      setErreurFormulation(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargementFormulation(false);
    }
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

    const champsManquants: string[] = [];
    if (!donnees.parcoursId) champsManquants.push("l'enfant / l'année");
    if (!donnees.contexteId) champsManquants.push("le contexte");
    if (!donnees.titre.trim()) champsManquants.push("le titre");

    if (champsManquants.length > 0) {
      const liste =
        champsManquants.length === 1
          ? champsManquants[0]
          : `${champsManquants.slice(0, -1).join(", ")} et ${champsManquants.at(-1)}`;
      setErreur(`Il manque : ${liste}.`);
      erreurRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (erreurAucunParcoursPourDate) {
      setErreur(erreurAucunParcoursPourDate);
      erreurRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
        erreurRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      setStatutSync("synchronise");
      await supprimerBrouillon().catch(() => {});

      const fichiers = Array.from(inputPhotoRef.current?.files ?? []);
      if (fichiers.length > 1) setEtapeEnvoi(`Envoi de ${fichiers.length} photos…`);
      // Plusieurs photos sont envoyees en parallele, pas l'une apres
      // l'autre : chaque photo est independante (son propre fichier,
      // son propre identifiant), contrairement aux competences qui elles
      // doivent rester sequentielles pour eviter tout conflit en base --
      // ici, paralleliser est sans risque et nettement plus rapide.
      const resultatsPhotos = await Promise.all(
        fichiers.map(async (fichier) => {
          try {
            const supabase = creerClientNavigateur();
            // Delai maximal plus genereux que le defaut (envoi de
            // fichier, potentiellement plus long qu'un simple appel
            // serveur), mais jamais illimite : sans ca, un reseau
            // capricieux pouvait laisser le bouton bloque indefiniment
            // sur "Envoi de l'image...", sans jamais echouer ni
            // reussir -- poussant a renvoyer tout le formulaire et
            // creer une activite en double.
            const televersement = await avecDelaiMaximal(
              televerserFichierTrace(
                supabase,
                familleId,
                fichier,
                fichiers.length === 1 ? setEtapeEnvoi : undefined
              ),
              60000
            );
            await avecDelaiMaximal(
              creerTrace({
                activiteId: resultat.id,
                typeCode: estImage(fichier) ? "photo" : "document",
                cheminStockage: televersement.cheminStockage,
                miniatureCheminStockage: televersement.miniatureCheminStockage,
                contenuTexte: null,
                legende: "",
                dateTrace: donnees.dateActivite,
              })
            );
            return { ok: true as const };
          } catch (erreurPhoto) {
            console.error("Erreur lors de l'ajout d'une photo", erreurPhoto);
            return { ok: false as const };
          }
        })
      );
      const auMoinsUneErreurPhoto = resultatsPhotos.some((r) => !r.ok);
      if (auMoinsUneErreurPhoto) {
        // L'activité est déjà enregistrée : on ne bloque jamais sur l'échec
        // d'une photo, on redirige vers la fiche pour permettre de réessayer.
        router.push(`/journal/${resultat.id}`);
        router.refresh();
        setErreur(
          "L'activité a été enregistrée, mais au moins une photo n'a pas pu être ajoutée. Vous pouvez réessayer depuis la fiche de l'activité."
        );
        return;
      }

      if (suggestionsChoisies.size > 0) {
        setEtapeEnvoi("Enregistrement des compétences…");
        try {
          await avecDelaiMaximal(
            creerObservations({
              activiteId: resultat.id,
              elements: Array.from(suggestionsChoisies.keys()).map((id) => ({
                id,
                niveauAutonomieId: niveauParCompetence.get(id) || niveauCompetencesId || autonomies[0]?.id || "",
              })),
              justification: "",
              commentairePedagogique: "",
            }),
            30000
          );
          // Statuts automatiques calcules en arriere-plan : on ne fait pas
          // attendre, l'activite est deja enregistree.
          declencherEstimationArrierePlan(resultat.id);
        } catch (erreurCompetences) {
          console.error(
            "Erreur lors de l'enregistrement des compétences suggérées",
            erreurCompetences
          );
          // Non bloquant : l'activité (et les photos) restent enregistrées ;
          // les compétences pourront être ajoutées depuis la fiche.
        }
      }

      // Duplication vers les autres enfants coches ("Concerne aussi").
      const enfantsCibles = Array.from(autresEnfantsChoisis);

      const idsActivitesCreees: string[] = [resultat.id];
      const echecs: string[] = [];

      if (enfantsCibles.length > 0) {
        const resultats = await Promise.all(
          enfantsCibles.map(async (enfantCibleId) => {
            const prenom = parcours.find((p) => p.enfantId === enfantCibleId)?.prenomEnfant;
            try {
              const r = await avecDelaiMaximal(
                dupliquerActiviteVersParcours(resultat.id, enfantCibleId),
                20000
              );
              return { enfantCibleId, prenom, r };
            } catch (erreurInattendue) {
              console.error("Erreur lors de la duplication vers un autre enfant", erreurInattendue);
              return { enfantCibleId, prenom, r: { erreur: messagePourErreurInattendue(erreurInattendue) } };
            }
          })
        );

        for (const { prenom, r } of resultats) {
          if ("erreur" in r) {
            echecs.push(prenom ?? "un enfant");
          } else {
            idsActivitesCreees.push(r.id);
          }
        }
      }

      // Un echec de duplication ne doit jamais etre presente comme un
      // succes complet : on reste sur la page et on le dit clairement,
      // plutot que de rediriger comme si tout s'etait bien passe.
      if (echecs.length > 0) {
        setErreur(
          `L'activité a bien été enregistrée, mais la copie a échoué pour : ${echecs.join(
            ", "
          )}. Vous pouvez réessayer depuis la fiche de l'activité, avec "Dupliquer pour un autre enfant".`
        );
        erreurRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        router.refresh();
        return;
      }

      if (idsActivitesCreees.length > 1) {
        router.push(`/journal/nouvelle/recapitulatif?ids=${idsActivitesCreees.join(",")}`);
      } else {
        router.push(`/journal/${resultat.id}`);
      }
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de la création de l'activité", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
      setStatutSync("non_synchronise");
      erreurRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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

      {erreur && (
        <div ref={erreurRef}>
          <MessageStatut type="erreur">{erreur}</MessageStatut>
        </div>
      )}

      <form
        onSubmit={gererEnvoi}
        className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux"
      >
        <div className="mb-4">
          <label
            htmlFor="parcours"
            className="mb-1.5 block text-sm font-medium text-encre"
          >
            Enfant
          </label>
          <select
            id="parcours"
            required
            value={donnees.parcoursId}
            onChange={(e) => modifierChamp("parcoursId", e.target.value)}
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            <option value="">Sélectionner…</option>
            {Array.from(
              parcours.reduce((carte, p) => {
                const aujourdhui = new Date().toISOString().slice(0, 10);
                const correspondAujourdhui =
                  p.dateDebutAnnee &&
                  p.dateFinAnnee &&
                  aujourdhui >= p.dateDebutAnnee &&
                  aujourdhui <= p.dateFinAnnee;
                const dejaRetenu = carte.get(p.enfantId);
                // Retient de preference le parcours dont l'annee couvre la
                // date du jour, pour eviter un ajustement automatique
                // visible juste apres la selection de l'enfant.
                if (!dejaRetenu || correspondAujourdhui) carte.set(p.enfantId, p);
                return carte;
              }, new Map<string, (typeof parcours)[number]>())
            ).map(([enfantId, p]) => (
              <option key={enfantId} value={p.id}>
                {p.prenomEnfant}
              </option>
            ))}
          </select>
        </div>

        {(() => {
          const enfantIdActuel = parcours.find((p) => p.id === donnees.parcoursId)?.enfantId;
          const autresEnfants = Array.from(
            new Map(
              parcours
                .filter((p) => p.enfantId !== enfantIdActuel)
                .map((p) => [p.enfantId, p])
            ).values()
          );
          if (autresEnfants.length === 0) return null;
          return (
            <div className="mb-4">
              <p className="mb-1.5 text-sm font-medium text-encre">
                Concerne aussi (facultatif)
              </p>
              <p className="mb-2 text-xs text-ardoise">
                Une copie sera créée pour chaque enfant coché (sur son
                année correspondant à la date ci-dessous) — même titre,
                description et photos, mais des compétences et une
                observation à choisir séparément pour chacun.
              </p>
              <div className="space-y-1.5">
                {autresEnfants.map((p) => (
                  <label key={p.enfantId} className="flex items-center gap-2 text-sm text-encre">
                    <input
                      type="checkbox"
                      checked={autresEnfantsChoisis.has(p.enfantId)}
                      onChange={() =>
                        setAutresEnfantsChoisis((precedent) => {
                          const suivant = new Set(precedent);
                          if (suivant.has(p.enfantId)) suivant.delete(p.enfantId);
                          else suivant.add(p.enfantId);
                          return suivant;
                        })
                      }
                    />
                    {p.prenomEnfant}
                  </label>
                ))}
              </div>
            </div>
          );
        })()}

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

        {noteAnneeAjustee && (
          <p className="mb-4 rounded-doux bg-mousse/10 px-3 py-2 text-xs text-mousse-fonce">
            {noteAnneeAjustee}
          </p>
        )}
        {erreurAucunParcoursPourDate && (
          <p className="mb-4 rounded-doux bg-argile/10 px-3 py-2 text-xs text-argile">
            {erreurAucunParcoursPourDate}
          </p>
        )}

        <Champ
          label="Titre"
          id="titre"
          type="text"
          required
          placeholder="Cabane dans les bois"
          value={donnees.titre}
          onChange={(e) => modifierChamp("titre", e.target.value)}
        />

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
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,.docx"
            onChange={(e) => {
              setErreurDescriptionIA(null);
              setNbPhotosSelectionnees(Array.from(e.target.files ?? []).filter(estImage).length);
            }}
            className="w-full text-sm text-encre"
          />
          <p className="mt-1.5 text-xs text-ardoise">
            Ajoutées automatiquement comme premières traces de
            l&rsquo;activité (plusieurs fichiers possibles). D&rsquo;autres
            traces pourront être ajoutées ensuite depuis la fiche de
            l&rsquo;activité.
          </p>
        </div>

        <div className="mb-6 border-t border-trait pt-5">
          <p className="mb-1 text-sm font-medium text-encre">
            Compétences du programme
          </p>
          <p className="mb-3 text-xs text-ardoise">
            Pour relier cette activité aux compétences officielles qu&rsquo;elle
            pourrait développer — ce sont des propositions, à vous de
            cocher, décocher ou ajuster celles qui conviennent vraiment.
            Vous restez seule ou seul responsable du suivi pédagogique
            de votre enfant.
          </p>

          {donnees.parcoursId ? (
            <RechercheCompetences
              cycleId={parcours.find((p) => p.id === donnees.parcoursId)?.cycleId ?? null}
              selection={suggestionsChoisies}
              onToggle={basculerSuggestion}
            />
          ) : (
            <p className="mb-4 text-xs text-ardoise">
              Choisissez d&rsquo;abord l&rsquo;enfant ci-dessus pour pouvoir
              chercher une compétence.
            </p>
          )}
        </div>

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
          </div>
        )}

        <div className="mb-4 -mt-2">
          <button
            type="button"
            onClick={demanderDescriptionEtCompetencesIA}
            disabled={chargementDescriptionIA || !donnees.titre.trim()}
            className="text-xs font-medium text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chargementDescriptionIA
              ? "Analyse en cours…"
              : "✨ Décrire l'activité et identifier les compétences (photo + attendus)"}
          </button>
          <p className="mt-1 text-xs text-ardoise">
            Regarde le titre, la ou les photo(s) et ce que vous avez déjà
            écrit dans la description pour la compléter, puis propose
            directement les compétences officielles concernées — en une
            seule fois.
            {nbPhotosSelectionnees > NB_MAX_PHOTOS_IA && (
              <>
                {" "}
                Seules les {NB_MAX_PHOTOS_IA} premières photos sont
                analysées (les autres seront quand même
                ajoutées à l&rsquo;activité).
              </>
            )}
          </p>

          {erreurDescriptionIA && (
            <p className="mt-1.5 text-xs text-alerte">{erreurDescriptionIA}</p>
          )}

          {!chargementDescriptionIA &&
            demandeIAFaite &&
            !erreurDescriptionIA &&
            suggestionsIA.length === 0 && (
              <p className="mt-1.5 text-xs text-ardoise">
                Aucun objectif clairement lié n&rsquo;a été trouvé.
              </p>
            )}

          {suggestionsIA.length > 0 && (
            <div className="mt-2 rounded-doux border border-argile/30 bg-argile/5 p-3">
              <p className="mb-2 text-xs font-medium text-encre">
                Suggestions (à valider) :
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

        {suggestionsChoisies.size > 0 && (
          <div className="mb-4 rounded-doux border border-trait bg-white/60 p-3">
            <p className="mb-2 text-xs font-medium text-encre">
              Compétence{suggestionsChoisies.size > 1 ? "s" : ""} sélectionnée
              {suggestionsChoisies.size > 1 ? "s" : ""} — sera
              {suggestionsChoisies.size > 1 ? "ont" : ""} enregistrée
              {suggestionsChoisies.size > 1 ? "s" : ""} avec cette activité :
            </p>
            <ul className="mb-3 space-y-2">
              {Array.from(suggestionsChoisies.entries()).map(([id, libelle]) => (
                <li key={id} className="rounded-doux border border-trait bg-white p-2.5">
                  <label className="flex items-start gap-2 text-sm text-encre">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked
                      onChange={() => basculerSuggestion(id, libelle)}
                    />
                    <span>{libelle}</span>
                  </label>
                  <select
                    value={niveauParCompetence.get(id) ?? niveauCompetencesId}
                    onChange={(e) =>
                      setNiveauParCompetence((precedent) => {
                        const nouveau = new Map(precedent);
                        nouveau.set(id, e.target.value);
                        return nouveau;
                      })
                    }
                    className="mt-1.5 ml-6 w-[calc(100%-1.5rem)] rounded-doux border border-trait bg-white px-2.5 py-1.5 text-xs text-encre focus:border-mousse focus:outline-none"
                  >
                    {autonomies.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.libelle}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ardoise">
              Décrit comment l&rsquo;enfant a mobilisé chaque compétence
              précisément — peut différer d&rsquo;une compétence à
              l&rsquo;autre dans la même activité.
            </p>
          </div>
        )}

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
              ? "Rédaction en cours…"
              : "✨ Proposer une formulation pédagogique"}
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
