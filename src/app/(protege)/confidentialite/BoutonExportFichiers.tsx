"use client";

import { useState } from "react";
import { exporterFichiersZIP } from "./actions";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

export function BoutonExportFichiers() {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function gererClic() {
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(exporterFichiersZIP(), 60000);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      const binaire = atob(resultat.base64);
      const octets = new Uint8Array(binaire.length);
      for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
      const blob = new Blob([octets], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `fichiers-famille-${new Date().toISOString().slice(0, 10)}.zip`;
      lien.click();
      URL.revokeObjectURL(url);
    } catch (erreurInattendue) {
      console.error("Erreur lors de l'export des fichiers", erreurInattendue);
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
        {enCours ? "Préparation de l'archive…" : "Exporter mes fichiers (ZIP)"}
      </button>
      {erreur && <p className="mt-2 text-sm text-alerte">{erreur}</p>}
    </div>
  );
}
