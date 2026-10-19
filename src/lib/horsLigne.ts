"use client";

import { lireFile } from "./fileAttente";

/**
 * A appeler a la deconnexion : retire du telephone les pages gardees pour
 * le mode hors-ligne, pour qu'elles ne restent pas accessibles a la
 * personne suivante qui se servirait du meme appareil.
 */
export async function viderCachePagesHorsLigne(): Promise<void> {
  try {
    if ("caches" in window) {
      const noms = await caches.keys();
      await Promise.all(noms.filter((n) => n.startsWith("ief-pages-")).map((n) => caches.delete(n)));
    }
    const reg = await navigator.serviceWorker?.getRegistration();
    reg?.active?.postMessage({ type: "VIDER" });
  } catch {
    // sans consequence
  }
}

/**
 * Se deconnecter alors que des activites n'ont pas encore ete envoyees ne
 * les perd pas (elles restent sur l'appareil et partent a la prochaine
 * connexion du meme compte), mais mieux vaut en etre conscient.
 */
export async function confirmerDeconnexionSiFileNonVide(): Promise<boolean> {
  try {
    const restantes = await lireFile();
    if (restantes.length === 0) return true;
    return window.confirm(
      `${restantes.length} activité${restantes.length > 1 ? "s" : ""} n'${
        restantes.length > 1 ? "ont" : "a"
      } pas encore été envoyée${restantes.length > 1 ? "s" : ""}. Elles restent sur ce téléphone et partiront à votre prochaine connexion avec ce compte. Se déconnecter quand même ?`
    );
  } catch {
    return true;
  }
}
