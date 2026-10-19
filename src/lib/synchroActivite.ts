// Moteur d'envoi des activites saisies sans reseau.
//
// Pour chaque element de la file, dans l'ordre de saisie :
//   1. creation de l'activite (identifiant genere par l'appareil, donc sans
//      doublon si l'envoi est repris) ;
//   2. envoi de chaque photo, puis creation de sa trace ;
//   3. enregistrement des competences deja choisies ;
//   4. copies vers les autres enfants coches.
// Chaque etape reussie est enregistree localement avant de passer a la
// suivante. L'element n'est retire de la file qu'une fois tout confirme.

import {
  lireFile,
  mettreAJourElement,
  supprimerElement,
  signalerChangementFile,
  type ElementFile,
} from "./fileAttente";
import { creerActivite, dupliquerActiviteVersParcours } from "@/app/(protege)/journal/actions";
import { creerTrace } from "@/app/(protege)/journal/[id]/actions";
import { creerObservations } from "@/app/(protege)/journal/[id]/competences/actions";
import { televerserBlobsTrace } from "./televersementTrace";
import { creerClientNavigateur } from "./supabase/client";
import { avecDelaiMaximal } from "./delaiMaximal";
import { declencherEstimationArrierePlan } from "./estimationArrierePlan";

export type BilanSynchro = {
  envoyees: number;
  enErreur: number;
  reseauIndisponible: boolean;
  sessionExpiree: boolean;
  /** Elements envoyes, mais dont une partie annexe (competences, copies) a echoue. */
  avertissements: string[];
};

/** Reconnait une panne de reseau (par opposition a un refus du serveur). */
export function estErreurReseau(erreur: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (erreur instanceof Error) {
    if (erreur.name === "ErreurDelaiDepasse") return true;
    const m = erreur.message.toLowerCase();
    return (
      m.includes("failed to fetch") ||
      m.includes("load failed") ||
      m.includes("networkerror") ||
      m.includes("network request failed") ||
      m.includes("fetch failed")
    );
  }
  return false;
}

class ArretSynchro extends Error {
  constructor(public readonly motif: "reseau" | "session") {
    super(motif);
  }
}

async function enregistrer(element: ElementFile) {
  await mettreAJourElement(element);
  signalerChangementFile();
}

async function envoyerUnElement(
  element: ElementFile,
  avertissements: string[]
): Promise<"termine" | "erreur"> {
  const supabase = creerClientNavigateur();
  element.tentatives += 1;

  try {
    // 1. Activite
    if (!element.etat.activiteCreee) {
      const r = await avecDelaiMaximal(creerActivite(element.donnees), 30000);
      if ("erreur" in r) {
        if (r.erreur.includes("session a expiré")) throw new ArretSynchro("session");
        element.derniereErreur = r.erreur;
        await enregistrer(element);
        return "erreur";
      }
      element.etat.activiteCreee = true;
      element.derniereErreur = null;
      await enregistrer(element);
    }

    // 2. Photos
    let photoEnEchec = false;
    for (const photo of element.photos) {
      if (element.etat.photosFaites.includes(photo.id)) continue;
      try {
        let chemins = element.etat.photosTeleversees[photo.id];
        if (!chemins) {
          const t = await avecDelaiMaximal(
            televerserBlobsTrace(supabase, element.familleId, photo),
            90000
          );
          chemins = { chemin: t.cheminStockage, miniature: t.miniatureCheminStockage };
          element.etat.photosTeleversees[photo.id] = chemins;
          await enregistrer(element);
        }
        const rt = await avecDelaiMaximal(
          creerTrace({
            activiteId: element.idLocal,
            typeCode: photo.estImage ? "photo" : "document",
            cheminStockage: chemins.chemin,
            miniatureCheminStockage: chemins.miniature,
            contenuTexte: null,
            legende: "",
            dateTrace: element.donnees.dateActivite,
          }),
          30000
        );
        if ("erreur" in rt) throw new Error(rt.erreur);
        element.etat.photosFaites.push(photo.id);
        await enregistrer(element);
      } catch (e) {
        if (estErreurReseau(e)) throw new ArretSynchro("reseau");
        photoEnEchec = true;
        element.derniereErreur = "Une photo n'a pas pu être envoyée. Nouvel essai automatique.";
        await enregistrer(element);
      }
    }
    if (photoEnEchec) return "erreur";

    // 3. Competences
    if (!element.etat.competencesFaites) {
      if (element.competences.length > 0) {
        const r = await avecDelaiMaximal(
          creerObservations({
            activiteId: element.idLocal,
            elements: element.competences.map((c) => ({
              id: c.id,
              niveauAutonomieId: c.niveauAutonomieId,
            })),
            justification: "",
            commentairePedagogique: "",
          }),
          30000
        );
        // Comme dans le formulaire en ligne, un echec des competences ne
        // bloque jamais l'activite : elle est deja enregistree, les
        // competences pourront etre ajoutees depuis sa fiche.
        if ("erreur" in r) {
          avertissements.push(
            `« ${element.donnees.titre} » : les compétences n'ont pas pu être enregistrées (à ajouter depuis la fiche).`
          );
        } else {
          declencherEstimationArrierePlan(element.idLocal);
        }
      }
      element.etat.competencesFaites = true;
      await enregistrer(element);
    }

    // 4. Copies vers les autres enfants
    for (const enfantId of element.autresEnfantsIds) {
      if (element.etat.copiesFaites.includes(enfantId)) continue;
      const r = await avecDelaiMaximal(
        dupliquerActiviteVersParcours(element.idLocal, enfantId),
        30000
      );
      if ("erreur" in r) {
        avertissements.push(
          `« ${element.donnees.titre} » : la copie vers un autre enfant a échoué (à refaire avec « Dupliquer pour un autre enfant »).`
        );
      }
      element.etat.copiesFaites.push(enfantId);
      await enregistrer(element);
    }

    await supprimerElement(element.idLocal);
    signalerChangementFile();
    return "termine";
  } catch (e) {
    if (e instanceof ArretSynchro) throw e;
    if (estErreurReseau(e)) throw new ArretSynchro("reseau");
    element.derniereErreur = "Une erreur est survenue pendant l'envoi. Nouvel essai automatique.";
    await enregistrer(element).catch(() => {});
    return "erreur";
  }
}

let enCours = false;

/**
 * Envoie tout ce qui est en attente pour cet espace familial. Un seul envoi
 * a la fois (verrou entre onglets quand le navigateur le permet).
 */
export async function synchroniserFile(familleId: string): Promise<BilanSynchro> {
  const bilan: BilanSynchro = {
    envoyees: 0,
    enErreur: 0,
    reseauIndisponible: false,
    sessionExpiree: false,
    avertissements: [],
  };
  if (enCours) return bilan;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    bilan.reseauIndisponible = true;
    return bilan;
  }

  const executer = async () => {
    enCours = true;
    try {
      const elements = (await lireFile()).filter((e) => e.familleId === familleId);
      for (const element of elements) {
        try {
          const r = await envoyerUnElement(element, bilan.avertissements);
          if (r === "termine") bilan.envoyees += 1;
          else bilan.enErreur += 1;
        } catch (e) {
          if (e instanceof ArretSynchro) {
            if (e.motif === "session") bilan.sessionExpiree = true;
            else bilan.reseauIndisponible = true;
            break;
          }
          throw e;
        }
      }
    } finally {
      enCours = false;
    }
  };

  const verrous = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (verrous) {
    await verrous.request("ief-synchro-file", { ifAvailable: true }, async (verrou) => {
      if (verrou) await executer();
    });
  } else {
    await executer();
  }
  return bilan;
}
