import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export type ActiviteDocument = {
  titre: string;
  date: string;
  contexte?: string;
  texte: string;
};

export type TraceDocument = {
  legende?: string;
  contenuTexte?: string;
  imageBase64?: string;
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  titrePrincipal: { fontSize: 20, marginBottom: 4 },
  sousTitre: { fontSize: 12, color: "#6B7570", marginBottom: 24 },
  sectionTitre: { fontSize: 15, marginBottom: 12, marginTop: 8 },
  activite: { marginBottom: 16 },
  activiteTitre: { fontSize: 13, marginBottom: 2 },
  activiteMeta: { fontSize: 9, color: "#6B7570", marginBottom: 4 },
  activiteTexte: { fontSize: 11, lineHeight: 1.4 },
  trace: { marginBottom: 16 },
  traceImage: { width: 220, marginBottom: 4 },
  traceLegende: { fontSize: 9, color: "#6B7570" },
});

export function DocumentDossier({
  titreDossier,
  enfant,
  annee,
  activites,
  traces,
}: {
  titreDossier: string;
  enfant: string;
  annee: string;
  activites: ActiviteDocument[];
  traces: TraceDocument[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titrePrincipal}>{titreDossier}</Text>
        <Text style={styles.sousTitre}>
          {enfant} — {annee}
        </Text>

        {activites.length > 0 && (
          <>
            <Text style={styles.sectionTitre}>Activités</Text>
            {activites.map((a, i) => (
              <View key={i} style={styles.activite} wrap={false}>
                <Text style={styles.activiteTitre}>{a.titre}</Text>
                <Text style={styles.activiteMeta}>
                  {new Date(a.date).toLocaleDateString("fr-FR")}
                  {a.contexte ? ` · ${a.contexte}` : ""}
                </Text>
                {a.texte && <Text style={styles.activiteTexte}>{a.texte}</Text>}
              </View>
            ))}
          </>
        )}

        {traces.length > 0 && (
          <>
            <Text style={styles.sectionTitre}>Traces</Text>
            {traces.map((t, i) => (
              <View key={i} style={styles.trace} wrap={false}>
                {t.imageBase64 && (
                  // eslint-disable-next-line jsx-a11y/alt-text -- composant PDF (@react-pdf/renderer), pas une balise HTML <img>
                  <Image
                    style={styles.traceImage}
                    src={{ data: Buffer.from(t.imageBase64, "base64"), format: "jpg" }}
                  />
                )}
                {t.contenuTexte && (
                  <Text style={styles.activiteTexte}>« {t.contenuTexte} »</Text>
                )}
                {t.legende && <Text style={styles.traceLegende}>{t.legende}</Text>}
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
