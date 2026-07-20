"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";

export type DonneesActivite = {
  idLocal: string;
  parcoursId: string;
  dateActivite: string;
  titre: string;
  description: string;
  contexteId: string;
  lieu: string;
  observations: string;
  parolesEnfant: string;
  personnesPresentes: string;
  autonomieGeneraleId: string;
  statutCode: "brouillon" | "valide";
};

export type ResultatCreationActivite = { erreur: string } | { id: string };

/**
 * Appelée directement depuis le composant client (pas via <form action>),
 * pour garder le contrôle fin nécessaire à la gestion du brouillon local
 * (IndexedDB) : synchronisation uniquement après confirmation du serveur,
 * jamais avant (voir Corrections-Schema-et-Lot1.md, section 12).
 */
export async function creerActivite(
  donnees: DonneesActivite
): Promise<ResultatCreationActivite> {
  if (!donnees.titre.trim()) {
    return { erreur: "Le titre est requis." };
  }
  if (!donnees.parcoursId || !donnees.dateActivite || !donnees.contexteId) {
    return { erreur: "Le parcours, la date et le contexte sont requis." };
  }

  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erreur: "Votre session a expiré. Merci de vous reconnecter." };
  }

  const { data: statut } = await supabase
    .from("statuts_activite")
    .select("id")
    .eq("code", donnees.statutCode)
    .maybeSingle();

  if (!statut) {
    return { erreur: "Statut d'activité introuvable." };
  }

  const { error } = await supabase.from("activites").insert({
    id: donnees.idLocal,
    parcours_id: donnees.parcoursId,
    auteur_id: user.id,
    auteur_nom_affiche: user.email ?? "Parent",
    date_activite: donnees.dateActivite,
    titre: donnees.titre.trim(),
    description: donnees.description || null,
    contexte_id: donnees.contexteId,
    lieu: donnees.lieu || null,
    observations: donnees.observations || null,
    paroles_enfant: donnees.parolesEnfant || null,
    personnes_presentes: donnees.personnesPresentes || null,
    autonomie_generale_id: donnees.autonomieGeneraleId || null,
    statut_id: statut.id,
  });

  if (error) {
    return { erreur: "Impossible d'enregistrer cette activité. Merci de réessayer." };
  }

  revalidatePath("/journal");
  return { id: donnees.idLocal };
}

export async function supprimerActivite(id: string) {
  const supabase = creerClientServeur();
  await supabase.from("activites").delete().eq("id", id);
  revalidatePath("/journal");
}

export async function basculerFavori(id: string, valeurActuelle: boolean) {
  const supabase = creerClientServeur();
  await supabase.from("activites").update({ favori: !valeurActuelle }).eq("id", id);
  revalidatePath("/journal");
}

export async function basculerStatutActivite(id: string, statutActuelCode: string) {
  const nouveauCode = statutActuelCode === "valide" ? "brouillon" : "valide";
  const supabase = creerClientServeur();

  const { data: statut } = await supabase
    .from("statuts_activite")
    .select("id")
    .eq("code", nouveauCode)
    .maybeSingle();

  if (!statut) return;

  await supabase.from("activites").update({ statut_id: statut.id }).eq("id", id);
  revalidatePath("/journal");
  revalidatePath(`/journal/${id}`);
}
