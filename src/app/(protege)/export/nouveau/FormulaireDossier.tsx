"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { creerDossier } from "../actions";
import { Champ, MessageStatut } from "@/components/Formulaire";

const ETAT_INITIAL: { erreur?: string } = {};

function dateVersISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function BoutonCreer({ typeDossier, remplissageAuto }: { typeDossier: string; remplissageAuto: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Création…"
        : typeDossier === "journal_periode"
        ? "Créer le journal de cette période"
        : remplissageAuto
        ? "Créer et remplir automatiquement"
        : "Créer le dossier vide"}
    </button>
  );
}

export function FormulaireDossier({
  parcours,
}: {
  parcours: { id: string; libelle: string }[];
}) {
  const [etat, action] = useFormState(creerDossier, ETAT_INITIAL);
  const [typeDossier, setTypeDossier] = useState<"pedagogique" | "journal_periode">("pedagogique");
  const [remplissageAuto, setRemplissageAuto] = useState(true);

  const aujourdhui = new Date();
  const [periodeDebut, setPeriodeDebut] = useState(dateVersISO(aujourdhui));
  const [periodeFin, setPeriodeFin] = useState(dateVersISO(aujourdhui));

  function appliquerPreset(preset: "semaine" | "mois") {
    const fin = new Date();
    const debut = new Date();
    if (preset === "semaine") {
      debut.setDate(fin.getDate() - 6);
    } else {
      debut.setDate(1);
    }
    setPeriodeDebut(dateVersISO(debut));
    setPeriodeFin(dateVersISO(fin));
  }

  return (
    <form
      action={action}
      className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux"
    >
      {etat.erreur && <MessageStatut type="erreur">{etat.erreur}</MessageStatut>}

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-encre">Type de dossier</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-doux border p-3 text-sm ${
              typeDossier === "pedagogique"
                ? "border-mousse bg-mousse/5"
                : "border-trait bg-white"
            }`}
          >
            <input
              type="radio"
              name="type_dossier"
              value="pedagogique"
              checked={typeDossier === "pedagogique"}
              onChange={() => setTypeDossier("pedagogique")}
              className="sr-only"
            />
            <span className="block font-medium text-encre">Dossier pédagogique</span>
            <span className="block text-xs text-ardoise">
              Organisé par domaine et compétences du programme — pour un
              contrôle académique.
            </span>
          </label>
          <label
            className={`cursor-pointer rounded-doux border p-3 text-sm ${
              typeDossier === "journal_periode"
                ? "border-mousse bg-mousse/5"
                : "border-trait bg-white"
            }`}
          >
            <input
              type="radio"
              name="type_dossier"
              value="journal_periode"
              checked={typeDossier === "journal_periode"}
              onChange={() => setTypeDossier("journal_periode")}
              className="sr-only"
            />
            <span className="block font-medium text-encre">Journal d&rsquo;une période</span>
            <span className="block text-xs text-ardoise">
              Toutes les activités d&rsquo;une semaine, d&rsquo;un mois ou
              d&rsquo;une période choisie, dans l&rsquo;ordre chronologique.
            </span>
          </label>
        </div>
      </div>

      <Champ
        label="Titre du dossier"
        id="titre"
        type="text"
        placeholder={
          typeDossier === "journal_periode"
            ? "Journal de la semaine du..."
            : "Dossier pédagogique 2026-2027"
        }
        required
        autoFocus
      />

      <div className="mb-4">
        <label htmlFor="parcours_id" className="mb-1.5 block text-sm font-medium text-encre">
          Enfant / année scolaire
        </label>
        <select
          id="parcours_id"
          name="parcours_id"
          required
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

      {typeDossier === "journal_periode" ? (
        <div className="mb-4 rounded-doux border border-mousse/30 bg-mousse/5 p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => appliquerPreset("semaine")}
              className="rounded-full border border-mousse/40 bg-white px-3 py-1 text-xs text-mousse-fonce hover:bg-mousse/10"
            >
              7 derniers jours
            </button>
            <button
              type="button"
              onClick={() => appliquerPreset("mois")}
              className="rounded-full border border-mousse/40 bg-white px-3 py-1 text-xs text-mousse-fonce hover:bg-mousse/10"
            >
              Ce mois-ci
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label htmlFor="periode_debut" className="mb-1 block text-xs text-ardoise">
                Du
              </label>
              <input
                id="periode_debut"
                name="periode_debut"
                type="date"
                required
                value={periodeDebut}
                onChange={(e) => setPeriodeDebut(e.target.value)}
                className="rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="periode_fin" className="mb-1 block text-xs text-ardoise">
                Au
              </label>
              <input
                id="periode_fin"
                name="periode_fin"
                type="date"
                required
                value={periodeFin}
                onChange={(e) => setPeriodeFin(e.target.value)}
                className="rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-ardoise">
            Toutes les activités de cette période seront incluses par
            défaut — vous pourrez en retirer certaines avant de finaliser.
          </p>
        </div>
      ) : (
        <div className="mb-4 rounded-doux border border-mousse/30 bg-mousse/5 p-3">
          <label className="flex items-start gap-2 text-sm text-encre">
            <input
              type="checkbox"
              name="remplissage_auto"
              checked={remplissageAuto}
              onChange={(e) => setRemplissageAuto(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Remplir automatiquement (recommandé) — sélectionne, pour chaque
              domaine déjà abordé, vos activités favorites en priorité puis
              les plus récentes. Vous pourrez toujours ajuster ensuite.
            </span>
          </label>

          {remplissageAuto && (
            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="max_par_domaine" className="text-xs text-ardoise">
                Exemples par domaine
              </label>
              <input
                id="max_par_domaine"
                type="number"
                name="max_par_domaine"
                min={1}
                max={10}
                defaultValue={3}
                className="w-16 rounded-doux border border-trait bg-white px-2 py-1 text-sm text-encre focus:border-mousse focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      <BoutonCreer typeDossier={typeDossier} remplissageAuto={remplissageAuto} />
    </form>
  );
}
