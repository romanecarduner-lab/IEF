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
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

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
    console.log("Début inscription");

    try {
      const supabase = creerClientNavigateur();
      const { data, error } = await avecDelaiMaximal(
        supabase.auth.signUp({
          email,
          password: motDePasse,
          options: {
            // Utilisé lors de la toute première connexion pour nommer
            // l'espace familial créé automatiquement (voir
            // (protege)/layout.tsx). La création de l'espace n'a lieu
            // qu'à ce moment-là, jamais ici : si la confirmation par mail
            // est activée (réglage par défaut de Supabase), signUp() ne
            // renvoie encore aucune session exploitable.
            data: { nom_famille: nomFamille || "Ma famille" },
            emailRedirectTo: `${window.location.origin}/connexion`,
          },
        })
      );
      console.log("Réponse Supabase reçue");

      if (error) {
        console.error("Erreur Supabase", error.message);
        setErreur(traduireErreur(error.message));
        return;
      }

      // Compte créé, mais aucune session tant que le mail n'est pas
      // confirmé (comportement par défaut de Supabase) : on ne tente
      // jamais de créer l'espace familial ici.
      console.log(
        data.session
          ? "Compte créé, session déjà active (confirmation par mail désactivée)"
          : "Compte créé, confirmation par mail requise avant toute session"
      );
      setEnvoye(true);
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de l'inscription", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargement(false);
    }
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
