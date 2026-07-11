"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CarteAuth } from "@/components/CarteAuth";
import { BoutonPrincipal, Champ, MessageStatut } from "@/components/Formulaire";
import { creerClientNavigateur } from "@/lib/supabase/client";

export default function PageReinitialisation() {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reussi, setReussi] = useState(false);

  async function gererEnvoi(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);

    const donnees = new FormData(evenement.currentTarget);
    const motDePasse = String(donnees.get("mot-de-passe") ?? "");
    const confirmation = String(donnees.get("confirmation") ?? "");

    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (motDePasse.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setChargement(true);
    const supabase = creerClientNavigateur();
    // Le lien reçu par mail établit déjà une session temporaire côté client,
    // permettant de mettre à jour le mot de passe sans autre confirmation.
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setChargement(false);

    if (error) {
      setErreur(
        "Le lien a peut-être expiré. Merci de refaire une demande de réinitialisation."
      );
      return;
    }

    setReussi(true);
    setTimeout(() => router.push("/connexion"), 2000);
  }

  return (
    <CarteAuth
      eyebrow="Instruction en famille"
      titre="Choisir un nouveau mot de passe"
    >
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
      {reussi ? (
        <MessageStatut type="succes">
          Mot de passe mis à jour. Redirection vers la connexion…
        </MessageStatut>
      ) : (
        <form onSubmit={gererEnvoi} noValidate>
          <Champ
            label="Nouveau mot de passe"
            id="mot-de-passe"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Champ
            label="Confirmer le mot de passe"
            id="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <BoutonPrincipal type="submit" chargement={chargement}>
            Mettre à jour
          </BoutonPrincipal>
        </form>
      )}
    </CarteAuth>
  );
}
