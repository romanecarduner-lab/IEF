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

function ajouterDiapositiveCouvertureDomaine(
  pptx: PptxGenJS,
  domaine: DomaineDocumentPedagogique
) {
  const slide = pptx.addSlide();
  slide.background = { color: CREME };
  slide.addText(domaine.nom, {
    x: MARGE,
    y: 4.4,
    w: LARGEUR_CONTENU,
    h: 1.6,
    fontSize: 24,
    color: VERT_FORET,
    italic: true,
    align: "center",
    valign: "middle",
    isTextBox: true,
  });
}

type ExempleSousDomaine = DomaineDocumentPedagogique["sousDomaines"][number]["exemples"][number];

// Hauteurs estimees (en pouces) des blocs, pour les repartir sur les
// diapositives sans depasser la page. Les tailles de police sont celles
// utilisees pour le rendu ci-dessous.
const ECART_PHOTOS = 0.08;
const HAUTEUR_MAX_PHOTO = 2.4; // photos horizontales, plusieurs cote a cote
const HAUTEUR_MAX_PHOTO_SEULE = 3.4; // une seule photo horizontale, pleine largeur
const LARGEUR_COLONNE_PHOTO = 2.5; // photos verticales, a gauche du texte
const ECART_COLONNE = 0.25;
const LARGEUR_TEXTE_COTE = LARGEUR_CONTENU - LARGEUR_COLONNE_PHOTO - ECART_COLONNE;
const HAUTEUR_MAX_COLONNE = 4.2;

function hauteurSynthese(texte: string): number {
  return Math.max(0.3, lignesEstimees(texte, LARGEUR_CONTENU, 10) * 0.2 + 0.1);
}

function dimensionsOuDefaut(base64: string): { largeur: number; hauteur: number } {
  return dimensionsJpeg(base64) ?? { largeur: 4, hauteur: 3 };
}

/**
 * Disposition d'un exemple : si toutes ses photos sont verticales, elles vont
 * a gauche et le texte a droite ; sinon (photos horizontales, ou melange),
 * les photos sont en rangee et le texte passe en dessous.
 */
function dispositionExemple(images: string[]): "cote" | "dessous" {
  if (images.length === 0) return "dessous";
  return images.every((b) => {
    const d = dimensionsOuDefaut(b);
    return d.hauteur > d.largeur;
  })
    ? "cote"
    : "dessous";
}

function lignesEstimees(texte: string, largeur: number, taillePoints: number): number {
  const caracteresParLigne = Math.max(10, Math.floor((largeur * 72) / (taillePoints * 0.5)));
  return Math.ceil(texte.length / caracteresParLigne);
}

/** Hauteur estimee du texte d'un exemple (titre, description, formulation). */
function hauteurTexteExemple(exemple: ExempleSousDomaine, largeur: number): number {
  let h = 0.3;
  if (exemple.description) h += lignesEstimees(exemple.description, largeur, 8) * 0.14 + 0.12;
  if (exemple.synthese) h += lignesEstimees(exemple.synthese, largeur, 10) * 0.19 + 0.1;
  return h;
}

type Placement = { base64: string; x: number; y: number; w: number; h: number };

/** Texte d'une activite : titre (date), description, puis formulation. */
function ajouterTexteExemple(
  slide: PptxGenJS.Slide,
  exemple: ExempleSousDomaine,
  x: number,
  y: number,
  largeur: number
): number {
  slide.addText(`${exemple.titre}  ·  ${exemple.date}`, {
    x, y, w: largeur, h: 0.3,
    fontSize: 10, bold: true, color: ENCRE, isTextBox: true,
  });
  let yTexte = y + 0.3;
  if (exemple.description) {
    const h = lignesEstimees(exemple.description, largeur, 8) * 0.14 + 0.12;
    slide.addText(exemple.description, {
      x, y: yTexte, w: largeur, h,
      fontSize: 8, color: ARDOISE, valign: "top", isTextBox: true, margin: 0,
    });
    yTexte += h;
  }
  if (exemple.synthese) {
    const h = lignesEstimees(exemple.synthese, largeur, 10) * 0.19 + 0.1;
    slide.addText(exemple.synthese, {
      x, y: yTexte, w: largeur, h,
      fontSize: 10, color: ENCRE, valign: "top", isTextBox: true, margin: 0,
    });
    yTexte += h;
  }
  return yTexte;
}

// Deux activites par ligne : une a gauche, une a droite.
const GAP_COLONNES = 0.45;
const LARGEUR_COLONNE = (LARGEUR_CONTENU - GAP_COLONNES) / 2;
const LARGEUR_PHOTO_VERTICALE = 1.25;
const ECART_TEXTE_PHOTO = 0.15;
const LARGEUR_TEXTE_COTE_COLONNE = LARGEUR_COLONNE - LARGEUR_PHOTO_VERTICALE - ECART_TEXTE_PHOTO;
const HAUTEUR_PHOTO_COLONNE = 3.2; // une seule photo horizontale : pleine largeur de la carte, centree
const HAUTEUR_PHOTO_COLONNE_MULTI = 1.8; // plusieurs photos horizontales
const HAUTEUR_MAX_PHOTOS_VERTICALES = 3.2;
const ECART_LIGNE = 0.25;

type Cellule = {
  mode: "cote" | "dessous" | "vide";
  placements: Placement[];
  hauteur: number;
};

/** Mise en page d'une activite dans sa colonne (largeur LARGEUR_COLONNE). */
function disposerCellule(exemple: ExempleSousDomaine): Cellule {
  const images = exemple.imagesBase64;
  if (images.length === 0) {
    return { mode: "vide", placements: [], hauteur: hauteurTexteExemple(exemple, LARGEUR_COLONNE) };
  }
  if (dispositionExemple(images) === "cote") {
    // Photos verticales a gauche, texte a droite.
    const photos = images.slice(0, 3);
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
    const hauteur = Math.max(hPhotos, hauteurTexteExemple(exemple, LARGEUR_TEXTE_COTE_COLONNE));
    // Une seule photo verticale : centree en hauteur par rapport au texte.
    const seule = placements[0];
    if (placements.length === 1 && seule) seule.y = (hauteur - seule.h) / 2;
    return { mode: "cote", placements, hauteur };
  }
  // Photos horizontales : en rangee, texte dessous.
  const photos = images.slice(0, 3);
  const nb = photos.length;
  const boxW = nb === 1 ? LARGEUR_COLONNE : (LARGEUR_COLONNE - ECART_PHOTOS * (nb - 1)) / nb;
  const boxH = nb === 1 ? HAUTEUR_PHOTO_COLONNE : HAUTEUR_PHOTO_COLONNE_MULTI;
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
    hauteur: hPhotos + ECART_PHOTOS + hauteurTexteExemple(exemple, LARGEUR_COLONNE),
  };
}

/** Range les activites deux par deux (gauche, droite). */
function rangerParDeux(exemples: ExempleSousDomaine[]): ExempleSousDomaine[][] {
  const lignes: ExempleSousDomaine[][] = [];
  for (let i = 0; i < exemples.length; i += 2) lignes.push(exemples.slice(i, i + 2));
  return lignes;
}

function hauteurLigne(ligne: ExempleSousDomaine[]): number {
  return ligne.reduce((max, e) => Math.max(max, disposerCellule(e).hauteur), 0) + ECART_LIGNE + 2 * PADDING_CARTE;
}

// Fond de carte par activite : deux couleurs douces, alternees d'une activite
// a l'autre (comme dans le PDF).
const FONDS_ACTIVITE = ["E7EEE7", "F6EEDD"];
const PADDING_CARTE = 0.12;

function ajouterCellule(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  exemple: ExempleSousDomaine,
  x: number,
  y: number,
  fond: string
) {
  const cellule = disposerCellule(exemple);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x - PADDING_CARTE,
    y: y - PADDING_CARTE,
    w: LARGEUR_COLONNE + 2 * PADDING_CARTE,
    h: cellule.hauteur + 2 * PADDING_CARTE,
    fill: { color: fond },
    line: { color: fond, width: 0 },
    rectRadius: 0.08,
  });
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
    const yTexte = cellule.mode === "dessous" ? y + hPhotos + ECART_PHOTOS : y;
    ajouterTexteExemple(slide, exemple, x, yTexte, LARGEUR_COLONNE);
  }
}

function ajouterDiapositiveSousDomaine(
  pptx: PptxGenJS,
  domaineNom: string,
  sousDomaine: DomaineDocumentPedagogique["sousDomaines"][number]
) {
  // Premiere diapositive : entete, synthese, puis les lignes qui tiennent.
  // Les suivantes reprennent les activites restantes, sans repeter la synthese.
  const hSyntheseDomaine = sousDomaine.synthese ? hauteurSynthese(sousDomaine.synthese) : 0;
  const debutPremiere = 1.45 + hSyntheseDomaine + 0.3;
  const debutSuite = 1.5;

  const groupes: ExempleSousDomaine[][][] = [];
  let courant: ExempleSousDomaine[][] = [];
  let curseur = debutPremiere;
  for (const ligne of rangerParDeux(sousDomaine.exemples)) {
    const h = hauteurLigne(ligne);
    if (courant.length > 0 && curseur + h > BAS_UTILE) {
      groupes.push(courant);
      courant = [];
      curseur = debutSuite;
    }
    courant.push(ligne);
    curseur += h;
  }
  if (courant.length > 0 || groupes.length === 0) groupes.push(courant);

  groupes.forEach((lignes, indexGroupe) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };

    slide.addText(domaineNom, {
      x: MARGE,
      y: 0.3,
      w: LARGEUR_CONTENU,
      h: 0.35,
      fontSize: 10,
      color: ARDOISE,
      isTextBox: true,
    });
    slide.addText(indexGroupe === 0 ? sousDomaine.nom : `${sousDomaine.nom} (suite)`, {
      x: MARGE,
      y: 0.65,
      w: LARGEUR_CONTENU,
      h: 0.6,
      fontSize: 16,
      color: VERT_FORET,
      bold: true,
      isTextBox: true,
    });
    if (indexGroupe === 0 && sousDomaine.synthese) {
      slide.addText(sousDomaine.synthese, {
        x: MARGE,
        y: 1.45,
        w: LARGEUR_CONTENU,
        h: hSyntheseDomaine,
        fontSize: 10.5,
        color: ENCRE,
        valign: "top",
        isTextBox: true,
        margin: 0,
      });
    }

    let y = indexGroupe === 0 ? debutPremiere : debutSuite;
    lignes.forEach((ligne) => {
      ligne.forEach((exemple, col) => {
        const fond = FONDS_ACTIVITE[sousDomaine.exemples.indexOf(exemple) % 2] ?? FONDS_ACTIVITE[0] ?? "E7EEE7";
        ajouterCellule(
          pptx,
          slide,
          exemple,
          MARGE + col * (LARGEUR_COLONNE + GAP_COLONNES) + PADDING_CARTE,
          y + PADDING_CARTE,
          fond
        );
      });
      y += hauteurLigne(ligne);
    });
  });
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

  for (const domaine of domainesOrientes) {
    ajouterDiapositiveCouvertureDomaine(pptx, domaine);
    for (const sousDomaine of domaine.sousDomaines) {
      ajouterDiapositiveSousDomaine(pptx, domaine.nom, sousDomaine);
    }
  }

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
