import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type ExempleDocument = { date: string; titre: string };

export type CompetenceDocument = {
  libelle: string;
  chemin?: string;
  statutLibelle: string;
  observee: boolean;
  exemples: ExempleDocument[];
  formulation?: string;
};

export type DomaineDocumentPedagogique = {
  nom: string;
  competences: CompetenceDocument[];
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },

  couverture: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  couvertureEyebrow: { fontSize: 10, color: "#264C3B", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  couvertureTitre: { fontSize: 24, marginBottom: 8, textAlign: "center" },
  couvertureSousTitre: { fontSize: 14, color: "#26312D", marginBottom: 4, textAlign: "center" },
  couvertureMeta: { fontSize: 10, color: "#5C6A62", marginTop: 24, textAlign: "center" },

  domaineTitre: { fontSize: 15, color: "#264C3B", marginBottom: 10, marginTop: 18 },
  competenceBloc: { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E3DCCB" },
  competenceLigne: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  competenceLibelle: { fontSize: 11, color: "#26312D", flexGrow: 1, marginRight: 8 },
  competenceChemin: { fontSize: 8, color: "#5C6A62", marginTop: 1 },
  statutBadge: { fontSize: 8, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8, color: "#26312D" },
  exempleLigne: { fontSize: 9, color: "#5C6A62", marginTop: 4 },
  formulationTexte: { fontSize: 10, color: "#26312D", marginTop: 4, lineHeight: 1.4 },
  nonAbordeTexte: { fontSize: 9, color: "#5C6A62", marginTop: 3, fontStyle: "italic" },

  pied: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#5C6A62", textAlign: "center" },
});

function couleurStatut(observee: boolean): string {
  return observee ? "#D7E0D2" : "#E3DCCB";
}

export function DocumentDossierPedagogique({
  titre,
  enfant,
  cycle,
  dateGeneration,
  domaines,
}: {
  titre: string;
  enfant: string;
  cycle: string;
  dateGeneration: string;
  domaines: DomaineDocumentPedagogique[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.couverture}>
          <Text style={styles.couvertureEyebrow}>Chemins d&apos;apprentissage</Text>
          <Text style={styles.couvertureTitre}>{titre}</Text>
          <Text style={styles.couvertureSousTitre}>{enfant}</Text>
          <Text style={styles.couvertureSousTitre}>{cycle}</Text>
          <Text style={styles.couvertureMeta}>Document généré le {dateGeneration}</Text>
          <Text style={styles.couvertureMeta}>
            Couvre l&apos;ensemble des compétences du cycle, avec leur statut
            réel, cumulé sur toutes les années du cycle.
          </Text>
        </View>
      </Page>

      {domaines.map((domaine) => (
        <Page key={domaine.nom} size="A4" style={styles.page} wrap>
          <Text style={styles.domaineTitre}>{domaine.nom}</Text>
          {domaine.competences.map((c, i) => (
            <View key={i} style={styles.competenceBloc} wrap={false}>
              <View style={styles.competenceLigne}>
                <View style={{ flexGrow: 1 }}>
                  <Text style={styles.competenceLibelle}>{c.libelle}</Text>
                  {c.chemin && <Text style={styles.competenceChemin}>{c.chemin}</Text>}
                </View>
                <Text
                  style={[styles.statutBadge, { backgroundColor: couleurStatut(c.observee) }]}
                >
                  {c.statutLibelle}
                </Text>
              </View>

              {!c.observee && (
                <Text style={styles.nonAbordeTexte}>
                  Aucune activité n&apos;a encore porté sur cette compétence.
                </Text>
              )}

              {c.observee && c.exemples.length > 0 && (
                <>
                  {c.exemples.map((e, j) => (
                    <Text key={j} style={styles.exempleLigne}>
                      • {e.date} — {e.titre}
                    </Text>
                  ))}
                </>
              )}

              {c.observee && c.formulation && (
                <Text style={styles.formulationTexte}>{c.formulation}</Text>
              )}
            </View>
          ))}
          <Text
            style={styles.pied}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      ))}
    </Document>
  );
}
