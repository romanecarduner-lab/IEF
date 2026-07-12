"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CarteAuth } from "@/components/CarteAuth";
import {
  BoutonPrincipal,
  Champ,
  LienDiscret,
  MessageStatut,
} from "@/components/Formulaire";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

// useSearchParams() exige une limite Suspense pour le rendu statique
// (voir https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout).
export default function PageConnexion() {
  return (
    <Suspense>
      <FormulaireConnexion />
    </Suspense>
  );
}

function FormulaireConnexion() {
  const router = useRouter();
  const parametres = useSearchParams();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function gererEnvoi(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setChargement(true);
    console.log("Début connexion");

    const donnees = new FormData(evenement.currentTarget);
    const email = String(donnees.get("email") ?? "");
    const motDePasse = String(donnees.get("mot-de-passe") ?? "");

    // Toute la logique est dans un try/catch/finally : quelle que soit
    // l'étape qui échoue (configuration manquante, réseau, réponse
    // Supabase en erreur), le bouton ne doit jamais rester bloqué sur
    // "Un instant…" sans message.
    try {
      const supabase = creerClientNavigateur();
      const { error } = await avecDelaiMaximal(
        supabase.auth.signInWithPassword({ email, password: motDePasse })
      );
      console.log("Réponse Supabase reçue");

      if (error) {
        console.error("Erreur Supabase", error.message);
        setErreur("Adresse mail ou mot de passe incorrect.");
        return;
      }

      const suite = parametres.get("suite") || "/tableau-de-bord";
      router.push(suite);
      router.refresh();
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de la connexion", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargement(false);
    }
  }

  return (
    <CarteAuth
      eyebrow="Instruction en famille"
      titre="Content de vous revoir"
      pied={
        <>
          Pas encore de compte ?{" "}
          <LienDiscret href="/inscription">Créer un espace</LienDiscret>
        </>
      }
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
        <Champ
          label="Mot de passe"
          id="mot-de-passe"
          type="password"
          autoComplete="current-password"
          required
        />
        <div className="mb-2 mt-1 text-right">
          <LienDiscret href="/mot-de-passe-oublie">
            Mot de passe oublié ?
          </LienDiscret>
        </div>
        <BoutonPrincipal type="submit" chargement={chargement}>
          Se connecter
        </BoutonPrincipal>
      </form>
    </CarteAuth>
  );
}
