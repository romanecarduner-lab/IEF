import type { SupabaseClient } from "@supabase/supabase-js";
import { preparerImage, estImage } from "./compressionImage";

export type ResultatTeleversement = {
  cheminStockage: string;
  miniatureCheminStockage: string | null;
};

/**
 * Compresse (si image) puis envoie un fichier vers le bucket privé
 * traces-pedagogiques, sous le prefixe de la famille (verifie par les
 * policies RLS de storage.objects). Partagee entre le formulaire d'ajout
 * de trace et le raccourci "photo directe" du formulaire d'activite.
 */
export async function televerserFichierTrace(
  supabase: SupabaseClient,
  familleId: string,
  fichier: File,
  onEtape?: (etape: string) => void
): Promise<ResultatTeleversement> {
  const idTrace = crypto.randomUUID();

  if (estImage(fichier)) {
    onEtape?.("Compression de l'image…");
    const { image, miniature } = await preparerImage(fichier);

    onEtape?.("Envoi de l'image…");
    const cheminImage = `${familleId}/${idTrace}.jpg`;
    const cheminMiniature = `${familleId}/${idTrace}_thumb.jpg`;

    const [resultatImage, resultatMiniature] = await Promise.all([
      supabase.storage
        .from("traces-pedagogiques")
        .upload(cheminImage, image, { contentType: "image/jpeg" }),
      supabase.storage
        .from("traces-pedagogiques")
        .upload(cheminMiniature, miniature, { contentType: "image/jpeg" }),
    ]);

    if (resultatImage.error || resultatMiniature.error) {
      throw new Error("Echec de l'envoi de l'image.");
    }

    return { cheminStockage: cheminImage, miniatureCheminStockage: cheminMiniature };
  }

  onEtape?.("Envoi du fichier…");
  const extension = fichier.name.split(".").pop() || "bin";
  const chemin = `${familleId}/${idTrace}.${extension}`;
  const resultat = await supabase.storage
    .from("traces-pedagogiques")
    .upload(chemin, fichier, { contentType: fichier.type || undefined });

  if (resultat.error) {
    throw new Error("Echec de l'envoi du fichier.");
  }

  return { cheminStockage: chemin, miniatureCheminStockage: null };
}

/**
 * Envoi d'une photo ou d'un document deja prepares (compresses) : utilise
 * par l'envoi differe des activites saisies sans reseau. Ne refait aucune
 * compression.
 */
export async function televerserBlobsTrace(
  supabase: SupabaseClient,
  familleId: string,
  piece: { fichier: Blob; miniature: Blob | null; estImage: boolean; nom: string; typeMime: string }
): Promise<ResultatTeleversement> {
  const idTrace = crypto.randomUUID();

  if (piece.estImage) {
    const cheminImage = `${familleId}/${idTrace}.jpg`;
    const cheminMiniature = piece.miniature ? `${familleId}/${idTrace}_thumb.jpg` : null;
    const envois = [
      supabase.storage
        .from("traces-pedagogiques")
        .upload(cheminImage, piece.fichier, { contentType: "image/jpeg" }),
    ];
    if (cheminMiniature && piece.miniature) {
      envois.push(
        supabase.storage
          .from("traces-pedagogiques")
          .upload(cheminMiniature, piece.miniature, { contentType: "image/jpeg" })
      );
    }
    const resultats = await Promise.all(envois);
    if (resultats.some((r) => r.error)) throw new Error("Echec de l'envoi de l'image.");
    return { cheminStockage: cheminImage, miniatureCheminStockage: cheminMiniature };
  }

  const extension = piece.nom.split(".").pop() || "bin";
  const chemin = `${familleId}/${idTrace}.${extension}`;
  const resultat = await supabase.storage
    .from("traces-pedagogiques")
    .upload(chemin, piece.fichier, { contentType: piece.typeMime || undefined });
  if (resultat.error) throw new Error("Echec de l'envoi du fichier.");
  return { cheminStockage: chemin, miniatureCheminStockage: null };
}
