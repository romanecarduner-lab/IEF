"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { annulerInvitation, changerAfficherAuteur, retirerMembre } from "./actions";
import { MessageStatut } from "@/components/Formulaire";

export function BoutonRetirerMembre({ userId, nom }: { userId: string; nom: string }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  return (
    <div>
      <button
        type="button"
        disabled={enCours}
        onClick={async () => {
          if (
            !window.confirm(
              `Retirer ${nom} de l'espace ? Cette personne n'aura plus accès à rien. Ce qu'elle a ajouté reste dans l'espace.`
            )
          )
            return;
          setErreur(null);
          setEnCours(true);
          const r = await retirerMembre(userId);
          setEnCours(false);
          if ("erreur" in r) setErreur(r.erreur);
          else router.refresh();
        }}
        className="min-h-[40px] px-1 text-sm text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
      >
        {enCours ? "Un instant…" : "Retirer"}
      </button>
      {erreur && <p className="text-xs text-alerte">{erreur}</p>}
    </div>
  );
}

export function BoutonAnnulerInvitation({ id }: { id: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  return (
    <button
      type="button"
      disabled={enCours}
      onClick={async () => {
        if (!window.confirm("Annuler cette invitation ? Le lien ne fonctionnera plus.")) return;
        setEnCours(true);
        await annulerInvitation(id);
        setEnCours(false);
        router.refresh();
      }}
      className="min-h-[40px] px-1 text-sm text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
    >
      {enCours ? "Un instant…" : "Annuler"}
    </button>
  );
}

export function ReglageAuteur({ initial }: { initial: boolean }) {
  const router = useRouter();
  const [valeur, setValeur] = useState(initial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  return (
    <div>
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
      <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm text-encre">
        <input
          type="checkbox"
          checked={valeur}
          disabled={enCours}
          onChange={async (e) => {
            const nouvelle = e.target.checked;
            setValeur(nouvelle);
            setErreur(null);
            setEnCours(true);
            const r = await changerAfficherAuteur(nouvelle);
            setEnCours(false);
            if ("erreur" in r) {
              setValeur(!nouvelle);
              setErreur(r.erreur);
            } else router.refresh();
          }}
          className="mt-1 h-5 w-5 accent-mousse-fonce"
        />
        <span>
          Afficher « ajouté par » sur les activités et les photos
          <span className="block text-xs text-ardoise">
            Utile à deux : on voit qui a ajouté quoi. Désactivé par défaut.
          </span>
        </span>
      </label>
    </div>
  );
}
