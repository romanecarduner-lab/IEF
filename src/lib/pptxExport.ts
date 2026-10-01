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
  slide.background = { color: "FFFFFF" };
  slide.addText(domaine.nom, {
    x: 0.5,
    y: 0.35,
    w: 12.3,
    h: 0.6,
    fontSize: 20,
    color: VERT_FORET,
    bold: true,
    isTextBox: true,
  });

  // Couverture complete du domaine, de facon compacte : chaque
  // competence du programme avec son statut reel, sur deux colonnes si
  // la liste est longue -- jamais de competence omise, meme sans
  // observation.
  const colonnes = domaine.competences.length > 12 ? 2 : 1;
  const parColonne = Math.ceil(domaine.competences.length / colonnes);
  const largeurColonne = colonnes === 2 ? 6.0 : 12.3;

  for (let col = 0; col < colonnes; col++) {
    const sousListe = domaine.competences.slice(col * parColonne, (col + 1) * parColonne);
    const lignes = sousListe.map((c) => ({
      text: [
        { text: `${c.libelle}  `, options: { color: ENCRE, fontSize: 10 } },
        {
          text: c.statutLibelle,
          options: { color: c.observee ? VERT_FORET : ARDOISE, fontSize: 9, italic: true },
        },
      ],
    }));
    slide.addText(
      lignes.flatMap((l, i) => (i === 0 ? l.text : [{ text: "\n" }, ...l.text])),
      {
        x: 0.5 + col * (largeurColonne + 0.3),
        y: 1.1,
        w: largeurColonne,
        h: 5.9,
        valign: "top",
        isTextBox: true,
        margin: 0,
      }
    );
  }
}

function ajouterDiapositiveCompetence(
  pptx: PptxGenJS,
  domaineNom: string,
  competence: DomaineDocumentPedagogique["competences"][number]
) {
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
  slide.addText(competence.libelle, {
    x: 0.5,
    y: 0.65,
    w: 12.3,
    h: 0.7,
    fontSize: 18,
    color: VERT_FORET,
    bold: true,
    isTextBox: true,
  });
  if (competence.chemin) {
    slide.addText(competence.chemin, {
      x: 0.5,
      y: 1.3,
      w: 12.3,
      h: 0.35,
      fontSize: 10,
      color: ARDOISE,
      isTextBox: true,
    });
  }
  slide.addText(competence.statutLibelle, {
    x: 0.5,
    y: 1.7,
    w: 4,
    h: 0.4,
    fontSize: 12,
    color: "FFFFFF",
    fill: { color: VERT_FORET },
    align: "center",
    isTextBox: true,
  });

  if (competence.exemples.length > 0) {
    const texteExemples = competence.exemples
      .map((e) => `•  ${e.date} — ${e.titre}`)
      .join("\n");
    slide.addText(texteExemples, {
      x: 0.5,
      y: 2.5,
      w: 12.3,
      h: 1.3,
      fontSize: 11,
      color: ARDOISE,
      valign: "top",
      isTextBox: true,
    });
  }

  if (competence.formulation) {
    slide.addText(competence.formulation, {
      x: 0.5,
      y: 4.0,
      w: 12.3,
      h: 2.8,
      fontSize: 13,
      color: ENCRE,
      valign: "top",
      isTextBox: true,
      margin: 0,
    });
  }
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
    for (const competence of domaine.competences) {
      if (competence.observee) {
        ajouterDiapositiveCompetence(pptx, domaine.nom, competence);
      }
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
