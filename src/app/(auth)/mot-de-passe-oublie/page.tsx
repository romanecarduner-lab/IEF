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

export default function PageMotDePasseOublie() {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  async function gererEnvoi(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setChargement(true);
    console.log("Début demande de réinitialisation");

    const donnees = new FormData(evenement.currentTarget);
    const email = String(donnees.get("email") ?? "");

    try {
      const supabase = creerClientNavigateur();
      const { error } = await avecDelaiMaximal(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reinitialisation`,
        })
      );
      console.log("Réponse Supabase reçue");

      // Message identique que l'adresse existe ou non, pour ne pas révéler
      // quelles adresses sont enregistrées.
      if (error) {
        console.error("Erreur Supabase", error.message);
      }
      setEnvoye(true);
    } catch (erreurInattendue) {
      console.error(
        "Erreur inattendue lors de la demande de réinitialisation",
        erreurInattendue
      );
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargement(false);
    }
  }

  if (envoye) {
    return (
      <CarteAuth eyebrow="Instruction en famille" titre="Vérifiez votre mail">
        <MessageStatut type="succes">
          Si un compte existe pour cette adresse, un lien de
          réinitialisation vient d&rsquo;être envoyé.
        </MessageStatut>
      </CarteAuth>
    );
  }

  return (
    <CarteAuth
      eyebrow="Instruction en famille"
      titre="Mot de passe oublié"
      sousTitre="Indiquez votre adresse mail, nous vous enverrons un lien de réinitialisation."
      pied={<LienDiscret href="/connexion">Retour à la connexion</LienDiscret>}
    >
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}
      <form onSubmit={gererEnvoi} noValidate>
        <Champ
          label="Adresse mail"
          id="email"
          type="email"
          autoComplete="email"
          required
        />
        <BoutonPrincipal type="submit" chargement={chargement}>
          Envoyer le lien
        </BoutonPrincipal>
      </form>
    </CarteAuth>
  );
}
