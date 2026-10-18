"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { accepterInvitation } from "./actions";
import { MessageStatut } from "@/components/Formulaire";

export function AccepterInvitation({ jeton, nomFamille }: { jeton: string; nomFamille: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function rejoindre() {
    setErreur(null);
    setEnCours(true);
    try {
      const resultat = await accepterInvitation(jeton);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      router.push("/tableau-de-bord");
      router.refresh();
    } catch (e) {
      console.error("Erreur lors de l'acceptation", e);
      setErreur("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="space-y-4">
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
      <button type="button" onClick={rejoindre} disabled={enCours} className="bouton-primaire w-full">
        {enCours ? "Un instant…" : `Rejoindre l'espace « ${nomFamille} »`}
      </button>
    </div>
  );
}
