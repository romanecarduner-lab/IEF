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
      <label className="mb-1.5 block text-xs font-medium text-encre">{label}</label>
      <select
        value={valeur}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-doux border border-trait bg-white px-2.5 py-2 text-sm text-encre focus:border-mousse focus:outline-none disabled:bg-lin disabled:text-ardoise"
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

/**
 * Recherche libre (par mots-clés) ou navigation par domaine pour trouver
 * une compétence, directement a la creation d'une activite -- meme
 * mecanisme que celui deja disponible sur la page "Competences
 * observees" d'une activite deja enregistree, mais sans attendre d'avoir
 * valide l'activite pour y acceder. L'arborescence du programme est
 * chargee a la demande (le cycle n'est connu qu'une fois l'enfant
 * choisi), pas au chargement de la page.
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

  const [domaineId, setDomaineId] = useState("");
  const [sousDomaineId, setSousDomaineId] = useState("");
  const [competenceId, setCompetenceId] = useState("");
  const [repereAnnuelId, setRepereAnnuelId] = useState("");
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [chargementObjectifs, setChargementObjectifs] = useState(false);

  const domaines = useMemo(() => arbre.filter((n) => n.type === "domaine"), [arbre]);
  const sousDomaines = useMemo(
    () => arbre.filter((n) => n.type === "sous_domaine" && n.parentId === domaineId),
    [arbre, domaineId]
  );
  const competences = useMemo(
    () => arbre.filter((n) => n.type === "competence" && n.parentId === sousDomaineId),
    [arbre, sousDomaineId]
  );
  const aUneCompetenceIntermediaire = competences.length > 0;
  const parentPourTranchesAge = aUneCompetenceIntermediaire ? competenceId : sousDomaineId;
  const reperesAnnuels = useMemo(
    () => arbre.filter((n) => n.type === "repere_annuel" && n.parentId === parentPourTranchesAge),
    [arbre, parentPourTranchesAge]
  );

  useEffect(() => {
    if (!repereAnnuelId) {
      setObjectifs([]);
      return;
    }
    setChargementObjectifs(true);
    const supabase = creerClientNavigateur();

    async function chargerObjectifs() {
      try {
        const { data } = await supabase.rpc("lister_objectifs_sous_element", {
          p_element_id: repereAnnuelId,
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
  }, [repereAnnuelId]);

  const groupes = useMemo(() => {
    const parGroupe = new Map<string | null, Objectif[]>();
    for (const o of objectifs) {
      const liste = parGroupe.get(o.groupe) ?? [];
      liste.push(o);
      parGroupe.set(o.groupe, liste);
    }
    return Array.from(parGroupe.entries());
  }, [objectifs]);

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

        {!chargementArbre && arbre.length > 0 && (
          <>
            <div className="mb-3 mt-3 grid gap-3 sm:grid-cols-2">
              <SelectNiveau
                label="Domaine"
                valeur={domaineId}
                options={domaines}
                onChange={(v) => {
                  setDomaineId(v);
                  setSousDomaineId("");
                  setCompetenceId("");
                  setRepereAnnuelId("");
                }}
              />
              <SelectNiveau
                label="Sous-domaine"
                valeur={sousDomaineId}
                options={sousDomaines}
                disabled={!domaineId}
                onChange={(v) => {
                  setSousDomaineId(v);
                  setCompetenceId("");
                  setRepereAnnuelId("");
                }}
              />
              <SelectNiveau
                label="Compétence"
                valeur={competenceId}
                options={competences}
                disabled={!sousDomaineId || !aUneCompetenceIntermediaire}
                placeholder={
                  sousDomaineId && !aUneCompetenceIntermediaire
                    ? "Non applicable ici"
                    : "Sélectionner…"
                }
                onChange={(v) => {
                  setCompetenceId(v);
                  setRepereAnnuelId("");
                }}
              />
              <SelectNiveau
                label="Tranche d'âge"
                valeur={repereAnnuelId}
                options={reperesAnnuels}
                disabled={!parentPourTranchesAge}
                onChange={setRepereAnnuelId}
              />
            </div>

            {chargementObjectifs && (
              <p className="mb-3 text-sm text-ardoise">Chargement des objectifs…</p>
            )}

            {!chargementObjectifs && repereAnnuelId && objectifs.length === 0 && (
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
