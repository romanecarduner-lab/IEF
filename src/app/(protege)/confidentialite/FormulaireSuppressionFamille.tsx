"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supprimerEspaceFamilial } from "./actions";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";
import { MessageStatut } from "@/components/Formulaire";

export function FormulaireSuppressionFamille({ nomFamille }: { nomFamille: string }) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function gererSuppression(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const resultat = await avecDelaiMaximal(supprimerEspaceFamilial(saisie), 60000);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      const supabase = creerClientNavigateur();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur lors de la suppression de l'espace familial", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setEnCours(false);
    }
  }

  if (!confirmationOuverte) {
    return (
      <button
        type="button"
        onClick={() => setConfirmationOuverte(true)}
        className="rounded-doux border border-alerte/40 px-4 py-2.5 text-sm font-medium text-alerte hover:bg-alerte/5"
      >
        Supprimer définitivement mon espace familial
      </button>
    );
  }

  return (
    <form
      onSubmit={gererSuppression}
      className="rounded-doux border border-alerte/40 bg-alerte/5 p-4"
    >
      <p className="mb-3 text-sm text-encre">
        Cette action supprime <strong>définitivement et irréversiblement</strong>{" "}
        tous les enfants, années scolaires, activités, traces, fichiers et le
        compte associés à cet espace familial. Pensez à exporter vos données
        et vos fichiers avant, si besoin.
      </p>
      <p className="mb-3 text-sm text-encre">
        Pour confirmer, retapez le nom exact de votre espace :{" "}
        <strong>{nomFamille}</strong>
      </p>
      <input
        type="text"
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        className="mb-3 w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-alerte focus:outline-none"
      />
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={enCours || saisie.trim() !== nomFamille}
          className="rounded-doux bg-alerte px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enCours ? "Suppression en cours…" : "Supprimer définitivement"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmationOuverte(false)}
          disabled={enCours}
          className="text-sm text-ardoise underline underline-offset-2"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
