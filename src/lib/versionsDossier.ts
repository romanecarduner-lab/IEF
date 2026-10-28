/**
 * Historique des versions finalisees d'un dossier d'export.
 * Chaque finalisation ecrit son PDF et son PowerPoint sous un nom date,
 * et la liste est gardee dans la colonne dossiers_export.versions_finales
 * (migration 0066). Rien n'est ecrase : une version reste accessible meme
 * apres reouverture et nouvelle finalisation.
 */

export type VersionFinale = {
  finalise_le: string | null;
  pdf: string;
  pptx: string | null;
};

/** Lit la colonne versions_finales telle que Supabase la renvoie. */
export function lireVersions(brut: unknown): VersionFinale[] {
  if (!Array.isArray(brut)) return [];
  return brut
    .filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object")
    .filter((v) => typeof v.pdf === "string")
    .map((v) => ({
      finalise_le: typeof v.finalise_le === "string" ? v.finalise_le : null,
      pdf: v.pdf as string,
      pptx: typeof v.pptx === "string" ? v.pptx : null,
    }));
}

/** Chemins de stockage d'une nouvelle version, avec un horodatage unique. */
export function nouvelleVersion(familleId: string, dossierId: string) {
  const quand = new Date();
  const tampon = quand.toISOString().replace(/[:.]/g, "-");
  const base = `${familleId}/dossiers/${dossierId}-${tampon}`;
  return {
    finaliseLe: quand.toISOString(),
    pdf: `${base}.pdf`,
    pptx: `${base}.pptx`,
  };
}

/** Ajoute une version finalisee a l'historique existant. */
export function ajouterVersion(existantes: unknown, nouvelle: VersionFinale): VersionFinale[] {
  return [...lireVersions(existantes), nouvelle];
}

/**
 * Avant une reouverture : garde la version actuelle dans l'historique si
 * elle n'y figure pas deja (cas des dossiers finalises avant la mise a jour).
 */
export function archiverVersionActuelle(
  existantes: unknown,
  pdfActuel: string | null,
  pptxActuel: string | null
): VersionFinale[] {
  const liste = lireVersions(existantes);
  if (pdfActuel && !liste.some((v) => v.pdf === pdfActuel)) {
    liste.push({ finalise_le: null, pdf: pdfActuel, pptx: pptxActuel });
  }
  return liste;
}

/** Tous les fichiers references par un dossier (versions + version actuelle). */
export function tousLesChemins(
  existantes: unknown,
  pdfActuel: string | null,
  pptxActuel: string | null
): string[] {
  const chemins = new Set<string>();
  if (pdfActuel) chemins.add(pdfActuel);
  if (pptxActuel) chemins.add(pptxActuel);
  for (const v of lireVersions(existantes)) {
    chemins.add(v.pdf);
    if (v.pptx) chemins.add(v.pptx);
  }
  return Array.from(chemins);
}

function dateAAAAMMJJ(date: Date): string {
  const parties = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const valeur = (type: string) => parties.find((p) => p.type === type)?.value ?? "";
  return `${valeur("year")}${valeur("month")}${valeur("day")}`;
}

function enNomDeFichier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Nom du fichier a telecharger : AAAAMMJJ_Prenom_Titre.extension, la date
 * etant celle de la finalisation (aujourd'hui si elle est inconnue).
 * Exemple : 20261028_Nino_Dossier-pedagogique-2026-2027.pdf
 */
export function nomFichierExport({
  dateFinalisation,
  prenom,
  titre,
  extension,
}: {
  dateFinalisation: string | null;
  prenom: string;
  titre: string;
  extension: "pdf" | "pptx";
}): string {
  const date = dateFinalisation ? new Date(dateFinalisation) : new Date();
  const morceaux = [dateAAAAMMJJ(date), enNomDeFichier(prenom), enNomDeFichier(titre)].filter(Boolean);
  return `${morceaux.join("_")}.${extension}`;
}
