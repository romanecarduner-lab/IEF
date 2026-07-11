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

export default function PageMotDePasseOublie() {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  async function gererEnvoi(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setChargement(true);

    const donnees = new FormData(evenement.currentTarget);
    const email = String(donnees.get("email") ?? "");

    const supabase = creerClientNavigateur();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialisation`,
    });

    setChargement(false);

    // Message identique que l'adresse existe ou non, pour ne pas révéler
    // quelles adresses sont enregistrées.
    if (!error) setEnvoye(true);
    else setErreur("Une erreur est survenue. Merci de réessayer.");
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
