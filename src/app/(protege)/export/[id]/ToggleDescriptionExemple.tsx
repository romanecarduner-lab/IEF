"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { basculerDescriptionExemple, enregistrerDescriptionExport } from "./actionsExemples";

/**
 * Description de l'activite dans le document, exemple par exemple :
 *  - une case pour l'ajouter ou non (le parent decide) ;
 *  - le texte affiche est modifiable ici, propre au document : la description
 *    de l'activite dans le journal ne change pas ;
 *  - « Revenir a la description de l'activite » efface la version du document.
 */
export function ToggleDescriptionExemple({
  dossierId,
  sousDomaine,
  activiteId,
  visible,
  descriptionActivite,
  descriptionExport,
}: {
  dossierId: string;
  sousDomaine: string;
  activiteId: string;
  visible: boolean;
  descriptionActivite: string;
  descriptionExport: string | null;
}) {
  const router = useRouter();
  const [coche, setCoche] = useState(visible);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [texte, setTexte] = useState(descriptionExport ?? descriptionActivite);
  const [modifie, setModifie] = useState(false);

  const aUneDescription = descriptionActivite.trim() !== "" || (descriptionExport ?? "").trim() !== "";
  if (!aUneDescription) return null;

  async function changerCase(nouvelEtat: boolean) {
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

  async function enregistrerTexte(nouveau: string) {
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await enregistrerDescriptionExport(dossierId, sousDomaine, activiteId, nouveau);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setModifie(false);
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
          onChange={(e) => void changerCase(e.target.checked)}
          className="h-4 w-4"
        />
        Ajouter la description de l&rsquo;activité dans le document
      </label>

      {coche && (
        <div className="mt-2">
          <label className="mb-1 block text-xs font-medium text-encre" htmlFor={`desc-${activiteId}`}>
            Description dans le document
          </label>
          <textarea
            id={`desc-${activiteId}`}
            rows={4}
            value={texte}
            disabled={enCours}
            onChange={(e) => {
              setTexte(e.target.value);
              setModifie(true);
            }}
            className="champ-saisie w-full text-xs"
          />
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={enCours || !modifie}
              onClick={() => void enregistrerTexte(texte)}
              className="bouton-secondaire bouton-petit"
            >
              Enregistrer ce texte
            </button>
            {descriptionExport && (
              <button
                type="button"
                disabled={enCours}
                onClick={() => {
                  setTexte(descriptionActivite);
                  void enregistrerTexte("");
                }}
                className="min-h-[40px] text-xs text-mousse-fonce underline underline-offset-2"
              >
                Revenir à la description de l&rsquo;activité
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-ardoise">
            Ce texte n&rsquo;est utilisé que dans le document. La description de l&rsquo;activité dans le journal ne change pas.
          </p>
        </div>
      )}
      {erreur && <p className="mt-1 text-xs text-alerte">{erreur}</p>}
    </div>
  );
}
