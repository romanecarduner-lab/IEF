"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { NavigationDomaines } from "./NavigationDomaines";

type Statut = { code: string; libelle: string };

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Barre fixe en haut de la liste des competences : recherche par mot,
 * filtre par statut et raccourcis vers chaque domaine. Elle ne retire
 * rien : elle masque simplement, dans la liste deja affichee, ce qui ne
 * correspond pas (et le montre a nouveau des qu'on efface le filtre).
 * Le decompte de chaque domaine se met a jour en consequence.
 */
export function FiltresProgression({
  statuts,
  domaines,
}: {
  statuts: Statut[];
  domaines: { id: string; nom: string; nb: number }[];
}) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous");

  const appliquer = useCallback(() => {
    const racine = document.getElementById("liste-competences");
    if (!racine) return;
    const q = normaliser(recherche.trim());
    let totalVisibles = 0;

    racine.querySelectorAll<HTMLElement>("details[data-domaine]").forEach((bloc) => {
      let visibles = 0;
      const lignes = bloc.querySelectorAll<HTMLElement>("li[data-competence]");
      lignes.forEach((li) => {
        const etats = (li.dataset.etat ?? "").split(" ");
        const okFiltre =
          filtre === "tous" ||
          (filtre === "a-choisir" && etats.includes("a-choisir")) ||
          (filtre === "a-reexaminer" && etats.includes("a-reexaminer")) ||
          li.dataset.statut === filtre;
        const okTexte = !q || normaliser(li.textContent ?? "").includes(q);
        const montrer = okFiltre && okTexte;
        if (li.hidden === montrer) li.hidden = !montrer;
        if (montrer) visibles += 1;
      });
      const masquerBloc = visibles === 0;
      if (bloc.hidden !== masquerBloc) bloc.hidden = masquerBloc;
      const compteur = bloc.querySelector<HTMLElement>("[data-compteur]");
      if (compteur) {
        const texte =
          visibles === lignes.length ? `(${lignes.length})` : `(${visibles} sur ${lignes.length})`;
        if (compteur.textContent !== texte) compteur.textContent = texte;
      }
      totalVisibles += visibles;
    });

    const aucun = document.getElementById("aucun-resultat");
    if (aucun) {
      const doitEtreMasque = totalVisibles > 0;
      if (aucun.hidden !== doitEtreMasque) aucun.hidden = doitEtreMasque;
    }
  }, [recherche, filtre]);

  useEffect(() => {
    appliquer();
    // La liste est rendue par le serveur : apres une validation de statut
    // elle peut etre rafraichie, on reapplique alors le filtre en cours.
    const racine = document.getElementById("liste-competences");
    if (!racine) return;
    let tache = 0;
    const observateur = new MutationObserver(() => {
      cancelAnimationFrame(tache);
      tache = requestAnimationFrame(appliquer);
    });
    observateur.observe(racine, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(tache);
      observateur.disconnect();
    };
  }, [appliquer]);

  const filtreActif = recherche.trim() !== "" || filtre !== "tous";

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 bg-brume/95 px-4 pb-1 pt-2 backdrop-blur sm:mx-0 sm:px-0">
      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Chercher une compétence</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ardoise"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Chercher une compétence…"
            className="champ-saisie w-full pl-9"
          />
        </label>
        <label>
          <span className="sr-only">Filtrer par statut</span>
          <select
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            className="champ-saisie w-[9.5rem] sm:w-auto"
          >
            <option value="tous">Tous les statuts</option>
            <option value="a-choisir">À choisir vous-même</option>
            <option value="a-reexaminer">À réexaminer</option>
            {statuts.map((s) => (
              <option key={s.code} value={s.code}>
                {s.libelle}
              </option>
            ))}
          </select>
        </label>
        {filtreActif && (
          <button
            type="button"
            onClick={() => {
              setRecherche("");
              setFiltre("tous");
            }}
            className="bouton-secondaire bouton-petit shrink-0"
          >
            Effacer
          </button>
        )}
      </div>
      <NavigationDomaines domaines={domaines} collant={false} />
    </div>
  );
}
