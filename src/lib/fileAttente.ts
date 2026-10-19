// File d'attente locale des activites saisies sans reseau (IndexedDB).
//
// Regle d'or : un element n'est JAMAIS retire de cette file tant que le
// serveur n'a pas confirme avoir tout recu (activite, photos, competences,
// copies). Chaque etape franchie est enregistree au fur et a mesure, pour
// qu'un envoi interrompu reprenne la ou il s'est arrete, sans doublon.

import type { DonneesActivite } from "@/app/(protege)/journal/actions";

const NOM_BASE = "ief-file-attente";
const NOM_MAGASIN = "activites";

export type PhotoEnAttente = {
  id: string;
  nom: string;
  estImage: boolean;
  /** Image deja compressee (ou fichier d'origine pour un document). */
  fichier: Blob;
  miniature: Blob | null;
  typeMime: string;
};

export type ElementFile = {
  idLocal: string;
  /** Espace familial du compte qui a saisi : seuls ses elements sont envoyes. */
  familleId: string;
  creeLe: number;
  donnees: DonneesActivite;
  photos: PhotoEnAttente[];
  competences: { id: string; niveauAutonomieId: string }[];
  autresEnfantsIds: string[];
  etat: {
    activiteCreee: boolean;
    /** photo.id -> chemins deja envoyes dans le stockage. */
    photosTeleversees: Record<string, { chemin: string; miniature: string | null }>;
    photosFaites: string[];
    competencesFaites: boolean;
    copiesFaites: string[];
  };
  derniereErreur: string | null;
  tentatives: number;
};

function ouvrirBase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponible."));
      return;
    }
    const requete = indexedDB.open(NOM_BASE, 1);
    requete.onupgradeneeded = () => {
      requete.result.createObjectStore(NOM_MAGASIN, { keyPath: "idLocal" });
    };
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error);
  });
}

async function transaction<T>(
  mode: IDBTransactionMode,
  action: (magasin: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const base = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const tx = base.transaction(NOM_MAGASIN, mode);
    const requete = action(tx.objectStore(NOM_MAGASIN));
    tx.oncomplete = () => {
      base.close();
      resolve(requete.result);
    };
    tx.onerror = () => {
      base.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      base.close();
      reject(tx.error);
    };
  });
}

export function ajouterALaFile(element: ElementFile): Promise<IDBValidKey> {
  return transaction("readwrite", (m) => m.put(element));
}

export function mettreAJourElement(element: ElementFile): Promise<IDBValidKey> {
  return transaction("readwrite", (m) => m.put(element));
}

export function supprimerElement(idLocal: string): Promise<undefined> {
  return transaction("readwrite", (m) => m.delete(idLocal)) as Promise<undefined>;
}

export async function lireFile(): Promise<ElementFile[]> {
  const tous = await transaction<ElementFile[]>("readonly", (m) => m.getAll());
  return tous.sort((a, b) => a.creeLe - b.creeLe);
}

export const EVENEMENT_FILE_CHANGEE = "ief-file-attente-changee";

export function signalerChangementFile(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENEMENT_FILE_CHANGEE));
}
