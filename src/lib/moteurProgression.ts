/**
 * Moteur deterministe d'estimation du statut de progression d'une
 * competence, a partir de ses observations. Fonction pure (aucun acces
 * base de donnees) pour rester facilement testable.
 *
 * Principes (voir discussion du chantier "progression automatique") :
 * - Une observation isolee ne prouve jamais une acquisition stabilisee :
 *   elle produit une estimation "provisoire", jamais "confirmee".
 * - Une serie d'observations homogenes (toujours le meme niveau) ou
 *   montrant une progression chronologique claire et non-decroissante
 *   peut etre conclue sans IA : c'est un calcul, pas une interpretation.
 * - Toute situation qui ne rentre pas dans ces deux cas (alternance,
 *   regression, signaux contradictoires) reste "non concluante" ici :
 *   elle sera confiee a l'IA a une etape ulterieure du chantier, jamais
 *   tranchee arbitrairement par une regle.
 */

export const SUGGESTION_DEPUIS_AUTONOMIE: Record<string, string> = {
  observation_uniquement: "premiere_observation",
  accompagnement_important: "realise_avec_accompagnement",
  avec_quelques_aides: "realise_avec_accompagnement",
  a_partir_consigne: "en_cours_exploration",
  autonome: "realise_autonome",
  initie_spontanement: "mobilise_spontanement",
};

export type ObservationPourEstimation = {
  niveauCode: string;
  niveauOrdre: number;
  date: string; // ISO (YYYY-MM-DD ou timestamp)
  contexteCode: string;
};

export type ResultatEstimation =
  | {
      concluant: true;
      statutCode: string;
      niveauConfiance: "provisoire" | "confirme";
      justification: string;
    }
  | {
      concluant: false;
      raison: string;
    };

const SEUIL_CONFIRMATION = {
  nbObservationsMin: 3,
  nbDatesDistinctesMin: 2,
  nbContextesDistinctsMin: 2,
};

function mapperNiveauVersStatut(niveauCode: string): string | null {
  return SUGGESTION_DEPUIS_AUTONOMIE[niveauCode] ?? null;
}

export function estimerStatutDepuisObservations(
  observations: ObservationPourEstimation[]
): ResultatEstimation {
  if (observations.length === 0) {
    return { concluant: false, raison: "Aucune observation à analyser." };
  }

  const triees = [...observations].sort((a, b) => a.date.localeCompare(b.date));
  const ordres = triees.map((o) => o.niveauOrdre);
  const datesDistinctes = new Set(triees.map((o) => o.date)).size;
  const contextesDistincts = new Set(triees.map((o) => o.contexteCode)).size;

  const niveauConfiance: "provisoire" | "confirme" =
    triees.length >= SEUIL_CONFIRMATION.nbObservationsMin &&
    datesDistinctes >= SEUIL_CONFIRMATION.nbDatesDistinctesMin &&
    contextesDistincts >= SEUIL_CONFIRMATION.nbContextesDistinctsMin
      ? "confirme"
      : "provisoire";

  const homogene = ordres.every((o) => o === ordres[0]);
  const nonDecroissant = ordres.every((o, i) => i === 0 || o >= ordres[i - 1]!);

  const premiere = triees[0]!;
  const derniere = triees[triees.length - 1]!;

  if (homogene) {
    const statutCode = mapperNiveauVersStatut(premiere.niveauCode);
    if (!statutCode) {
      return { concluant: false, raison: "Niveau d'autonomie non reconnu." };
    }
    const justification =
      triees.length === 1
        ? `Une seule observation disponible, au niveau "${premiere.niveauCode}" : estimation provisoire.`
        : `${triees.length} observations, toutes au même niveau d'autonomie, sur ${datesDistinctes} date(s) et ${contextesDistincts} contexte(s).`;
    return { concluant: true, statutCode, niveauConfiance, justification };
  }

  if (nonDecroissant) {
    const statutCode = mapperNiveauVersStatut(derniere.niveauCode);
    if (!statutCode) {
      return { concluant: false, raison: "Niveau d'autonomie non reconnu." };
    }
    const justification = `Progression constatée du niveau "${premiere.niveauCode}" (${premiere.date}) vers "${derniere.niveauCode}" (${derniere.date}), sans régression observée entre-temps.`;
    return { concluant: true, statutCode, niveauConfiance, justification };
  }

  return {
    concluant: false,
    raison:
      "Les niveaux observés varient sans tendance claire dans le temps (alternance ou régression) : une analyse plus fine serait nécessaire plutôt qu'une règle automatique.",
  };
}
