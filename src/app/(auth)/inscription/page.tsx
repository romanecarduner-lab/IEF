"use client";

import { useState } from "react";
import { CarteAuth } from "@/components/CarteAuth";
import {
  BoutonPrincipal,
  Champ,
  LienDiscret,
  MessageStatut,
} from "@/components/Formulaire";
import { creerClientNavigateur } from "@/lib/supabase/client";

export default function PageInscription() {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  async function gererEnvoi(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);

    const donnees = new FormData(evenement.currentTarget);
    const email = String(donnees.get("email") ?? "");
    const motDePasse = String(donnees.get("mot-de-passe") ?? "");
    const confirmation = String(donnees.get("confirmation") ?? "");
    const nomFamille = String(donnees.get("nom-famille") ?? "").trim();

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
    const { error } = await supabase.auth.signUp({
      email,
      password: motDePasse,
      options: {
        // Utilisé lors de la toute première connexion pour nommer l'espace
        // familial créé automatiquement (voir (protege)/layout.tsx).
        data: { nom_famille: nomFamille || "Ma famille" },
        emailRedirectTo: `${window.location.origin}/connexion`,
      },
    });
    setChargement(false);

    if (error) {
      setErreur(traduireErreur(error.message));
      return;
    }
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <CarteAuth
        eyebrow="Instruction en famille"
        titre="Vérifiez votre boîte mail"
      >
        <MessageStatut type="succes">
          Un mail de confirmation vient d&rsquo;être envoyé. Cliquez sur le
          lien qu&rsquo;il contient pour activer votre compte, puis
          connectez-vous.
        </MessageStatut>
      </CarteAuth>
    );
  }

  return (
    <CarteAuth
      eyebrow="Instruction en famille"
      titre="Créer votre espace"
      sousTitre="Quelques informations suffisent pour commencer."
      pied={
        <>
          Déjà un compte ?{" "}
          <LienDiscret href="/connexion">Se connecter</LienDiscret>
        </>
      }
    >
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
      <form onSubmit={gererEnvoi} noValidate>
        <Champ
          label="Nom de votre espace familial"
          id="nom-famille"
          type="text"
          placeholder="Famille Dupont"
          autoComplete="off"
          required
        />
        <Champ
          label="Adresse mail"
          id="email"
          type="email"
          autoComplete="email"
          required
        />
        <Champ
          label="Mot de passe"
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
          Créer mon compte
        </BoutonPrincipal>
      </form>
    </CarteAuth>
  );
}

function traduireErreur(message: string): string {
  if (message.includes("already registered")) {
    return "Cette adresse mail est déjà associée à un compte.";
  }
  if (message.includes("Password")) {
    return "Le mot de passe ne respecte pas les critères requis.";
  }
  return "Une erreur est survenue. Merci de réessayer.";
}
