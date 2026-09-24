"use client";

import { useState } from "react";
import Link from "next/link";
import { genererIdeesActivites, type IdeeActivite } from "./actionsIA";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonIdeesActivites({
  objectifId,
  objectifLibelle,
  parcoursId,
}: {
  objectifId: string;
  objectifLibelle: string;
  parcoursId: string;
}) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [idees, setIdees] = useState<IdeeActivite[] | null>(null);

  async function gererClic(evenement: React.MouseEvent) {
    evenement.preventDefault();
    evenement.stopPropagation();
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(genererIdeesActivites(objectifId), 30000);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setIdees(resultat.idees);
    } catch (erreurInattendue) {
      console.error("Erreur lors de la génération d'idées d'activités", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  function lienCreerActivite(idee: IdeeActivite) {
    const parametres = new URLSearchParams({
      titre: idee.titre,
      description: idee.description,
      parcours: parcoursId,
      objectifId,
      objectifLibelle,
    });
    return `/journal/nouvelle?${parametres.toString()}`;
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={gererClic}
        disabled={enCours}
        className="text-xs font-medium text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enCours ? "Analyse en cours…" : "💡 Idées d'activités"}
      </button>
      {erreur && <p className="mt-1 text-xs text-alerte">{erreur}</p>}
      {idees && idees.length > 0 && (
        <ul className="mt-1.5 space-y-2 rounded-doux bg-mousse/5 p-2">
          {idees.map((idee, i) => (
            <li key={i} className="text-xs text-encre">
              <p>
                <span className="font-medium">{idee.titre}</span> — {idee.description}
              </p>
              <Link
                href={lienCreerActivite(idee)}
                className="mt-0.5 inline-block text-mousse-fonce underline underline-offset-2 hover:text-mousse"
              >
                Créer cette activité dans le journal →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
