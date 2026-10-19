"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { nomAuteurPourEnregistrement } from "@/lib/auteurs";

export type DonneesTrace = {
  activiteId: string;
  typeCode: string;
  cheminStockage: string | null;
  miniatureCheminStockage: string | null;
  contenuTexte: string | null;
  legende: string;
  dateTrace: string;
  /** Rang d'affichage voulu (0 = premiere). Absent : la trace passe apres les autres. */
  ordreAffichage?: number;
};

export async function creerTrace(
  donnees: DonneesTrace
): Promise<{ erreur: string } | { id: string }> {
  if (!donnees.cheminStockage && !donnees.contenuTexte?.trim()) {
    return { erreur: "Il faut un fichier ou un texte." };
  }

  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erreur: "Votre session a expiré. Merci de vous reconnecter." };
  }

  const { data: type } = await supabase
    .from("types_trace")
    .select("id")
    .eq("code", donnees.typeCode)
    .maybeSingle();
  const { data: statut } = await supabase
    .from("statuts_trace")
    .select("id")
    .eq("code", "prive")
    .maybeSingle();

  if (!type || !statut) {
    return { erreur: "Configuration des traces introuvable." };
  }

  // Rang d'affichage : celui demande, sinon a la suite des traces deja
  // presentes (la premiere photo d'une activite sert d'apercu dans le Journal).
  let ordreAffichage = donnees.ordreAffichage;
  if (ordreAffichage === undefined) {
    const { data: derniere } = await supabase
      .from("traces")
      .select("ordre_affichage")
      .eq("activite_id", donnees.activiteId)
      .order("ordre_affichage", { ascending: false })
      .limit(1)
      .maybeSingle();
    ordreAffichage = derniere ? ((derniere.ordre_affichage as number) ?? 0) + 1 : 0;
  }

  const { data, error } = await supabase
    .from("traces")
    .insert({
      ordre_affichage: ordreAffichage,
      activite_id: donnees.activiteId,
      type_id: type.id,
      chemin_stockage: donnees.cheminStockage,
      miniature_chemin_stockage: donnees.miniatureCheminStockage,
      contenu_texte: donnees.contenuTexte || null,
      legende: donnees.legende || null,
      date_trace: donnees.dateTrace,
      statut_id: statut.id,
      auteur_id: user.id,
      auteur_nom_affiche: nomAuteurPourEnregistrement(user),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { erreur: "Impossible d'enregistrer cette trace. Merci de réessayer." };
  }

  revalidatePath(`/journal/${donnees.activiteId}`);
  return { id: data.id };
}

export async function supprimerTrace(id: string, activiteId: string) {
  const supabase = creerClientServeur();

  const { data: trace } = await supabase
    .from("traces")
    .select("chemin_stockage, miniature_chemin_stockage")
    .eq("id", id)
    .maybeSingle();

  // Le fichier Storage n'est jamais supprimé automatiquement par une
  // cascade SQL : on le retire explicitement avant de retirer la ligne.
  if (trace) {
    const chemins = [trace.chemin_stockage, trace.miniature_chemin_stockage].filter(
      (c): c is string => Boolean(c)
    );
    if (chemins.length > 0) {
      await supabase.storage.from("traces-pedagogiques").remove(chemins);
    }
  }

  await supabase.from("traces").delete().eq("id", id);
  revalidatePath(`/journal/${activiteId}`);
}

/**
 * Enregistre le nouvel ordre des traces d'une activite (la premiere sert
 * d'apercu dans le Journal). La liste recue doit contenir exactement les
 * traces de l'activite : rien n'est jamais supprime ni ajoute ici.
 */
export async function reordonnerTraces(
  activiteId: string,
  idsOrdonnes: string[]
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Votre session a expiré. Merci de vous reconnecter." };

  const { data: existantes, error: erreurLecture } = await supabase
    .from("traces")
    .select("id")
    .eq("activite_id", activiteId);
  if (erreurLecture || !existantes) {
    return { erreur: "Impossible de lire les photos de cette activité. Merci de réessayer." };
  }

  const idsExistants = new Set(existantes.map((t) => t.id as string));
  const idsRecus = new Set(idsOrdonnes);
  if (
    idsRecus.size !== idsOrdonnes.length ||
    idsRecus.size !== idsExistants.size ||
    idsOrdonnes.some((id) => !idsExistants.has(id))
  ) {
    return {
      erreur:
        "La liste des photos a changé entre-temps (autre appareil ?). Rechargez la page puis réessayez.",
    };
  }

  const resultats = await Promise.all(
    idsOrdonnes.map((id, rang) =>
      supabase.from("traces").update({ ordre_affichage: rang }).eq("id", id).eq("activite_id", activiteId)
    )
  );
  if (resultats.some((r) => r.error)) {
    return { erreur: "L'ordre n'a pas pu être enregistré. Merci de réessayer." };
  }

  revalidatePath(`/journal/${activiteId}`);
  revalidatePath("/journal");
  return { ok: true };
}
