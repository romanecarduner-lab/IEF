// Brouillon local du journal pédagogique, stocké dans IndexedDB (pas
// Supabase — voir Corrections-Schema-et-Lot1.md, A1). Un seul brouillon
// "en cours" à la fois pour la V1 : suffisant pour résister à une perte de
// connexion ou une fermeture accidentelle pendant la saisie d'une activité.

const NOM_BASE = "ief-brouillons";
const NOM_MAGASIN = "activites";
const CLE_BROUILLON_EN_COURS = "activite-en-cours";

export type DonneesBrouillonActivite = {
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

type EnregistrementBrouillon = {
  id: string; // toujours CLE_BROUILLON_EN_COURS pour la V1
  idLocal: string; // uuid client, deviendra l'id Supabase à la synchronisation
  donnees: DonneesBrouillonActivite;
  sauvegardeLe: number;
};

function ouvrirBase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponible dans cet environnement."));
      return;
    }
    const requete = indexedDB.open(NOM_BASE, 1);
    requete.onupgradeneeded = () => {
      requete.result.createObjectStore(NOM_MAGASIN, { keyPath: "id" });
    };
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error);
  });
}

export async function sauvegarderBrouillon(
  idLocal: string,
  donnees: DonneesBrouillonActivite
): Promise<void> {
  const base = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const transaction = base.transaction(NOM_MAGASIN, "readwrite");
    const enregistrement: EnregistrementBrouillon = {
      id: CLE_BROUILLON_EN_COURS,
      idLocal,
      donnees,
      sauvegardeLe: Date.now(),
    };
    transaction.objectStore(NOM_MAGASIN).put(enregistrement);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function lireBrouillon(): Promise<EnregistrementBrouillon | null> {
  const base = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const transaction = base.transaction(NOM_MAGASIN, "readonly");
    const requete = transaction.objectStore(NOM_MAGASIN).get(CLE_BROUILLON_EN_COURS);
    requete.onsuccess = () => resolve(requete.result ?? null);
    requete.onerror = () => reject(requete.error);
  });
}

export async function supprimerBrouillon(): Promise<void> {
  const base = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const transaction = base.transaction(NOM_MAGASIN, "readwrite");
    transaction.objectStore(NOM_MAGASIN).delete(CLE_BROUILLON_EN_COURS);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
