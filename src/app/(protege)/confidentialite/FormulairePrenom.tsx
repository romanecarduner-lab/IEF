"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";
import { MessageStatut } from "@/components/Formulaire";

export function FormulairePrenom({ prenomActuel }: { prenomActuel: string }) {
  const router = useRouter();
  const [prenom, setPrenom] = useState(prenomActuel);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  async function enregistrer(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setSucces(false);
    setEnCours(true);
    try {
      const supabase = creerClientNavigateur();
      const { error } = await avecDelaiMaximal(
        supabase.auth.updateUser({ data: { prenom: prenom.trim() || null } })
      );
      if (error) {
        setErreur("Impossible d'enregistrer votre prénom. Merci de réessayer.");
        return;
      }
      setSucces(true);
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors de l'enregistrement du prénom", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="prenom" className="mb-1.5 block text-sm font-medium text-encre">
          Votre prénom
        </label>
        <input
          id="prenom"
          type="text"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          placeholder="Romane"
          className="rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={enCours}
        className="rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
      {succes && <MessageStatut type="succes">Prénom mis à jour.</MessageStatut>}
    </form>
  );
}
