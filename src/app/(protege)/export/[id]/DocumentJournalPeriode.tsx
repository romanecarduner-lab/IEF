import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export type ActiviteJournal = {
  titre: string;
  date: string;
  contexte?: string;
  texte: string;
  traces: { imageBase64?: string; contenuTexte?: string }[];
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },

  couverture: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  couvertureEyebrow: {
    fontSize: 10,
    color: "#264C3B",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  couvertureTitre: { fontSize: 24, marginBottom: 8, textAlign: "center" },
  couvertureSousTitre: { fontSize: 14, color: "#26312D", marginBottom: 4, textAlign: "center" },
  couverturePeriode: { fontSize: 11, color: "#5C6A62", marginTop: 8, textAlign: "center" },
  couvertureMeta: { fontSize: 10, color: "#5C6A62", marginTop: 24, textAlign: "center" },
  couvertureStats: { marginTop: 32, flexDirection: "row", gap: 24 },
  couvertureStatBloc: { alignItems: "center" },
  couvertureStatValeur: { fontSize: 18, color: "#264C3B" },
  couvertureStatLabel: { fontSize: 8, color: "#5C6A62" },

  activite: { marginBottom: 18 },
  activiteTitre: { fontSize: 12, marginBottom: 2 },
  activiteMeta: { fontSize: 8, color: "#5C6A62", marginBottom: 4 },
  activiteTexte: { fontSize: 10, lineHeight: 1.4, marginBottom: 6 },
  tracesGrille: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  traceImage: { width: 130, height: 100, objectFit: "cover", borderRadius: 4 },
  traceTexte: { fontSize: 9, fontStyle: "italic", color: "#26312D", marginBottom: 4 },

  piedDePage: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#A9A9A9",
    textAlign: "center",
  },
});

function PiedDePage() {
  return (
    <Text
      style={styles.piedDePage}
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      fixed
    />
  );
}

export function DocumentJournalPeriode({
  titreDossier,
  enfant,
  periodeDebut,
  periodeFin,
  dateGeneration,
  activites,
}: {
  titreDossier: string;
  enfant: string;
  periodeDebut: string;
  periodeFin: string;
  dateGeneration: string;
  activites: ActiviteJournal[];
}) {
  const nbTraces = activites.reduce((acc, a) => acc + a.traces.length, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.couverture}>
          <Text style={styles.couvertureEyebrow}>Journal — instruction en famille</Text>
          <Text style={styles.couvertureTitre}>{titreDossier}</Text>
          <Text style={styles.couvertureSousTitre}>{enfant}</Text>
          <Text style={styles.couverturePeriode}>
            Du {new Date(periodeDebut).toLocaleDateString("fr-FR")} au{" "}
            {new Date(periodeFin).toLocaleDateString("fr-FR")}
          </Text>

          <View style={styles.couvertureStats}>
            <View style={styles.couvertureStatBloc}>
              <Text style={styles.couvertureStatValeur}>{activites.length}</Text>
              <Text style={styles.couvertureStatLabel}>activités</Text>
            </View>
            <View style={styles.couvertureStatBloc}>
              <Text style={styles.couvertureStatValeur}>{nbTraces}</Text>
              <Text style={styles.couvertureStatLabel}>traces</Text>
            </View>
          </View>

          <Text style={styles.couvertureMeta}>Document généré le {dateGeneration}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        {activites.map((a, i) => (
          <View key={i} style={styles.activite} wrap={false}>
            <Text style={styles.activiteTitre}>{a.titre}</Text>
            <Text style={styles.activiteMeta}>
              {new Date(a.date).toLocaleDateString("fr-FR")}
              {a.contexte ? ` · ${a.contexte}` : ""}
            </Text>
            {a.texte && <Text style={styles.activiteTexte}>{a.texte}</Text>}

            {a.traces.length > 0 && (
              <View style={styles.tracesGrille}>
                {a.traces.map((t, k) =>
                  t.imageBase64 ? (
                    // eslint-disable-next-line jsx-a11y/alt-text -- composant PDF (@react-pdf/renderer)
                    <Image
                      key={k}
                      style={styles.traceImage}
                      src={{ data: Buffer.from(t.imageBase64, "base64"), format: "jpg" }}
                    />
                  ) : t.contenuTexte ? (
                    <Text key={k} style={styles.traceTexte}>
                      « {t.contenuTexte} »
                    </Text>
                  ) : null
                )}
              </View>
            )}
          </View>
        ))}
        <PiedDePage />
      </Page>
    </Document>
  );
}
