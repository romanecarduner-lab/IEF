import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { empreinteJeton } from "@/lib/invitations";
import { CarteAuth } from "@/components/CarteAuth";
import { AccepterInvitation } from "./AccepterInvitation";

export const dynamic = "force-dynamic";

const MESSAGES_INVALIDE: Record<string, string> = {
  introuvable: "Ce lien d'invitation n'existe pas. Vérifiez qu'il est complet.",
  annulee: "Cette invitation a été annulée. Demandez un nouveau lien à la personne qui vous a invitée.",
  utilisee: "Ce lien a déjà été utilisé. Si c'était vous, connectez-vous simplement.",
  expiree: "Ce lien a expiré (il est valable 7 jours). Demandez un nouveau lien.",
};

/**
 * Page d'arrivee d'une invitation. Accessible sans compte : elle montre
 * le nom de l'espace, puis propose de creer un compte, de se connecter,
 * ou (si deja connecte) de rejoindre l'espace.
 */
export default async function PageInvitation({ params }: { params: { token: string } }) {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: apercu } = await supabase.rpc("rpc_apercu_invitation", {
    p_token_hash: empreinteJeton(params.token),
  });
  const ligne = (Array.isArray(apercu) ? apercu[0] : apercu) as
    | { motif: string; nom_famille: string | null; email_restreint: boolean; prenom_invite: string | null }
    | undefined;

  if (!ligne || ligne.motif !== "ok") {
    return (
      <CarteAuth eyebrow="Instruction en famille" titre="Invitation indisponible">
        <p className="text-sm text-ardoise">
          {MESSAGES_INVALIDE[ligne?.motif ?? "introuvable"] ?? MESSAGES_INVALIDE.introuvable}
        </p>
        <p className="mt-4 text-sm">
          <Link href={user ? "/tableau-de-bord" : "/connexion"} className="underline">
            {user ? "Aller à mon espace" : "Se connecter"}
          </Link>
        </p>
      </CarteAuth>
    );
  }

  const nom = ligne.nom_famille ?? "cet espace";
  const suite = `/invitation/${params.token}`;

  return (
    <CarteAuth
      eyebrow="Instruction en famille"
      titre={ligne.prenom_invite ? `Bonjour ${ligne.prenom_invite}` : "Vous êtes invité·e"}
      sousTitre={`Vous êtes invité·e à rejoindre l'espace familial « ${nom} », pour suivre ensemble les activités et les progrès.`}
    >
      {user ? (
        <div className="space-y-3">
          <p className="text-sm text-ardoise">
            Vous serez parent dans cet espace, avec les mêmes droits que la personne qui vous
            invite : voir et ajouter des activités, des photos, la progression et les dossiers.
          </p>
          <AccepterInvitation jeton={params.token} nomFamille={nom} />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ardoise">
            {ligne.email_restreint
              ? "Cette invitation est réservée à une adresse e-mail précise : utilisez celle qui a reçu le message."
              : "Créez votre compte, ou connectez-vous si vous en avez déjà un."}
          </p>
          <Link href={`/inscription?invitation=${encodeURIComponent(params.token)}`} className="bouton-primaire w-full">
            Créer mon compte
          </Link>
          <Link href={`/connexion?suite=${encodeURIComponent(suite)}`} className="bouton-secondaire w-full">
            J&rsquo;ai déjà un compte
          </Link>
        </div>
      )}
    </CarteAuth>
  );
}
