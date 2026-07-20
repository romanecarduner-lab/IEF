"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { creerObservations } from "./actions";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";
import { MessageStatut } from "@/components/Formulaire";

type NoeudArbre = { id: string; parentId: string | null; type: string; libelle: string };
type Objectif = { id: string; libelle: string; groupe: string | null };
type NiveauAutonomie = { id: string; libelle: string };

export function SelecteurCompetences({
  activiteId,
  arbre,
  niveaux,
  elementsDejaObserves,
}: {
  activiteId: string;
  arbre: NoeudArbre[];
  niveaux: NiveauAutonomie[];
  elementsDejaObserves: Set<string>;
}) {
  const router = useRouter();

  const [domaineId, setDomaineId] = useState("");
  const [sousDomaineId, setSousDomaineId] = useState("");
  const [competenceId, setCompetenceId] = useState("");
  const [repereAnnuelId, setRepereAnnuelId] = useState("");

  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [chargementObjectifs, setChargementObjectifs] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());

  const [niveauAutonomieId, setNiveauAutonomieId] = useState(niveaux[0]?.id ?? "");
  const [justification, setJustification] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const domaines = useMemo(() => arbre.filter((n) => n.type === "domaine"), [arbre]);
  const sousDomaines = useMemo(
    () => arbre.filter((n) => n.type === "sous_domaine" && n.parentId === domaineId),
    [arbre, domaineId]
  );
  const competences = useMemo(
    () => arbre.filter((n) => n.type === "competence" && n.parentId === sousDomaineId),
    [arbre, sousDomaineId]
  );
  const reperesAnnuels = useMemo(
    () => arbre.filter((n) => n.type === "repere_annuel" && n.parentId === competenceId),
    [arbre, competenceId]
  );

  useEffect(() => {
    if (!repereAnnuelId) {
      setObjectifs([]);
      return;
    }
    setChargementObjectifs(true);
    setSelection(new Set());
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

  function basculerObjectif(id: string) {
    setSelection((precedent) => {
      const nouveau = new Set(precedent);
      if (nouveau.has(id)) nouveau.delete(id);
      else nouveau.add(id);
      return nouveau;
    });
  }

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
          elementProgrammeIds: Array.from(selection),
          niveauAutonomieId,
          justification,
          commentairePedagogique: commentaire,
        })
      );

      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }

      setSucces(`${resultat.nombreCreees} objectif(s) enregistré(s).`);
      setSelection(new Set());
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

  // Regroupe les objectifs par sous-competence eventuelle, pour l'affichage.
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
      <p className="mb-4 text-sm font-medium text-encre">
        Parcourir le programme
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
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
          disabled={!sousDomaineId}
          onChange={(v) => {
            setCompetenceId(v);
            setRepereAnnuelId("");
          }}
        />
        <SelectNiveau
          label="Tranche d'âge"
          valeur={repereAnnuelId}
          options={reperesAnnuels}
          disabled={!competenceId}
          onChange={setRepereAnnuelId}
        />
      </div>

      {chargementObjectifs && (
        <p className="mb-4 text-sm text-ardoise">Chargement des objectifs…</p>
      )}

      {!chargementObjectifs && repereAnnuelId && objectifs.length === 0 && (
        <p className="mb-4 text-sm text-ardoise">
          Aucun objectif trouvé pour cette sélection.
        </p>
      )}

      {objectifs.length > 0 && (
        <form onSubmit={gererEnvoi}>
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
                    <label
                      key={o.id}
                      className="mb-1 flex items-start gap-2 text-sm text-encre"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selection.has(o.id)}
                        onChange={() => basculerObjectif(o.id)}
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
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-encre">
              Niveau d&rsquo;autonomie observé
            </label>
            <select
              value={niveauAutonomieId}
              onChange={(e) => setNiveauAutonomieId(e.target.value)}
              className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
            >
              {niveaux.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.libelle}
                </option>
              ))}
            </select>
          </div>

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
            disabled={chargement || selection.size === 0}
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
  onChange,
}: {
  label: string;
  valeur: string;
  options: { id: string; libelle: string }[];
  disabled?: boolean;
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
