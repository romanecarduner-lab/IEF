import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export type ExempleDocument = {
  titre: string;
  date: string;
  synthese: string;
  imageBase64?: string;
};

export type SousDomaineDocument = {
  nom: string;
  synthese: string;
  exemples: ExempleDocument[];
};

export type DomaineDocumentPedagogique = {
  nom: string;
  sousDomaines: SousDomaineDocument[];
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },

  couverture: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  couvertureEyebrow: { fontSize: 10, color: "#264C3B", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  couvertureTitre: { fontSize: 24, marginBottom: 8, textAlign: "center" },
  couvertureSousTitre: { fontSize: 14, color: "#26312D", marginBottom: 4, textAlign: "center" },
  couvertureMeta: { fontSize: 10, color: "#5C6A62", marginTop: 24, textAlign: "center" },

  domaineTitre: { fontSize: 17, color: "#264C3B", marginBottom: 14, marginTop: 10 },
  sousDomaineBloc: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#E3DCCB" },
  sousDomaineTitre: { fontSize: 13, color: "#264C3B", marginBottom: 6 },
  syntheseTexte: { fontSize: 11, color: "#26312D", lineHeight: 1.4, marginBottom: 10 },
  exemplesLigne: { flexDirection: "row", gap: 10 },
  exempleBloc: { flexGrow: 1, flexBasis: 0 },
  exempleImage: { width: "100%", height: 110, objectFit: "cover", borderRadius: 4, marginBottom: 4 },
  exempleTitre: { fontSize: 9, color: "#26312D", marginBottom: 1 },
  exempleDate: { fontSize: 8, color: "#5C6A62", marginBottom: 3 },
  exempleSynthese: { fontSize: 9, color: "#26312D", lineHeight: 1.3 },

  pied: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#5C6A62", textAlign: "center" },
});

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
            Synthèse par domaine et sous-domaine, à partir des compétences
            validées, cumulées sur tout le cycle.
          </Text>
        </View>
      </Page>

      {domaines.map((domaine) => (
        <Page key={domaine.nom} size="A4" style={styles.page} wrap>
          <Text style={styles.domaineTitre}>{domaine.nom}</Text>
          {domaine.sousDomaines.map((sd, i) => (
            <View key={i} style={styles.sousDomaineBloc} wrap={false}>
              <Text style={styles.sousDomaineTitre}>{sd.nom}</Text>
              {sd.synthese && <Text style={styles.syntheseTexte}>{sd.synthese}</Text>}

              {sd.exemples.length > 0 && (
                <View style={styles.exemplesLigne}>
                  {sd.exemples.map((e, j) => (
                    <View key={j} style={styles.exempleBloc}>
                      {e.imageBase64 && (
                        // eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, pas une balise HTML
                        <Image
                          src={`data:image/jpeg;base64,${e.imageBase64}`}
                          style={styles.exempleImage}
                        />
                      )}
                      <Text style={styles.exempleTitre}>{e.titre}</Text>
                      <Text style={styles.exempleDate}>{e.date}</Text>
                      {e.synthese && <Text style={styles.exempleSynthese}>{e.synthese}</Text>}
                    </View>
                  ))}
                </View>
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
