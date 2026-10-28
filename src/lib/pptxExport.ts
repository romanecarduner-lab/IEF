import PptxGenJS from "pptxgenjs";
import type { ActiviteDocument } from "@/app/(protege)/export/[id]/DocumentDossier";
import type { ActiviteJournal } from "@/app/(protege)/export/[id]/DocumentJournalPeriode";
import type { DomaineDocumentPedagogique } from "@/app/(protege)/export/[id]/DocumentDossierPedagogique";
import { orienterImage } from "@/lib/imagesExport";

async function orienterDomaines(domaines: DomaineDocumentPedagogique[]): Promise<DomaineDocumentPedagogique[]> {
  return Promise.all(
    domaines.map(async (d) => ({
      ...d,
      sousDomaines: await Promise.all(
        d.sousDomaines.map(async (sd) => ({
          ...sd,
          exemples: await Promise.all(
            sd.exemples.map(async (e) => ({
              ...e,
              imagesBase64: await Promise.all(e.imagesBase64.map(orienterImage)),
            }))
          ),
        }))
      ),
    }))
  );
}

async function orienterActivites<T extends { traces: { imageBase64?: string }[] }>(activites: T[]): Promise<T[]> {
  return Promise.all(
    activites.map(async (a) => ({
      ...a,
      traces: await Promise.all(
        a.traces.map(async (t) => ({
          ...t,
          imageBase64: t.imageBase64 ? await orienterImage(t.imageBase64) : t.imageBase64,
        }))
      ),
    }))
  );
}

const VERT_FORET = "264C3B";
const VERT_SAUGE = "9BAF9C";
const CREME = "F6F1E8";
const ENCRE = "26312D";
const ARDOISE = "5C6A62";

// Format portrait A4 (mêmes proportions que le PDF) : 7,5 x 10,61 pouces.
const LARGEUR_PAGE = 7.5;
const HAUTEUR_PAGE = 10.61;
const MARGE = 0.5;
const LARGEUR_CONTENU = LARGEUR_PAGE - 2 * MARGE; // 6,5 pouces
const BAS_UTILE = HAUTEUR_PAGE - 0.4; // limite basse pour le texte

const NOM_FORMAT = "A4_PORTRAIT";

/** Dimensions (en pixels) d'un JPEG, lues dans son en-tete. */
function dimensionsJpeg(base64: string): { largeur: number; hauteur: number } | null {
  const octets = Buffer.from(base64, "base64");
  let i = 2;
  while (i + 9 < octets.length) {
    if (octets[i] !== 0xff) {
      i++;
      continue;
    }
    const marqueur = octets[i + 1] ?? 0;
    if (marqueur >= 0xc0 && marqueur <= 0xc3) {
      return { hauteur: octets.readUInt16BE(i + 5), largeur: octets.readUInt16BE(i + 7) };
    }
    if (marqueur === 0xd8 || marqueur === 0x01 || (marqueur >= 0xd0 && marqueur <= 0xd7)) {
      i += 2;
      continue;
    }
    i += 2 + octets.readUInt16BE(i + 2);
  }
  return null;
}

/**
 * Place une photo dans un cadre en la gardant entiere et sans deformation
 * (centree, a l'echelle maximale). On calcule nous-memes la taille : le
 * mode « contain » de pptxgenjs ne connait pas les dimensions de l'image.
 */
function ajouterPhoto(
  slide: PptxGenJS.Slide,
  base64: string,
  cadre: { x: number; y: number; w: number; h: number }
) {
  const dim = dimensionsJpeg(base64);
  let { x, y, w, h } = cadre;
  if (dim) {
    const echelle = Math.min(cadre.w / dim.largeur, cadre.h / dim.hauteur);
    w = dim.largeur * echelle;
    h = dim.hauteur * echelle;
    x = cadre.x + (cadre.w - w) / 2;
    y = cadre.y + (cadre.h - h) / 2;
  }
  slide.addImage({ data: `image/jpeg;base64,${base64}`, x, y, w, h });
}

function configurerFormat(pptx: PptxGenJS) {
  pptx.defineLayout({ name: NOM_FORMAT, width: LARGEUR_PAGE, height: HAUTEUR_PAGE });
  pptx.layout = NOM_FORMAT;
}

function ajouterDiapositiveTitre(
  pptx: PptxGenJS,
  titre: string,
  sousTitres: string[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: CREME };
  slide.addText(titre, {
    x: MARGE,
    y: 3.6,
    w: LARGEUR_CONTENU,
    h: 1.6,
    fontSize: 28,
    color: VERT_FORET,
    italic: true,
    align: "center",
    valign: "middle",
    isTextBox: true,
  });
  slide.addText(sousTitres.join("\n"), {
    x: MARGE,
    y: 5.4,
    w: LARGEUR_CONTENU,
    h: 1.6,
    fontSize: 14,
    color: ARDOISE,
    align: "center",
    isTextBox: true,
  });
}

function ajouterDiapositiveActivite(
  pptx: PptxGenJS,
  activite: ActiviteDocument | ActiviteJournal
) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText(activite.titre, {
    x: MARGE,
    y: 0.4,
    w: LARGEUR_CONTENU,
    h: 0.8,
    fontSize: 20,
    color: VERT_FORET,
    bold: true,
    isTextBox: true,
  });

  const meta = `${new Date(activite.date).toLocaleDateString("fr-FR")}${
    activite.contexte ? ` · ${activite.contexte}` : ""
  }`;
  slide.addText(meta, {
    x: MARGE,
    y: 1.2,
    w: LARGEUR_CONTENU,
    h: 0.35,
    fontSize: 11,
    color: ARDOISE,
    isTextBox: true,
  });

  const premierePhoto = activite.traces.find((t) => t.imageBase64)?.imageBase64;

  // Photo en haut, texte dessous ; sans photo, le texte prend toute la page.
  let yTexte = 1.7;
  let hauteurTexte = BAS_UTILE - 1.7 - 0.9;
  if (premierePhoto) {
    ajouterPhoto(slide, premierePhoto, { x: MARGE, y: 1.7, w: LARGEUR_CONTENU, h: 4.4 });
    yTexte = 6.3;
    hauteurTexte = 3.0;
  }

  if (activite.texte) {
    slide.addText(activite.texte, {
      x: MARGE,
      y: yTexte,
      w: LARGEUR_CONTENU,
      h: hauteurTexte,
      fontSize: 12,
      color: ENCRE,
      valign: "top",
      isTextBox: true,
      margin: 0,
    });
  }

  if ("competences" in activite && activite.competences.length > 0) {
    const texteCompetences = activite.competences
      .map((c) => `• ${c.libelle} (${c.niveauAutonomie})`)
      .join("\n");
    slide.addText(texteCompetences, {
      x: MARGE,
      y: BAS_UTILE - 0.7,
      w: LARGEUR_CONTENU,
      h: 0.7,
      fontSize: 9,
      color: VERT_SAUGE,
      valign: "bottom",
      isTextBox: true,
    });
  }
}

async function genererBuffer(
  pptx: PptxGenJS
): Promise<Buffer> {
  const resultat = await pptx.write({ outputType: "nodebuffer" });
  return resultat as Buffer;
}

type ExempleSousDomaine = DomaineDocumentPedagogique["sousDomaines"][number]["exemples"][number];

const ECART_PHOTOS = 0.08;
const ECART_LIGNE = 0.25;
const GAP_COLONNES = 0.45;
const LARGEUR_COLONNE = (LARGEUR_CONTENU - GAP_COLONNES) / 2;
const LARGEUR_PHOTO_VERTICALE = 1.25;
const ECART_TEXTE_PHOTO = 0.15;
const LARGEUR_TEXTE_COTE_COLONNE = LARGEUR_COLONNE - LARGEUR_PHOTO_VERTICALE - ECART_TEXTE_PHOTO;
const HAUTEUR_PHOTO_SEULE = 2.6; // une seule photo horizontale, centree dans sa carte
const HAUTEUR_PHOTO_MULTI = 1.5; // plusieurs photos horizontales
const HAUTEUR_MAX_PHOTOS_VERTICALES = 2.8;
// Au-dela de cette hauteur, une activite a cote de sa photo verticale ne tient
// plus sur la page : la photo passe au-dessus du texte.
const HAUTEUR_MAX_COTE = 4.0;
// Au-dela de cette hauteur, la disposition mixte ne tient plus sur une page.
const HAUTEUR_MAX_MIXTE = 7.5;
const PADDING_CARTE = 0.12;
// Fond de carte par activite : deux couleurs douces, alternees d'une activite
// a l'autre (comme dans le PDF).
const FONDS_ACTIVITE = ["E7EEE7", "F6EEDD"];

function hauteurSynthese(texte: string): number {
  return Math.max(0.3, lignesEstimees(texte, LARGEUR_CONTENU, 10) * 0.19 + 0.05);
}

function dimensionsOuDefaut(base64: string): { largeur: number; hauteur: number } {
  return dimensionsJpeg(base64) ?? { largeur: 4, hauteur: 3 };
}

/** Les photos sont-elles toutes verticales ? Dans ce cas, texte a cote. */
function dispositionExemple(images: string[]): "cote" | "dessous" {
  if (images.length === 0) return "dessous";
  return images.every((b) => {
    const d = dimensionsOuDefaut(b);
    return d.hauteur > d.largeur;
  })
    ? "cote"
    : "dessous";
}

/** Nombre de lignes estimees d'un texte dans une largeur donnee (en pouces). */
function lignesEstimees(texte: string, largeur: number, taillePoints: number, gras = false): number {
  const facteur = gras ? 0.62 : 0.5;
  const caracteresParLigne = Math.max(8, Math.floor((largeur * 72) / (taillePoints * facteur)));
  return Math.ceil(texte.length / caracteresParLigne);
}

/** Titre d'une activite (titre et date), en gras, sur la largeur donnee. */
function texteTitreExemple(exemple: ExempleSousDomaine): string {
  return `${exemple.titre}  ·  ${exemple.date}`;
}

function hauteurTitreExemple(exemple: ExempleSousDomaine, largeur: number): number {
  return lignesEstimees(texteTitreExemple(exemple), largeur, 10, true) * 0.22 + 0.1;
}

/** Hauteur du titre et de la description (pleine largeur de la zone). */
function hauteurTitreEtDescription(exemple: ExempleSousDomaine, largeur: number): number {
  let h = hauteurTitreExemple(exemple, largeur);
  if (exemple.description) h += lignesEstimees(exemple.description, largeur, 8) * 0.14 + 0.12;
  return h;
}

/** Hauteur de la formulation pedagogique. */
function hauteurSyntheseExemple(exemple: ExempleSousDomaine, largeur: number): number {
  return exemple.synthese ? lignesEstimees(exemple.synthese, largeur, 10) * 0.19 + 0.1 : 0;
}

/** Hauteur estimee du texte d'un exemple : titre, description, formulation. */
function hauteurTexteExemple(exemple: ExempleSousDomaine, largeur: number): number {
  return hauteurTitreEtDescription(exemple, largeur) + hauteurSyntheseExemple(exemple, largeur);
}

type Placement = { base64: string; x: number; y: number; w: number; h: number };
type Cellule = {
  mode: "cote" | "dessous" | "mixte" | "vide";
  placements: Placement[];
  hauteur: number;
  // Mode "mixte" : hauteur du titre et de la description, en pleine largeur.
  hEnTete?: number;
};

/** Titre (date) et description d'une activite. Renvoie la position suivante. */
function ajouterTitreEtDescription(
  slide: PptxGenJS.Slide,
  exemple: ExempleSousDomaine,
  x: number,
  y: number,
  largeur: number
): number {
  const hTitre = hauteurTitreExemple(exemple, largeur);
  slide.addText(texteTitreExemple(exemple), {
    x,
    y,
    w: largeur,
    h: hTitre,
    fontSize: 10,
    bold: true,
    color: ENCRE,
    valign: "top",
    isTextBox: true,
    margin: 0,
  });
  let yTexte = y + hTitre;
  if (exemple.description) {
    const h = lignesEstimees(exemple.description, largeur, 8) * 0.14 + 0.12;
    slide.addText(exemple.description, {
      x,
      y: yTexte,
      w: largeur,
      h,
      fontSize: 8,
      color: ARDOISE,
      valign: "top",
      isTextBox: true,
      margin: 0,
    });
    yTexte += h;
  }
  return yTexte;
}

/** Formulation pedagogique d'une activite. Renvoie la position suivante. */
function ajouterSyntheseExemple(
  slide: PptxGenJS.Slide,
  exemple: ExempleSousDomaine,
  x: number,
  y: number,
  largeur: number
): number {
  if (!exemple.synthese) return y;
  const h = hauteurSyntheseExemple(exemple, largeur);
  slide.addText(exemple.synthese, {
    x,
    y,
    w: largeur,
    h,
    fontSize: 10,
    color: ENCRE,
    valign: "top",
    isTextBox: true,
    margin: 0,
  });
  return y + h;
}

/** Texte complet d'une activite : titre, description, puis formulation. */
function ajouterTexteExemple(
  slide: PptxGenJS.Slide,
  exemple: ExempleSousDomaine,
  x: number,
  y: number,
  largeur: number
): number {
  const yApresDescription = ajouterTitreEtDescription(slide, exemple, x, y, largeur);
  return ajouterSyntheseExemple(slide, exemple, x, yApresDescription, largeur);
}

/** Photos verticales a gauche, texte a droite (colonne etroite). */
function disposerCoteCellule(exemple: ExempleSousDomaine): Cellule {
  const photos = exemple.imagesBase64.slice(0, 3);
  const boxH = (HAUTEUR_MAX_PHOTOS_VERTICALES - ECART_PHOTOS * (photos.length - 1)) / photos.length;
  let y = 0;
  const placements = photos.map((base64) => {
    const dim = dimensionsOuDefaut(base64);
    const echelle = Math.min(LARGEUR_PHOTO_VERTICALE / dim.largeur, boxH / dim.hauteur);
    const w = dim.largeur * echelle;
    const h = dim.hauteur * echelle;
    const placement = { base64, x: (LARGEUR_PHOTO_VERTICALE - w) / 2, y, w, h };
    y += h + ECART_PHOTOS;
    return placement;
  });
  const hPhotos = y - ECART_PHOTOS;
  return {
    mode: "cote",
    placements,
    hauteur: Math.max(hPhotos, hauteurTexteExemple(exemple, LARGEUR_TEXTE_COTE_COLONNE)),
  };
}

/** Photos horizontales en rangee, texte dessous, dans la largeur donnee. */
function disposerDessousCellule(exemple: ExempleSousDomaine, largeur: number): Cellule {
  const photos = exemple.imagesBase64.slice(0, 3);
  const nb = photos.length;
  const boxW = nb === 1 ? largeur : (largeur - ECART_PHOTOS * (nb - 1)) / nb;
  const boxH = nb === 1 ? HAUTEUR_PHOTO_SEULE : HAUTEUR_PHOTO_MULTI;
  const placements = photos.map((base64, k) => {
    const dim = dimensionsOuDefaut(base64);
    const echelle = Math.min(boxW / dim.largeur, boxH / dim.hauteur);
    const w = dim.largeur * echelle;
    const h = dim.hauteur * echelle;
    return { base64, x: k * (boxW + ECART_PHOTOS) + (boxW - w) / 2, y: 0, w, h };
  });
  const hPhotos = placements.reduce((max, p) => Math.max(max, p.h), 0);
  return {
    mode: "dessous",
    placements,
    hauteur: hPhotos + ECART_PHOTOS + hauteurTexteExemple(exemple, largeur),
  };
}

/**
 * Mode mixte : titre et description en pleine largeur, puis photo et
 * formulation cote a cote. Sert quand le texte est trop long pour tenir
 * a cote de la photo.
 */
function disposerMixteCellule(exemple: ExempleSousDomaine): Cellule {
  const cote = disposerCoteCellule(exemple);
  const hEnTete = hauteurTitreEtDescription(exemple, LARGEUR_COLONNE);
  const hPhotos = cote.placements.reduce((max, p) => Math.max(max, p.y + p.h), 0);
  const hSynthese = hauteurSyntheseExemple(exemple, LARGEUR_TEXTE_COTE_COLONNE);
  return {
    mode: "mixte",
    placements: cote.placements,
    hEnTete,
    hauteur: hEnTete + 0.1 + Math.max(hPhotos, hSynthese),
  };
}

/** Mise en page d'une activite dans la largeur donnee (colonne ou page). */
function disposerCellule(exemple: ExempleSousDomaine, largeur: number): Cellule {
  const images = exemple.imagesBase64;
  if (images.length === 0) {
    return { mode: "vide", placements: [], hauteur: hauteurTexteExemple(exemple, largeur) };
  }
  if (largeur === LARGEUR_COLONNE && dispositionExemple(images) === "cote") {
    const cote = disposerCoteCellule(exemple);
    if (cote.hauteur <= HAUTEUR_MAX_COTE) return cote;
    const mixte = disposerMixteCellule(exemple);
    if (mixte.hauteur <= HAUTEUR_MAX_MIXTE) return mixte;
  }
  return disposerDessousCellule(exemple, largeur);
}

type Ligne = { exemples: ExempleSousDomaine[]; pleineLargeur: boolean };

/**
 * Range les activites deux par deux (gauche, droite). Une activite trop haute
 * pour une colonne prend seule toute la largeur de la page.
 */
function planifierLignes(exemples: ExempleSousDomaine[]): Ligne[] {
  const lignes: Ligne[] = [];
  let i = 0;
  while (i < exemples.length) {
    const actuel = exemples[i];
    if (!actuel) break;
    const hauteurActuelle = disposerCellule(actuel, LARGEUR_COLONNE).hauteur;
    if (hauteurActuelle > HAUTEUR_MAX_MIXTE) {
      lignes.push({ exemples: [actuel], pleineLargeur: true });
      i += 1;
      continue;
    }
    const suivant = exemples[i + 1];
    if (suivant && disposerCellule(suivant, LARGEUR_COLONNE).hauteur <= HAUTEUR_MAX_MIXTE) {
      lignes.push({ exemples: [actuel, suivant], pleineLargeur: false });
      i += 2;
    } else {
      lignes.push({ exemples: [actuel], pleineLargeur: false });
      i += 1;
    }
  }
  return lignes;
}

function largeurLigne(ligne: Ligne): number {
  return ligne.pleineLargeur ? LARGEUR_CONTENU - 2 * PADDING_CARTE : LARGEUR_COLONNE;
}

function hauteurLigne(ligne: Ligne): number {
  const largeur = largeurLigne(ligne);
  const max = ligne.exemples.reduce((m, e) => Math.max(m, disposerCellule(e, largeur).hauteur), 0);
  return max + ECART_LIGNE + 2 * PADDING_CARTE;
}

function ajouterCellule(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  exemple: ExempleSousDomaine,
  x: number,
  y: number,
  largeur: number,
  fond: string
) {
  const cellule = disposerCellule(exemple, largeur);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x - PADDING_CARTE,
    y: y - PADDING_CARTE,
    w: largeur + 2 * PADDING_CARTE,
    h: cellule.hauteur + 2 * PADDING_CARTE,
    fill: { color: fond },
    line: { color: fond, width: 0 },
    rectRadius: 0.08,
  });

  if (cellule.mode === "mixte") {
    const yColonne = ajouterTitreEtDescription(slide, exemple, x, y, largeur) + 0.1;
    for (const p of cellule.placements) {
      slide.addImage({
        data: `image/jpeg;base64,${p.base64}`,
        x: x + p.x,
        y: yColonne + p.y,
        w: p.w,
        h: p.h,
      });
    }
    ajouterSyntheseExemple(
      slide,
      exemple,
      x + LARGEUR_PHOTO_VERTICALE + ECART_TEXTE_PHOTO,
      yColonne,
      LARGEUR_TEXTE_COTE_COLONNE
    );
    return;
  }

  for (const p of cellule.placements) {
    slide.addImage({
      data: `image/jpeg;base64,${p.base64}`,
      x: x + p.x,
      y: y + p.y,
      w: p.w,
      h: p.h,
    });
  }
  if (cellule.mode === "cote") {
    ajouterTexteExemple(slide, exemple, x + LARGEUR_PHOTO_VERTICALE + ECART_TEXTE_PHOTO, y, LARGEUR_TEXTE_COTE_COLONNE);
  } else {
    const hPhotos = cellule.placements.reduce((max, p) => Math.max(max, p.h), 0);
    const yTexte = cellule.mode === "dessous" && hPhotos > 0 ? y + hPhotos + ECART_PHOTOS : y;
    ajouterTexteExemple(slide, exemple, x, yTexte, largeur);
  }
}

type Section = {
  domaine: string;
  sousDomaine: DomaineDocumentPedagogique["sousDomaines"][number];
};

const DEBUT_PAGE = 0.5;

/** En-tete d'une section : nom du domaine, titre du sous-domaine, synthese. */
function hauteurEntete(section: Section, avecSynthese: boolean): number {
  const hSynthese = avecSynthese && section.sousDomaine.synthese ? hauteurSynthese(section.sousDomaine.synthese) : 0;
  return 0.3 + 0.45 + hSynthese + 0.1;
}

function dessinerEntete(
  slide: PptxGenJS.Slide,
  section: Section,
  y: number,
  suite: boolean,
  avecSynthese: boolean
) {
  slide.addText(section.domaine, {
    x: MARGE,
    y,
    w: LARGEUR_CONTENU,
    h: 0.28,
    fontSize: 9,
    color: ARDOISE,
    isTextBox: true,
    margin: 0,
  });
  slide.addText(suite ? `${section.sousDomaine.nom} (suite)` : section.sousDomaine.nom, {
    x: MARGE,
    y: y + 0.28,
    w: LARGEUR_CONTENU,
    h: 0.45,
    fontSize: 15,
    color: VERT_FORET,
    bold: true,
    valign: "top",
    isTextBox: true,
    margin: 0,
  });
  const synthese = section.sousDomaine.synthese;
  if (avecSynthese && synthese) {
    slide.addText(synthese, {
      x: MARGE,
      y: y + 0.75,
      w: LARGEUR_CONTENU,
      h: hauteurSynthese(synthese),
      fontSize: 10.5,
      color: ENCRE,
      valign: "top",
      isTextBox: true,
      margin: 0,
    });
  }
}

function dessinerLigne(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  sousDomaine: DomaineDocumentPedagogique["sousDomaines"][number],
  ligne: Ligne,
  y: number
) {
  const largeur = largeurLigne(ligne);
  ligne.exemples.forEach((exemple, col) => {
    const x = ligne.pleineLargeur ? MARGE : MARGE + col * (LARGEUR_COLONNE + GAP_COLONNES);
    const fond = FONDS_ACTIVITE[sousDomaine.exemples.indexOf(exemple) % 2] ?? "E7EEE7";
    ajouterCellule(pptx, slide, exemple, x + PADDING_CARTE, y + PADDING_CARTE, largeur, fond);
  });
}

/**
 * Enchaine les sections (domaine, sous-domaine) sur les pages : plusieurs
 * sous-domaines peuvent partager une page. Une section coupee en deux pages
 * reprend son titre avec la mention « (suite) ».
 */
function ajouterSectionsDansPages(pptx: PptxGenJS, sections: Section[]) {
  let page: PptxGenJS.Slide | null = null;
  let y = DEBUT_PAGE;

  const nouvellePage = (): PptxGenJS.Slide => {
    const nouvelle = pptx.addSlide();
    nouvelle.background = { color: "FFFFFF" };
    y = DEBUT_PAGE;
    return nouvelle;
  };

  for (const section of sections) {
    const lignes = planifierLignes(section.sousDomaine.exemples);
    const premiereHauteur = lignes[0] ? hauteurLigne(lignes[0]) : 0;
    const hEntete = hauteurEntete(section, true);
    if (!page || y + hEntete + premiereHauteur > BAS_UTILE) {
      page = nouvellePage();
    }
    dessinerEntete(page, section, y, false, true);
    y += hEntete;

    for (const ligne of lignes) {
      const h = hauteurLigne(ligne);
      if (y + h > BAS_UTILE) {
        page = nouvellePage();
        dessinerEntete(page, section, y, true, false);
        y += hauteurEntete(section, false);
      }
      dessinerLigne(pptx, page, section.sousDomaine, ligne, y);
      y += h;
    }
  }
  if (!page) nouvellePage();
}

export async function genererPptxDossierPedagogique({
  titreDossier,
  enfant,
  cycle,
  domaines,
}: {
  titreDossier: string;
  enfant: string;
  cycle: string;
  domaines: DomaineDocumentPedagogique[];
}): Promise<Buffer> {
  const pptx = new PptxGenJS();
  configurerFormat(pptx);
  const domainesOrientes = await orienterDomaines(domaines);

  ajouterDiapositiveTitre(pptx, titreDossier, [enfant, cycle]);

  const sections: Section[] = domainesOrientes.flatMap((domaine) =>
    domaine.sousDomaines.map((sousDomaine) => ({ domaine: domaine.nom, sousDomaine }))
  );
  ajouterSectionsDansPages(pptx, sections);

  return genererBuffer(pptx);
}

export async function genererPptxJournalPeriode({
  titreDossier,
  enfant,
  periodeDebut,
  periodeFin,
  activites,
}: {
  titreDossier: string;
  enfant: string;
  periodeDebut: string;
  periodeFin: string;
  activites: ActiviteJournal[];
}): Promise<Buffer> {
  const pptx = new PptxGenJS();
  configurerFormat(pptx);

  ajouterDiapositiveTitre(pptx, titreDossier, [
    enfant,
    `Du ${new Date(periodeDebut).toLocaleDateString("fr-FR")} au ${new Date(
      periodeFin
    ).toLocaleDateString("fr-FR")}`,
  ]);

  const activitesOrientees = await orienterActivites(activites);
  for (const activite of activitesOrientees) {
    ajouterDiapositiveActivite(pptx, activite);
  }

  return genererBuffer(pptx);
}
