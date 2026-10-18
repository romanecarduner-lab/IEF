import { creerClientServeur } from "@/lib/supabase/server";
import { AideContextuelle } from "@/components/AideContextuelle";
import { FormulaireInvitation } from "./FormulaireInvitation";
import { BoutonAnnulerInvitation, BoutonRetirerMembre, ReglageAuteur } from "./ActionsPersonnes";

export const dynamic = "force-dynamic";

type Membre = {
  user_id: string;
  prenom: string | null;
  email: string;
  role_code: string;
  depuis: string;
  est_moi: boolean;
};

export default async function PagePersonnes() {
  const supabase = creerClientServeur();

  const { data: appartenance } = await supabase
    .from("utilisateurs_familles")
    .select("famille_id, familles(nom, afficher_auteur)")
    .limit(1)
    .maybeSingle();

  if (!appartenance) {
    return <p className="text-sm text-ardoise">Aucun espace familial associé à votre compte.</p>;
  }

  const famille = (Array.isArray(appartenance.familles) ? appartenance.familles[0] : appartenance.familles) as
    | { nom: string; afficher_auteur?: boolean }
    | null;
  const familleId = appartenance.famille_id as string;

  const [{ data: membresBruts, error: erreurMembres }, { data: invitations }] = await Promise.all([
    supabase.rpc("rpc_membres_famille", { p_famille_id: familleId }),
    supabase
      .from("invitations_famille")
      .select("id, email, prenom_invite, expire_le, created_at")
      .is("utilise_le", null)
      .is("annule_le", null)
      .gt("expire_le", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const miseAJourManquante = Boolean(erreurMembres);
  const membres = (membresBruts ?? []) as Membre[];
  const moi = membres.find((m) => m.est_moi);

  return (
    <div className="space-y-10">
      <h1 className="font-display text-2xl italic text-encre">Personnes de l&rsquo;espace</h1>
      <AideContextuelle titre="Personnes de l'espace" variante="page">
        Invitez un second parent à rejoindre cet espace : il voit les mêmes enfants, activités, photos,
        progressions et dossiers que vous, avec les mêmes droits. Rien n&rsquo;est copié ni déplacé :
        c&rsquo;est le même espace, à deux.
      </AideContextuelle>

      {miseAJourManquante && (
        <p className="rounded-doux border border-alerte/40 bg-white p-4 text-sm text-alerte">
          Une mise à jour de la base de données est manquante (invitations). Contactez la personne qui
          administre l&rsquo;application.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg italic text-encre">Qui a accès</h2>
        <ul className="space-y-2">
          {membres.map((m) => {
            const nom = m.prenom ?? m.email;
            return (
              <li key={m.user_id} className="carte flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-encre">
                    {nom}
                    {m.est_moi && <span className="ml-2 text-xs font-normal text-ardoise">(vous)</span>}
                  </p>
                  <p className="break-all text-xs text-ardoise">
                    {m.prenom ? `${m.email} · ` : ""}Parent · depuis le{" "}
                    {new Date(m.depuis).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {!m.est_moi && <BoutonRetirerMembre userId={m.user_id} nom={nom} />}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg italic text-encre">Inviter un second parent</h2>
        <FormulaireInvitation nomFamille={famille?.nom ?? "notre espace"} monPrenom={moi?.prenom ?? ""} />
      </section>

      {(invitations ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg italic text-encre">Invitations en attente</h2>
          <ul className="space-y-2">
            {(invitations ?? []).map((i) => (
              <li key={i.id as string} className="carte flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="text-sm text-encre">
                    {(i.prenom_invite as string | null) ?? "Invitation"}
                    {i.email ? <span className="break-all text-ardoise"> · {i.email as string}</span> : null}
                  </p>
                  <p className="text-xs text-ardoise">
                    Valable jusqu&rsquo;au {new Date(i.expire_le as string).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <BoutonAnnulerInvitation id={i.id as string} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg italic text-encre">Réglage</h2>
        <ReglageAuteur initial={Boolean(famille?.afficher_auteur)} />
      </section>
    </div>
  );
}
