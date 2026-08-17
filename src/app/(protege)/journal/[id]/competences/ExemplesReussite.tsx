"use client";

import { useState } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";

export function ExemplesReussite({ objectifId }: { objectifId: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [exemples, setExemples] = useState<string[] | null>(null);

  async function basculer(evenement: React.MouseEvent) {
    evenement.preventDefault();
    evenement.stopPropagation();
    if (ouvert) {
      setOuvert(false);
      return;
    }
    setOuvert(true);
    if (exemples === null) {
      setChargement(true);
      try {
        const supabase = creerClientNavigateur();
        const { data } = await supabase.rpc("lister_exemples_reussite", {
          p_objectif_id: objectifId,
        });
        setExemples((data ?? []).map((d: { exemple: string }) => d.exemple));
      } finally {
        setChargement(false);
      }
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={basculer}
        className="text-xs text-mousse-fonce underline decoration-mousse-clair/60 underline-offset-2 hover:text-mousse"
      >
        {ouvert ? "Masquer les exemples officiels" : "Voir les exemples officiels de réussite"}
      </button>
      {ouvert && (
        <div className="mt-1 rounded-doux bg-lin/60 p-2">
          {chargement ? (
            <p className="text-xs text-ardoise">Chargement…</p>
          ) : exemples && exemples.length > 0 ? (
            <ul className="list-disc space-y-1 pl-4">
              {exemples.map((e, i) => (
                <li key={i} className="text-xs text-encre">
                  {e}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-ardoise">
              Aucun exemple de réussite précisé par le programme pour cet objectif.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
