"use client";

import { useState } from "react";
import { exporterDonneesJSON } from "./actions";
import { messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonExportDonnees() {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function gererClic() {
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await exporterDonneesJSON();
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      const contenu = JSON.stringify(resultat.donnees, null, 2);
      const blob = new Blob([contenu], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `donnees-famille-${new Date().toISOString().slice(0, 10)}.json`;
      lien.click();
      URL.revokeObjectURL(url);
    } catch (erreurInattendue) {
      console.error("Erreur lors de l'export des données", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={gererClic}
        disabled={enCours}
        className="rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enCours ? "Préparation…" : "Exporter mes données (JSON)"}
      </button>
      {erreur && <p className="mt-2 text-sm text-alerte">{erreur}</p>}
    </div>
  );
}
