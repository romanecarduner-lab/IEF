"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { declencherEstimationArrierePlan } from "@/lib/estimationArrierePlan";
import { creerObservations } from "./actions";
import { trouverJumelles } from "../../jumellesActions";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";
import { MessageStatut } from "@/components/Formulaire";
import { ExemplesReussite } from "./ExemplesReussite";

type NoeudArbre = { id: string; parentId: string | null; type: string; libelle: string };
type Objectif = { id: string; libelle: string; groupe: string | null };
type ResultatRecherche = { id: string; libelle: string; chemin: string | null };
type NiveauAutonomie = { id: string; libelle: string };

export function SelecteurCompetences({
  activiteId,
  arbre,
  niveaux,
  elementsDejaObserves,
  cycleId,
}: {
  activiteId: string;
  arbre: NoeudArbre[];
  niveaux: NiveauAutonomie[];
  elementsDejaObserves: Set<string>;
  cycleId: string | null;
}) {
  const router = useRouter();

  // id -> libellé : une seule source de vérité pour la sélection, peu
  // importe qu'elle vienne de la recherche ou de la navigation en cascade.
  const [selection, setSelection] = useState<Map<string, string>>(new Map());

  // --- Recherche libre ---
  const [termeRecherche, setTermeRecherche] = useState("");
  const [resultatsRecherche, setResultatsRecherche] = useState<ResultatRecherche[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const delaiRechercheRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (delaiRechercheRef.current) clearTimeout(delaiRechercheRef.current);
    if (termeRecherche.trim().length < 2) {
      setResultatsRecherche([]);
      return;
    }
    delaiRechercheRef.current = setTimeout(async () => {
      setRechercheEnCours(true);
      try {
        const supabase = creerClientNavigateur();
        const { data } = await supabase.rpc("rechercher_objectifs_programme", {
          p_recherche: termeRecherche.trim(),
          p_cycle_id: cycleId,
        });
        setResultatsRecherche(data ?? []);
      } finally {
        setRechercheEnCours(false);
      }
    }, 400);
  }, [termeRecherche, cycleId]);

  // --- Navigation en cascade (pour qui préfère parcourir le programme) ---
  // Chemin des noeuds de structure selectionnes successivement, depuis
  // le domaine -- longueur variable selon la profondeur reelle de la
  // matiere choisie (certaines, comme les langues vivantes ou la vie
  // affective, n'ont pas de niveau "competence" ni "repere_annuel", ou
  // en ont plusieurs de plus). Des que le noeud choisi n'a plus
  // d'enfant de structure dans l'arbre, on recupere directement, via la
  // fonction qui sait deja chercher a n'importe quelle profondeur, les
  // objectifs en-dessous -- plutot que de supposer une profondeur fixe
  // en 4 niveaux qui laisserait certaines matieres sans rien
  // d'affichable.
  const [chemin, setChemin] = useState<string[]>([]);
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [chargementObjectifs, setChargementObjectifs] = useState(false);

  const enfantsParParent = useMemo(() => {
    const carte = new Map<string | null, typeof arbre>();
    for (const n of arbre) {
      const liste = carte.get(n.parentId) ?? [];
      liste.push(n);
      carte.set(n.parentId, liste);
    }
    return carte;
  }, [arbre]);

  const domaines = enfantsParParent.get(null) ?? [];

  const niveauxStructure = useMemo(() => {
    const resultat: { parentId: string | null; options: typeof arbre }[] = [];
    let parentCourant: string | null = null;
    for (let i = 0; i <= chemin.length; i++) {
      const options = enfantsParParent.get(parentCourant) ?? [];
      if (options.length === 0) break;
      resultat.push({ parentId: parentCourant, options });
      const idChoisi = chemin[i];
      if (!idChoisi) break;
      parentCourant = idChoisi;
    }
    return resultat;
  }, [enfantsParParent, chemin]);

  const dernierNoeudChoisi: string | null = chemin[chemin.length - 1] ?? null;
  const auBoutDeLaStructure =
    dernierNoeudChoisi !== null && (enfantsParParent.get(dernierNoeudChoisi) ?? []).length === 0;

  function choisirNiveau(profondeur: number, valeur: string) {
    const nouveauChemin = chemin.slice(0, profondeur);
    if (valeur) nouveauChemin.push(valeur);
    setChemin(nouveauChemin);
  }

  useEffect(() => {
    if (!auBoutDeLaStructure || !dernierNoeudChoisi) {
      setObjectifs([]);
      return;
    }
    setChargementObjectifs(true);
    const supabase = creerClientNavigateur();

    async function chargerObjectifs() {
      try {
        const { data } = await supabase.rpc("lister_objectifs_sous_element", {
          p_element_id: dernierNoeudChoisi,
        });
        setObjectifs(
          (data ?? []).map((o: { id: string; libelle: string; groupe: string | null }) => ({
            id: o.id,
            libelle: o.libelle,
            groupe: o.groupe,
          }))
        );
      } finally {
        setChargementObjectifs(false);
      }
    }

    chargerObjectifs();
  }, [auBoutDeLaStructure, dernierNoeudChoisi]);

  function basculerObjectif(id: string, libelle: string) {
    if (selection.has(id)) {
      setSelection((precedent) => {
        const nouveau = new Map(precedent);
        for (const [autreId, autreLibelle] of precedent) {
          if (autreLibelle === libelle) nouveau.delete(autreId);
        }
        return nouveau;
      });
      setNiveauParObjectif((precedent) => {
        const nouveau = new Map(precedent);
        for (const autreId of Array.from(nouveau.keys())) {
          if (autreId === id || selection.get(autreId) === libelle) nouveau.delete(autreId);
        }
        return nouveau;
      });
      return;
    }
    setSelection((precedent) => new Map(precedent).set(id, libelle));
    if (!cycleId) return;
    trouverJumelles(cycleId, libelle)
      .then((jumelles) => {
        if (jumelles.length === 0) return;
        setSelection((precedent) => {
          if (!precedent.has(id)) return precedent;
          const nouveau = new Map(precedent);
          for (const j of jumelles) nouveau.set(j.id, j.libelle);
          return nouveau;
        });
      })
      .catch(() => {});
  }

  function changerNiveauObjectif(libelle: string, niveauId: string) {
    setNiveauParObjectif((precedent) => {
      const nouveau = new Map(precedent);
      for (const [autreId, autreLibelle] of selection) {
        if (autreLibelle === libelle) nouveau.set(autreId, niveauId);
      }
      return nouveau;
    });
  }

  // --- Enregistrement partagé ---
  const [niveauAutonomieId, setNiveauAutonomieId] = useState(niveaux[0]?.id ?? "");
  const [niveauParObjectif, setNiveauParObjectif] = useState<Map<string, string>>(new Map());
  const [justification, setJustification] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  async function gererEnvoi(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setSucces(null);

    if (selection.size === 0) {
      setErreur("Sélectionnez au moins un objectif observé.");
      return;
    }

    setChargement(true);
    try {
      const resultat = await avecDelaiMaximal(
        creerObservations({
          activiteId,
          elements: Array.from(selection.keys()).map((id) => ({
            id,
            niveauAutonomieId: niveauParObjectif.get(id) || niveauAutonomieId,
          })),
          justification,
          commentairePedagogique: commentaire,
        })
      );

      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }

      // Statuts automatiques calcules en arriere-plan, sans faire attendre.
      declencherEstimationArrierePlan(activiteId);
      setSucces(`${resultat.nombreCreees} objectif(s) enregistré(s).`);
      setSelection(new Map());
      setJustification("");
      setCommentaire("");
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de l'enregistrement des observations", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargement(false);
    }
  }

  const groupes = useMemo(() => {
    const map = new Map<string | null, Objectif[]>();
    for (const o of objectifs) {
      const liste = map.get(o.groupe) ?? [];
      liste.push(o);
      map.set(o.groupe, liste);
    }
    return Array.from(map.entries());
  }, [objectifs]);

  return (
    <div className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux">
      <p className="mb-1 text-sm font-medium text-encre">
        Rechercher un objectif
      </p>
      <p className="mb-3 text-xs text-ardoise">
        Cherchez directement ce que l&rsquo;enfant a fait (ex. « compter »,
        « découper », « rimes »). Les tranches d&rsquo;âge du programme ne
        sont pas des seuils stricts : ce sont des repères de progression,
        pas une obligation liée à l&rsquo;âge exact.
      </p>
      <input
        type="search"
        value={termeRecherche}
        onChange={(e) => setTermeRecherche(e.target.value)}
        placeholder="Rechercher un mot-clé…"
        className="mb-3 w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
      />

      {rechercheEnCours && (
        <p className="mb-3 text-xs text-ardoise">Recherche…</p>
      )}

      {resultatsRecherche.length > 0 && (
        <ul className="mb-5 max-h-56 space-y-1 overflow-y-auto rounded-doux border border-trait p-2">
          {resultatsRecherche.map((r) => {
            const selectionne = selection.has(r.id);
            const dejaObserve = elementsDejaObserves.has(r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => basculerObjectif(r.id, r.libelle)}
                  className={`w-full rounded-doux px-2.5 py-2 text-left text-sm hover:bg-lin ${
                    selectionne ? "bg-mousse/10" : ""
                  }`}
                >
                  <span className="text-encre">{r.libelle}</span>
                  {dejaObserve && (
                    <span className="ml-1.5 text-xs text-mousse-fonce">(déjà observé)</span>
                  )}
                  {r.chemin && (
                    <span className="block text-xs text-ardoise">{r.chemin}</span>
                  )}
                </button>
                <ExemplesReussite objectifId={r.id} />
              </li>
            );
          })}
        </ul>
      )}

      <details className="mb-2">
        <summary className="cursor-pointer text-sm font-medium text-encre">
          Ou parcourir le programme par domaine
        </summary>

        <div className="mb-4 mt-3 grid gap-3 sm:grid-cols-2">
          {niveauxStructure.map((niveau, i) => (
            <SelectNiveau
              key={niveau.parentId ?? "racine"}
              label={i === 0 ? "Domaine" : `Niveau ${i + 1}`}
              valeur={chemin[i] ?? ""}
              options={niveau.options}
              onChange={(v) => choisirNiveau(i, v)}
            />
          ))}
        </div>

        {chargementObjectifs && (
          <p className="mb-4 text-sm text-ardoise">Chargement des objectifs…</p>
        )}

        {!chargementObjectifs && auBoutDeLaStructure && objectifs.length === 0 && (
          <p className="mb-4 text-sm text-ardoise">
            Aucun objectif trouvé pour cette sélection.
          </p>
        )}

        {objectifs.length > 0 && (
          <div className="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-doux border border-trait p-3">
            {groupes.map(([groupe, liste]) => (
              <div key={groupe ?? "_"}>
                {groupe && (
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ardoise">
                    {groupe}
                  </p>
                )}
                {liste.map((o) => {
                  const dejaObserve = elementsDejaObserves.has(o.id);
                  return (
                    <div key={o.id} className="mb-1">
                      <label className="flex items-start gap-2 text-sm text-encre">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={selection.has(o.id)}
                          onChange={() => basculerObjectif(o.id, o.libelle)}
                        />
                        <span>
                          {o.libelle}
                          {dejaObserve && (
                            <span className="ml-1.5 text-xs text-mousse-fonce">
                              (déjà observé)
                            </span>
                          )}
                        </span>
                      </label>
                      <div className="pl-6">
                        <ExemplesReussite objectifId={o.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </details>

      {selection.size > 0 && (
        <form onSubmit={gererEnvoi} className="mt-4 border-t border-trait pt-4">
          <p className="mb-2 text-sm font-medium text-encre">
            Objectifs sélectionnés ({new Set(selection.values()).size})
          </p>
          <ul className="mb-4 space-y-2">
            {Array.from(selection.entries())
              .filter(([, libelle], i, tout) => tout.findIndex(([, l]) => l === libelle) === i)
              .map(([id, libelle]) => (
              <li
                key={id}
                className="rounded-doux bg-lin px-2.5 py-2 text-sm text-encre"
              >
                <div className="flex items-start justify-between gap-2">
                  <span>{libelle}</span>
                  <button
                    type="button"
                    onClick={() => basculerObjectif(id, libelle)}
                    className="shrink-0 text-ardoise hover:text-alerte"
                    title="Retirer"
                  >
                    ×
                  </button>
                </div>
                <select
                  value={niveauParObjectif.get(id) ?? niveauAutonomieId}
                  onChange={(e) => changerNiveauObjectif(libelle, e.target.value)}
                  className="mt-1.5 w-full rounded-doux border border-trait bg-white px-2.5 py-1.5 text-xs text-encre focus:border-mousse focus:outline-none"
                >
                  {niveaux.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.libelle}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-encre">
              Justification (facultatif)
            </label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-encre">
              Commentaire pédagogique (facultatif)
            </label>
            <textarea
              rows={2}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
            />
          </div>

          {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
          {succes && <MessageStatut type="succes">{succes}</MessageStatut>}

          <button
            type="submit"
            disabled={chargement}
            className="rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
          >
            {chargement
              ? "Enregistrement…"
              : `Enregistrer (${selection.size} sélectionné${selection.size > 1 ? "s" : ""})`}
          </button>
        </form>
      )}
    </div>
  );
}

function SelectNiveau({
  label,
  valeur,
  options,
  disabled,
  placeholder,
  onChange,
}: {
  label: string;
  valeur: string;
  options: { id: string; libelle: string }[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-encre">{label}</label>
      <select
        value={valeur}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none disabled:bg-lin disabled:text-ardoise"
      >
        <option value="">{placeholder ?? "Sélectionner…"}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.libelle}
          </option>
        ))}
      </select>
    </div>
  );
}
