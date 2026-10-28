import PptxGenJS from "pptxgenjs";
import type { ActiviteDocument } from "@/app/(protege)/export/[id]/DocumentDossier";
import type { ActiviteJournal } from "@/app/(protege)/export/[id]/DocumentJournalPeriode";
import type { DomaineDocumentPedagogique } from "@/app/(protege)/export/[id]/DocumentDossierPedagogique";

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
    slide.addImage({
      data: `image/jpeg;base64,${premierePhoto}`,
      x: MARGE,
      y: 1.7,
      w: LARGEUR_CONTENU,
      h: 4.4,
      sizing: { type: "contain", w: LARGEUR_CONTENU, h: 4.4 },
    });
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
const HAUTEUR_PHOTOS = 1.45;
const ECART_PHOTOS = 0.08;

function hauteurSynthese(texte: string): number {
  return Math.max(0.3, Math.ceil(texte.length / 88) * 0.2 + 0.1);
}

function hauteurDescription(texte: string): number {
  return Math.max(0.3, Math.ceil(texte.length / 110) * 0.16 + 0.1);
}

function hauteurBloc(exemple: ExempleSousDomaine): number {
  const hPhotos = exemple.imagesBase64.length > 0 ? HAUTEUR_PHOTOS + ECART_PHOTOS : 0;
  const hDesc = exemple.description ? hauteurDescription(exemple.description) : 0;
  const hSynth = exemple.synthese ? hauteurSynthese(exemple.synthese) : 0;
  return hPhotos + 0.3 + hDesc + hSynth + 0.2;
}

function ajouterDiapositiveSousDomaine(
  pptx: PptxGenJS,
  domaineNom: string,
  sousDomaine: DomaineDocumentPedagogique["sousDomaines"][number]
) {
  // Premiere diapositive : entete, synthese, puis les exemples qui tiennent.
  // Les suivantes reprennent les exemples restants, sans repeter la synthese.
  const hSyntheseDomaine = sousDomaine.synthese ? hauteurSynthese(sousDomaine.synthese) : 0;
  const debutPremiere = 1.45 + hSyntheseDomaine + 0.3;
  const debutSuite = 1.5;

  const groupes: ExempleSousDomaine[][] = [];
  let courant: ExempleSousDomaine[] = [];
  let curseur = debutPremiere;
  for (const exemple of sousDomaine.exemples) {
    const h = hauteurBloc(exemple);
    if (courant.length > 0 && curseur + h > BAS_UTILE) {
      groupes.push(courant);
      courant = [];
      curseur = debutSuite;
    }
    courant.push(exemple);
    curseur += h;
  }
  if (courant.length > 0 || groupes.length === 0) groupes.push(courant);

  groupes.forEach((groupe, indexGroupe) => {
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
    for (const exemple of groupe) {
      const nb = exemple.imagesBase64.length;
      if (nb > 0) {
        // Photos cote a cote sur la largeur de la page (3 au plus par rangee).
        const photos = exemple.imagesBase64.slice(0, 3);
        const largeurPhoto =
          (LARGEUR_CONTENU - ECART_PHOTOS * (photos.length - 1)) / photos.length;
        photos.forEach((img, k) => {
          slide.addImage({
            data: `image/jpeg;base64,${img}`,
            x: MARGE + k * (largeurPhoto + ECART_PHOTOS),
            y,
            w: largeurPhoto,
            h: HAUTEUR_PHOTOS,
            sizing: { type: "contain", w: largeurPhoto, h: HAUTEUR_PHOTOS },
          });
        });
        y += HAUTEUR_PHOTOS + ECART_PHOTOS;
      }

      slide.addText(`${exemple.titre}  ·  ${exemple.date}`, {
        x: MARGE,
        y,
        w: LARGEUR_CONTENU,
        h: 0.3,
        fontSize: 9,
        color: ARDOISE,
        isTextBox: true,
      });
      y += 0.3;

      // La description passe en premier (en plus petit), puis la formulation
      // pedagogique : c'est l'ordre voulu dans le document final.
      if (exemple.description) {
        const h = hauteurDescription(exemple.description);
        slide.addText(exemple.description, {
          x: MARGE,
          y,
          w: LARGEUR_CONTENU,
          h,
          fontSize: 8,
          color: ARDOISE,
          valign: "top",
          isTextBox: true,
          margin: 0,
        });
        y += h;
      }

      if (exemple.synthese) {
        const h = hauteurSynthese(exemple.synthese);
        slide.addText(exemple.synthese, {
          x: MARGE,
          y,
          w: LARGEUR_CONTENU,
          h,
          fontSize: 10,
          color: ENCRE,
          valign: "top",
          isTextBox: true,
          margin: 0,
        });
        y += h;
      }

      y += 0.2;
    }
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

  ajouterDiapositiveTitre(pptx, titreDossier, [enfant, cycle]);

  for (const domaine of domaines) {
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

  for (const activite of activites) {
    ajouterDiapositiveActivite(pptx, activite);
  }

  return genererBuffer(pptx);
}
