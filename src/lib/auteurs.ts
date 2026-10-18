import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Reglage "afficher ajoute par" de l'espace familial, et noms a afficher.
 *
 * Le nom vient du prenom de la personne (liste des membres de l'espace).
 * Pour une personne retiree de l'espace, on reprend le nom enregistre au
 * moment de l'ajout, sauf s'il s'agit d'une adresse e-mail (qu'on
 * n'affiche pas) : on ecrit alors "Un parent".
 *
 * Si la fonction SQL des invitations n'est pas encore installee, ou si le
 * reglage est desactive, rien n'est affiche et rien ne casse.
 */
export type Auteurs = {
  afficher: boolean;
  nom: (auteurId: string | null | undefined, instantane: string | null | undefined) => string | null;
};

export async function chargerAuteurs(supabase: SupabaseClient): Promise<Auteurs> {
  const aucun: Auteurs = { afficher: false, nom: () => null };

  const { data: appartenance, error } = await supabase
    .from("utilisateurs_familles")
    .select("famille_id, familles(afficher_auteur)")
    .limit(1)
    .maybeSingle();
  if (error || !appartenance) return aucun;

  const famille = (Array.isArray(appartenance.familles) ? appartenance.familles[0] : appartenance.familles) as
    | { afficher_auteur?: boolean }
    | null;
  if (!famille?.afficher_auteur) return aucun;

  const { data: membres } = await supabase.rpc("rpc_membres_famille", {
    p_famille_id: appartenance.famille_id as string,
  });
  const prenoms = new Map<string, string>();
  for (const m of (membres ?? []) as { user_id: string; prenom: string | null; email: string }[]) {
    prenoms.set(m.user_id, m.prenom ?? (m.email.split("@")[0] || "Un parent"));
  }

  return {
    afficher: true,
    nom: (auteurId, instantane) => {
      if (auteurId && prenoms.has(auteurId)) return prenoms.get(auteurId) ?? null;
      if (instantane && !instantane.includes("@")) return instantane;
      return "Un parent";
    },
  };
}

/**
 * Nom enregistre avec chaque activite ou photo ajoutee : le prenom de la
 * personne si elle l'a renseigne, sinon son adresse e-mail (comportement
 * historique), sinon "Parent".
 */
export function nomAuteurPourEnregistrement(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const prenom = user.user_metadata?.prenom;
  if (typeof prenom === "string" && prenom.trim()) return prenom.trim();
  return user.email ?? "Parent";
}
