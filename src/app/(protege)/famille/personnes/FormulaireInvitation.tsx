"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerInvitation } from "./actions";
import { MessageStatut } from "@/components/Formulaire";

type Resultat = { lien: string; email: string | null; prenom: string | null };

export function FormulaireInvitation({ nomFamille, monPrenom }: { nomFamille: string; monPrenom: string }) {
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [copie, setCopie] = useState(false);

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setCopie(false);
    setEnCours(true);
    try {
      const r = await creerInvitation(prenom, email);
      if ("erreur" in r) {
        setErreur(r.erreur);
        return;
      }
      setResultat(r);
      setPrenom("");
      setEmail("");
      router.refresh();
    } catch (err) {
      console.error("Erreur lors de la creation de l'invitation", err);
      setErreur("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setEnCours(false);
    }
  }

  const message = resultat
    ? `Bonjour${resultat.prenom ? " " + resultat.prenom : ""},\n\n${monPrenom ? monPrenom + " vous invite" : "Je vous invite"} à rejoindre l'espace familial « ${nomFamille} » pour suivre ensemble les activités et les progrès de nos enfants.\n\nOuvrez ce lien (valable 7 jours, à usage unique) :\n${resultat.lien}\n\nÀ bientôt !`
    : "";

  async function copier() {
    if (!resultat) return;
    try {
      await navigator.clipboard.writeText(resultat.lien);
      setCopie(true);
    } catch {
      setErreur("La copie n'a pas fonctionné. Sélectionnez le lien et copiez-le à la main.");
    }
  }

  async function partager() {
    if (!resultat) return;
    try {
      await navigator.share({ title: "Invitation", text: message });
    } catch {
      /* partage annule : rien a faire */
    }
  }

  const peutPartager = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="space-y-4">
      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}

      <form onSubmit={envoyer} className="grid gap-3 sm:grid-cols-2" noValidate>
        <div>
          <label htmlFor="prenom-invite" className="mb-1.5 block text-sm font-medium text-encre">
            Prénom (facultatif)
          </label>
          <input
            id="prenom-invite"
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="champ-saisie w-full"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="email-invite" className="mb-1.5 block text-sm font-medium text-encre">
            Adresse e-mail (facultatif)
          </label>
          <input
            id="email-invite"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="champ-saisie w-full"
            autoComplete="off"
            inputMode="email"
          />
        </div>
        <p className="text-xs text-ardoise sm:col-span-2">
          Avec une adresse e-mail, le lien est réservé à cette adresse. Sans adresse, quiconque
          reçoit le lien peut l&rsquo;utiliser, une seule fois.
        </p>
        <div className="sm:col-span-2">
          <button type="submit" disabled={enCours} className="bouton-primaire">
            {enCours ? "Création…" : "Créer le lien d'invitation"}
          </button>
        </div>
      </form>

      {resultat && (
        <div className="rounded-doux border border-mousse-fonce/30 bg-white p-4">
          <p className="text-sm font-medium text-encre">Le lien est prêt</p>
          <p className="mt-1 text-xs text-ardoise">
            Il n&rsquo;est affiché qu&rsquo;une fois. S&rsquo;il se perd, annulez l&rsquo;invitation
            et créez-en une autre.
          </p>
          <input
            readOnly
            value={resultat.lien}
            onFocus={(e) => e.currentTarget.select()}
            className="champ-saisie mt-3 w-full text-xs"
            aria-label="Lien d'invitation"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copier} className="bouton-secondaire bouton-petit">
              {copie ? "Lien copié" : "Copier le lien"}
            </button>
            {peutPartager && (
              <button type="button" onClick={partager} className="bouton-secondaire bouton-petit">
                Partager
              </button>
            )}
            {resultat.email && (
              <a
                className="bouton-secondaire bouton-petit"
                href={`mailto:${resultat.email}?subject=${encodeURIComponent(
                  `Invitation à rejoindre l'espace « ${nomFamille} »`
                )}&body=${encodeURIComponent(message)}`}
              >
                Envoyer par e-mail
              </a>
            )}
          </div>
          {resultat.email && (
            <p className="mt-2 text-xs text-ardoise">
              « Envoyer par e-mail » ouvre votre messagerie avec le message déjà écrit : il ne part
              qu&rsquo;une fois que vous l&rsquo;envoyez vous-même.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
