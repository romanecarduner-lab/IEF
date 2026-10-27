"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { basculerDescriptionExemple } from "./actionsExemples";

/**
 * Case a cocher : ajoute ou non la description de l'activite sous la
 * formulation pedagogique de cet exemple dans le document. Le parent decide ;
 * la description est affichee ici pour qu'il voie exactement ce qui sera ajoute.
 */
export function ToggleDescriptionExemple({
  dossierId,
  sousDomaine,
  activiteId,
  visible,
  description,
}: {
  dossierId: string;
  sousDomaine: string;
  activiteId: string;
  visible: boolean;
  description: string;
}) {
  const router = useRouter();
  const [coche, setCoche] = useState(visible);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!description.trim()) return null;

  async function changer(nouvelEtat: boolean) {
    setCoche(nouvelEtat);
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await basculerDescriptionExemple(dossierId, sousDomaine, activiteId, nouvelEtat);
      if ("erreur" in resultat) {
        setCoche(!nouvelEtat);
        setErreur(resultat.erreur);
        return;
      }
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mt-2 border-t border-trait pt-2">
      <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-xs text-encre">
        <input
          type="checkbox"
          checked={coche}
          disabled={enCours}
          onChange={(e) => void changer(e.target.checked)}
          className="h-4 w-4"
        />
        Ajouter la description de l&rsquo;activité dans le document
      </label>
      {coche && (
        <p className="mt-1 whitespace-pre-line rounded-doux bg-lin p-2 text-xs text-ardoise">{description}</p>
      )}
      {erreur && <p className="mt-1 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
