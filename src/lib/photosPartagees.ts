"use client";

/**
 * Photos partagees depuis la galerie du telephone (menu Partager, Android).
 * Le service worker (public/sw.js) les range dans IndexedDB puis ouvre le
 * formulaire d'activite avec ?partage=1. Cette fonction les relit et les
 * supprime, pour qu'elles ne reapparaissent pas a la visite suivante.
 * Sans effet (liste vide) quand rien n'a ete partage. Ne jette jamais d'erreur.
 */
const BASE = "ief-partage";
const MAGASIN = "fichiers";

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resoudre, rejeter) => {
    const requete = indexedDB.open(BASE, 1);
    requete.onupgradeneeded = () => requete.result.createObjectStore(MAGASIN, { autoIncrement: true });
    requete.onsuccess = () => resoudre(requete.result);
    requete.onerror = () => rejeter(requete.error);
  });
}

export async function reprendrePhotosPartagees(): Promise<File[]> {
  try {
    if (typeof indexedDB === "undefined") return [];
    const base = await ouvrir();
    const fichiers = await new Promise<File[]>((resoudre, rejeter) => {
      const tx = base.transaction(MAGASIN, "readwrite");
      const magasin = tx.objectStore(MAGASIN);
      const lecture = magasin.getAll();
      lecture.onsuccess = () => {
        const trouves = (lecture.result as unknown[]).filter((f): f is Blob => f instanceof Blob);
        magasin.clear();
        resoudre(
          trouves.map((f) =>
            f instanceof File ? f : new File([f], "photo.jpg", { type: f.type || "image/jpeg" })
          )
        );
      };
      tx.onerror = () => rejeter(tx.error);
    });
    base.close();
    return fichiers;
  } catch {
    return [];
  }
}
