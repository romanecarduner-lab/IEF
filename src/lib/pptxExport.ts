import PptxGenJS from "pptxgenjs";
import type { ActiviteDocument, DomaineDocument } from "@/app/(protege)/export/[id]/DocumentDossier";
import type { ActiviteJournal } from "@/app/(protege)/export/[id]/DocumentJournalPeriode";

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

export async function genererPptxDossierPedagogique({
  titreDossier,
  enfant,
  annee,
  cycle,
  domaines,
  activitesSansDomaine,
}: {
  titreDossier: string;
  enfant: string;
  annee: string;
  cycle?: string;
  domaines: DomaineDocument[];
  activitesSansDomaine: ActiviteDocument[];
}): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  ajouterDiapositiveTitre(pptx, titreDossier, [
    enfant,
    `${annee}${cycle ? ` · ${cycle}` : ""}`,
  ]);

  for (const domaine of domaines) {
    const slideDomaine = pptx.addSlide();
    slideDomaine.background = { color: CREME };
    slideDomaine.addText(domaine.nom, {
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
    for (const activite of domaine.activites) {
      ajouterDiapositiveActivite(pptx, activite);
    }
  }

  if (activitesSansDomaine.length > 0) {
    const slideAutres = pptx.addSlide();
    slideAutres.background = { color: CREME };
    slideAutres.addText("Autres activités", {
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
    for (const activite of activitesSansDomaine) {
      ajouterDiapositiveActivite(pptx, activite);
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
