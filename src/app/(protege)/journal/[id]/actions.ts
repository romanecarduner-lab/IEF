"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";

export type DonneesTrace = {
  activiteId: string;
  typeCode: string;
  cheminStockage: string | null;
  miniatureCheminStockage: string | null;
  contenuTexte: string | null;
  legende: string;
  dateTrace: string;
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

  const { data, error } = await supabase
    .from("traces")
    .insert({
      activite_id: donnees.activiteId,
      type_id: type.id,
      chemin_stockage: donnees.cheminStockage,
      miniature_chemin_stockage: donnees.miniatureCheminStockage,
      contenu_texte: donnees.contenuTexte || null,
      legende: donnees.legende || null,
      date_trace: donnees.dateTrace,
      statut_id: statut.id,
      auteur_id: user.id,
      auteur_nom_affiche: user.email ?? "Parent",
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
