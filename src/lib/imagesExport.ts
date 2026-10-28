import sharp from "sharp";

/**
 * Redresse une photo avant de l'inserer dans un PowerPoint.
 * Les telephones stockent souvent les pixels en paysage et notent la
 * rotation dans les metadonnees EXIF : le PDF la respecte, mais PowerPoint
 * et Canva l'ignorent (photos coupees ou tournees). On applique donc la
 * rotation aux pixels, et on reduit la taille (fichier plus leger).
 * En cas d'echec, la photo d'origine est gardee.
 */
export async function orienterImage(base64: string): Promise<string> {
  try {
    const buffer = await sharp(Buffer.from(base64, "base64"))
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return buffer.toString("base64");
  } catch (erreur) {
    console.error("Impossible de redresser une photo pour le PowerPoint", erreur);
    return base64;
  }
}
