import PptxGenJS from "pptxgenjs";
import type { ActiviteDocument } from "@/app/(protege)/export/[id]/DocumentDossier";
import type { ActiviteJournal } from "@/app/(protege)/export/[id]/DocumentJournalPeriode";
import type { DomaineDocumentPedagogique } from "@/app/(protege)/export/[id]/DocumentDossierPedagogique";

const VERT_FORET = "264C3B";
const VERT_SAUGE = "9BAF9C";
const CREME = "F6F1E8";
const ENCRE = "26312D";
const ARDOISE = "5C6A62";

function ajouterDiapositiveTitre(
  pptx: PptxGenJS,
  titre: string,
  sousTitres: string[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: CREME };
  slide.addText(titre, {
    x: 0.6,
    y: 2.3,
    w: 12.1,
    h: 1.2,
    fontSize: 32,
    color: VERT_FORET,
    italic: true,
    align: "center",
    isTextBox: true,
  });
  slide.addText(sousTitres.join("\n"), {
    x: 0.6,
    y: 3.6,
    w: 12.1,
    h: 1.5,
    fontSize: 16,
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
    x: 0.5,
    y: 0.35,
    w: 12.3,
    h: 0.7,
    fontSize: 22,
    color: VERT_FORET,
    bold: true,
    isTextBox: true,
  });

  const meta = `${new Date(activite.date).toLocaleDateString("fr-FR")}${
    activite.contexte ? ` · ${activite.contexte}` : ""
  }`;
  slide.addText(meta, {
    x: 0.5,
    y: 1.0,
    w: 12.3,
    h: 0.4,
    fontSize: 12,
    color: ARDOISE,
    isTextBox: true,
  });

  const premierePhoto = activite.traces.find((t) => t.imageBase64)?.imageBase64;
  const largeurTexte = premierePhoto ? 6.6 : 12.3;

  if (activite.texte) {
    slide.addText(activite.texte, {
      x: 0.5,
      y: 1.6,
      w: largeurTexte,
      h: 5.3,
      fontSize: 13,
      color: ENCRE,
      valign: "top",
      isTextBox: true,
      margin: 0,
    });
  }

  if (premierePhoto) {
    slide.addImage({
      data: `image/jpeg;base64,${premierePhoto}`,
      x: 7.4,
      y: 1.6,
      w: 5.4,
      h: 5.3,
      sizing: { type: "contain", w: 5.4, h: 5.3 },
    });
  }

  if ("competences" in activite && activite.competences.length > 0) {
    const texteCompetences = activite.competences
      .map((c) => `• ${c.libelle} (${c.niveauAutonomie})`)
      .join("\n");
    slide.addText(texteCompetences, {
      x: 0.5,
      y: 6.6,
      w: 12.3,
      h: 0.7,
      fontSize: 10,
      color: VERT_SAUGE,
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
    x: 0.6,
    y: 2.8,
    w: 12.1,
    h: 1.2,
    fontSize: 26,
    color: VERT_FORET,
    italic: true,
    align: "center",
    isTextBox: true,
  });
}

function ajouterDiapositiveSousDomaine(
  pptx: PptxGenJS,
  domaineNom: string,
  sousDomaine: DomaineDocumentPedagogique["sousDomaines"][number]
) {
  // Une diapositive porte la synthese et deux exemples au plus ; au-dela,
  // des diapositives de suite reprennent les exemples suivants (deux par
  // deux), sans repeter la synthese.
  const groupes: (typeof sousDomaine.exemples)[] = [];
  for (let i = 0; i < sousDomaine.exemples.length; i += 2) {
    groupes.push(sousDomaine.exemples.slice(i, i + 2));
  }
  if (groupes.length === 0) groupes.push([]);

  groupes.forEach((groupe, indexGroupe) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };

    slide.addText(domaineNom, {
      x: 0.5,
      y: 0.3,
      w: 12.3,
      h: 0.35,
      fontSize: 11,
      color: ARDOISE,
      isTextBox: true,
    });
    slide.addText(indexGroupe === 0 ? sousDomaine.nom : `${sousDomaine.nom} (suite)`, {
      x: 0.5,
      y: 0.65,
      w: 12.3,
      h: 0.6,
      fontSize: 18,
      color: VERT_FORET,
      bold: true,
      isTextBox: true,
    });
    if (indexGroupe === 0 && sousDomaine.synthese) {
      slide.addText(sousDomaine.synthese, {
        x: 0.5,
        y: 1.35,
        w: 12.3,
        h: 1.8,
        fontSize: 11,
        color: ENCRE,
        valign: "top",
        isTextBox: true,
        margin: 0,
      });
    }

    const largeurExemple = groupe.length === 2 ? 5.95 : 12.3;
    const yImages = indexGroupe === 0 ? 3.4 : 1.5;
    const hauteurImages = indexGroupe === 0 ? 2.4 : 3.6;
    groupe.forEach((exemple, i) => {
      const x = 0.5 + i * (largeurExemple + 0.3);
      const nb = exemple.imagesBase64.length;
      if (nb > 0) {
        // Photos cote a cote dans la largeur de l'exemple (3 au plus par
        // rangee, les suivantes sont ignorees faute de place).
        const photos = exemple.imagesBase64.slice(0, 3);
        const ecart = 0.08;
        const largeurPhoto = (largeurExemple - ecart * (photos.length - 1)) / photos.length;
        photos.forEach((img, k) => {
          slide.addImage({
            data: `image/jpeg;base64,${img}`,
            x: x + k * (largeurPhoto + ecart),
            y: yImages,
            w: largeurPhoto,
            h: hauteurImages,
            sizing: { type: "cover", w: largeurPhoto, h: hauteurImages },
          });
        });
      }
      const yTexte = yImages + hauteurImages + 0.1;
      slide.addText(`${exemple.titre}  ·  ${exemple.date}`, {
        x,
        y: yTexte,
        w: largeurExemple,
        h: 0.3,
        fontSize: 9,
        color: ARDOISE,
        isTextBox: true,
      });
      if (exemple.synthese) {
        slide.addText(exemple.synthese, {
          x,
          y: yTexte + 0.3,
          w: largeurExemple,
          h: 1.2,
          fontSize: 10,
          color: ENCRE,
          valign: "top",
          isTextBox: true,
          margin: 0,
        });
      }
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
  pptx.layout = "LAYOUT_WIDE";

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
  pptx.layout = "LAYOUT_WIDE";

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
