"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { chargerArbreProgramme, type NoeudArbreProgramme } from "./actionsArbre";

type ResultatRecherche = { id: string; libelle: string; chemin: string | null };
type Objectif = { id: string; libelle: string; groupe: string | null };

function SelectNiveau({
  label,
  valeur,
  options,
  onChange,
}: {
  label: string;
  valeur: string;
  options: { id: string; libelle: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-encre">{label}</label>
      <select
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-doux border border-trait bg-white px-2.5 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
      >
        <option value="">Sélectionner…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.libelle}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Recherche libre (par mots-clés) ou navigation par domaine pour trouver
 * une compétence, directement a la creation d'une activite -- meme
 * mecanisme que celui deja disponible sur la page "Competences
 * observees" d'une activite deja enregistree, mais sans attendre d'avoir
 * valide l'activite pour y acceder.
 *
 * La navigation par domaine s'adapte a la profondeur reelle de chaque
 * matiere (certaines, comme les langues vivantes ou la vie affective,
 * n'ont pas de niveau "competence" ni "repere_annuel", ou en ont
 * plusieurs de plus) : des que le noeud choisi n'a plus d'enfant de
 * structure (domaine/sous-domaine/competence/repere_annuel), on
 * recupere directement, via la fonction qui sait deja chercher a
 * n'importe quelle profondeur, les objectifs en-dessous -- plutot que
 * de supposer une profondeur fixe en 4 niveaux qui laisserait certaines
 * matieres sans aucun objectif affichable.
 */
export function RechercheCompetences({
  cycleId,
  selection,
  onToggle,
}: {
  cycleId: string | null;
  selection: Map<string, string>;
  onToggle: (id: string, libelle: string) => void;
}) {
  // --- Recherche libre ---
  const [termeRecherche, setTermeRecherche] = useState("");
  const [resultatsRecherche, setResultatsRecherche] = useState<ResultatRecherche[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const delaiRechercheRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (delaiRechercheRef.current) clearTimeout(delaiRechercheRef.current);
    if (termeRecherche.trim().length < 2 || !cycleId) {
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

  // --- Navigation par domaine (chargee a la demande pour le cycle actuel) ---
  const [arbreOuvert, setArbreOuvert] = useState(false);
  const [arbre, setArbre] = useState<NoeudArbreProgramme[]>([]);
  const [chargementArbre, setChargementArbre] = useState(false);
  const cycleChargeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!arbreOuvert || !cycleId) return;
    if (cycleChargeRef.current === cycleId) return;
    setChargementArbre(true);
    chargerArbreProgramme(cycleId)
      .then((donnees) => {
        setArbre(donnees);
        cycleChargeRef.current = cycleId;
      })
      .finally(() => setChargementArbre(false));
  }, [arbreOuvert, cycleId]);

  // Chemin des noeuds de structure selectionnes successivement, depuis
  // le domaine -- longueur variable selon la profondeur reelle de la
  // matiere choisie.
  const [chemin, setChemin] = useState<string[]>([]);
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [chargementObjectifs, setChargementObjectifs] = useState(false);

  const enfantsParParent = useMemo(() => {
    const carte = new Map<string | null, NoeudArbreProgramme[]>();
    for (const n of arbre) {
      const liste = carte.get(n.parentId) ?? [];
      liste.push(n);
      carte.set(n.parentId, liste);
    }
    return carte;
  }, [arbre]);

  const domaines = enfantsParParent.get(null) ?? [];

  const niveaux = useMemo(() => {
    const resultat: { parentId: string | null; options: NoeudArbreProgramme[] }[] = [];
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
  // Des que le dernier noeud choisi n'a plus d'enfant de structure dans
  // l'arbre (quel que soit son propre type), on considere qu'on est
  // arrive au bout et on va chercher les objectifs en-dessous.
  const auBoutDeLaStructure =
    dernierNoeudChoisi !== null && (enfantsParParent.get(dernierNoeudChoisi) ?? []).length === 0;

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

  const groupes = useMemo(() => {
    const parGroupe = new Map<string | null, Objectif[]>();
    for (const o of objectifs) {
      const liste = parGroupe.get(o.groupe) ?? [];
      liste.push(o);
      parGroupe.set(o.groupe, liste);
    }
    return Array.from(parGroupe.entries());
  }, [objectifs]);

  function choisirNiveau(profondeur: number, valeur: string) {
    const nouveauChemin = chemin.slice(0, profondeur);
    if (valeur) nouveauChemin.push(valeur);
    setChemin(nouveauChemin);
  }

  if (!cycleId) return null;

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-encre">
        Chercher une compétence (facultatif)
      </label>
      <input
        type="text"
        value={termeRecherche}
        onChange={(e) => setTermeRecherche(e.target.value)}
        placeholder="Mots-clés…"
        className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
      />
      {rechercheEnCours && <p className="mt-1 text-xs text-ardoise">Recherche…</p>}
      {!rechercheEnCours && resultatsRecherche.length > 0 && (
        <ul className="mt-2 max-h-56 space-y-0.5 overflow-y-auto rounded-doux border border-trait p-1.5">
          {resultatsRecherche.map((r) => {
            const selectionne = selection.has(r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onToggle(r.id, r.libelle)}
                  className={`w-full rounded-doux px-2.5 py-2 text-left text-sm hover:bg-lin ${
                    selectionne ? "bg-mousse/10" : ""
                  }`}
                >
                  <span className="text-encre">{r.libelle}</span>
                  {r.chemin && <span className="block text-xs text-ardoise">{r.chemin}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <details className="mt-2" onToggle={(e) => setArbreOuvert(e.currentTarget.open)}>
        <summary className="cursor-pointer text-sm font-medium text-encre">
          Ou parcourir le programme par domaine
        </summary>

        {chargementArbre && <p className="mt-2 text-sm text-ardoise">Chargement du programme…</p>}

        {!chargementArbre && domaines.length === 0 && arbreOuvert && (
          <p className="mt-2 text-sm text-ardoise">Aucun programme disponible pour ce cycle.</p>
        )}

        {!chargementArbre && domaines.length > 0 && (
          <>
            <div className="mb-3 mt-3 grid gap-3 sm:grid-cols-2">
              {niveaux.map((niveau, i) => (
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
              <p className="mb-3 text-sm text-ardoise">Chargement des objectifs…</p>
            )}

            {!chargementObjectifs && auBoutDeLaStructure && objectifs.length === 0 && (
              <p className="mb-3 text-sm text-ardoise">Aucun objectif trouvé pour cette sélection.</p>
            )}

            {objectifs.length > 0 && (
              <div className="mb-2 max-h-56 space-y-2 overflow-y-auto rounded-doux border border-trait p-2.5">
                {groupes.map(([groupe, liste]) => (
                  <div key={groupe ?? "_"}>
                    {groupe && (
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ardoise">
                        {groupe}
                      </p>
                    )}
                    {liste.map((o) => (
                      <label key={o.id} className="mb-0.5 flex items-start gap-2 text-sm text-encre">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={selection.has(o.id)}
                          onChange={() => onToggle(o.id, o.libelle)}
                        />
                        <span>{o.libelle}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </details>
    </div>
  );
}
