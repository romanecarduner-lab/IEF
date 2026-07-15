// Compression cote client, avant upload vers Supabase Storage. Reduit la
// bande passante et le cout de stockage (voir Corrections-Schema-et-Lot1.md,
// section 11). createImageBitmap({ imageOrientation: 'from-image' }) corrige
// automatiquement l'orientation EXIF sans avoir a la parser manuellement.

async function redimensionner(fichier: File, largeurMax: number, qualite: number): Promise<Blob> {
  const bitmap = await createImageBitmap(fichier, { imageOrientation: "from-image" });

  const ratio = Math.min(1, largeurMax / bitmap.width);
  const largeur = Math.round(bitmap.width * ratio);
  const hauteur = Math.round(bitmap.height * ratio);

  const canevas = document.createElement("canvas");
  canevas.width = largeur;
  canevas.height = hauteur;
  const contexte = canevas.getContext("2d");
  if (!contexte) throw new Error("Impossible d'initialiser le traitement d'image.");
  contexte.drawImage(bitmap, 0, 0, largeur, hauteur);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canevas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression de l'image echouee."))),
      "image/jpeg",
      qualite
    );
  });
}

export async function preparerImage(fichier: File): Promise<{ image: Blob; miniature: Blob }> {
  const [image, miniature] = await Promise.all([
    redimensionner(fichier, 2000, 0.82),
    redimensionner(fichier, 400, 0.75),
  ]);
  return { image, miniature };
}

export function estImage(fichier: File): boolean {
  return fichier.type.startsWith("image/");
}
