import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export type CompetenceObservee = { libelle: string; niveauAutonomie: string };

export type TraceImage = { imageBase64?: string; contenuTexte?: string; legende?: string };

export type ActiviteDocument = {
  titre: string;
  date: string;
  contexte?: string;
  texte: string;
  competences: CompetenceObservee[];
  traces: TraceImage[];
};

export type DomaineDocument = {
  nom: string;
  activites: ActiviteDocument[];
};

export type SyntheseDomaineDocument = {
  domaine: string;
  totalObjectifs: number;
  parStatut: Record<string, number>;
};

const PALIERS = [
  { code: "premiere_observation", libelle: "Première observation", couleur: "#C9D6C9" },
  { code: "en_cours_exploration", libelle: "En cours d'exploration", couleur: "#A9C0AC" },
  { code: "realise_avec_accompagnement", libelle: "Avec accompagnement", couleur: "#8AA48D" },
  { code: "realise_autonome", libelle: "Autonome", couleur: "#5F7A63" },
  { code: "mobilise_spontanement", libelle: "Mobilisé spontanément", couleur: "#48624C" },
  { code: "mobilise_plusieurs_contextes", libelle: "Plusieurs contextes", couleur: "#3E5442" },
];
const COULEUR_NON_ABORDE = "#E4E1D6";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },

  // Page de garde
  couverture: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  couvertureEyebrow: { fontSize: 10, color: "#5F7A63", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  couvertureTitre: { fontSize: 24, marginBottom: 8, textAlign: "center" },
  couvertureSousTitre: { fontSize: 14, color: "#2B3230", marginBottom: 4, textAlign: "center" },
  couvertureMeta: { fontSize: 10, color: "#6B7570", marginTop: 24, textAlign: "center" },
  couvertureStats: { marginTop: 32, flexDirection: "row", gap: 24 },
  couvertureStatBloc: { alignItems: "center" },
  couvertureStatValeur: { fontSize: 18, color: "#3E5442" },
  couvertureStatLabel: { fontSize: 8, color: "#6B7570" },

  // En-tetes generaux
  titrePage: { fontSize: 16, marginBottom: 16 },
  sousTitrePage: { fontSize: 9, color: "#6B7570", marginBottom: 16 },

  // Synthese par domaine
  syntheseLigne: { marginBottom: 14 },
  syntheseLabel: { fontSize: 10, marginBottom: 3 },
  syntheseBarre: { flexDirection: "row", height: 10, borderRadius: 2, overflow: "hidden" },
  syntheseLegende: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 10 },
  syntheseLegendeItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  syntheseLegendePuce: { width: 8, height: 8, borderRadius: 2 },
  syntheseLegendeTexte: { fontSize: 7, color: "#6B7570" },

  // Domaines / activites
  domaineTitre: { fontSize: 15, marginBottom: 12, marginTop: 4, color: "#3E5442" },
  activite: { marginBottom: 18 },
  activiteTitre: { fontSize: 12, marginBottom: 2 },
  activiteMeta: { fontSize: 8, color: "#6B7570", marginBottom: 4 },
  activiteTexte: { fontSize: 10, lineHeight: 1.4, marginBottom: 6 },
  competencesBloc: { marginBottom: 6, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: "#DCDFD7" },
  competenceLigne: { fontSize: 8, color: "#2B3230", marginBottom: 2 },
  competenceNiveau: { color: "#6B7570" },
  tracesGrille: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  traceImage: { width: 130, height: 100, objectFit: "cover", borderRadius: 4 },
  traceTexte: { fontSize: 9, fontStyle: "italic", color: "#2B3230", marginBottom: 4 },

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

export function DocumentDossier({
  titreDossier,
  enfant,
  annee,
  cycle,
  dateGeneration,
  nbActivites,
  nbTraces,
  syntheses,
  domaines,
  activitesSansDomaine,
}: {
  titreDossier: string;
  enfant: string;
  annee: string;
  cycle?: string;
  dateGeneration: string;
  nbActivites: number;
  nbTraces: number;
  syntheses: SyntheseDomaineDocument[];
  domaines: DomaineDocument[];
  activitesSansDomaine: ActiviteDocument[];
}) {
  return (
    <Document>
      {/* Page de garde */}
      <Page size="A4" style={styles.page}>
        <View style={styles.couverture}>
          <Text style={styles.couvertureEyebrow}>Dossier pédagogique — instruction en famille</Text>
          <Text style={styles.couvertureTitre}>{titreDossier}</Text>
          <Text style={styles.couvertureSousTitre}>{enfant}</Text>
          <Text style={styles.couvertureSousTitre}>
            {annee}
            {cycle ? ` · ${cycle}` : ""}
          </Text>

          <View style={styles.couvertureStats}>
            <View style={styles.couvertureStatBloc}>
              <Text style={styles.couvertureStatValeur}>{nbActivites}</Text>
              <Text style={styles.couvertureStatLabel}>activités</Text>
            </View>
            <View style={styles.couvertureStatBloc}>
              <Text style={styles.couvertureStatValeur}>{nbTraces}</Text>
              <Text style={styles.couvertureStatLabel}>traces</Text>
            </View>
            <View style={styles.couvertureStatBloc}>
              <Text style={styles.couvertureStatValeur}>{domaines.length}</Text>
              <Text style={styles.couvertureStatLabel}>domaines abordés</Text>
            </View>
          </View>

          <Text style={styles.couvertureMeta}>Document généré le {dateGeneration}</Text>
        </View>
      </Page>

      {/* Synthese de progression par domaine */}
      {syntheses.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.titrePage}>Synthèse de progression</Text>
          <Text style={styles.sousTitrePage}>
            Proportion des objectifs officiels validés par domaine, au niveau atteint.
          </Text>

          {syntheses.map((s) => {
            const somme = PALIERS.reduce((acc, p) => acc + (s.parStatut[p.code] ?? 0), 0);
            const nonAborde = Math.max(s.totalObjectifs - somme, 0);
            return (
              <View key={s.domaine} style={styles.syntheseLigne} wrap={false}>
                <Text style={styles.syntheseLabel}>{s.domaine}</Text>
                <View style={styles.syntheseBarre}>
                  <View
                    style={{
                      width: `${s.totalObjectifs > 0 ? (nonAborde / s.totalObjectifs) * 100 : 100}%`,
                      backgroundColor: COULEUR_NON_ABORDE,
                    }}
                  />
                  {PALIERS.map((p) => (
                    <View
                      key={p.code}
                      style={{
                        width: `${
                          s.totalObjectifs > 0 ? ((s.parStatut[p.code] ?? 0) / s.totalObjectifs) * 100 : 0
                        }%`,
                        backgroundColor: p.couleur,
                      }}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          <View style={styles.syntheseLegende}>
            <View style={styles.syntheseLegendeItem}>
              <View style={[styles.syntheseLegendePuce, { backgroundColor: COULEUR_NON_ABORDE }]} />
              <Text style={styles.syntheseLegendeTexte}>Pas encore abordé</Text>
            </View>
            {PALIERS.map((p) => (
              <View key={p.code} style={styles.syntheseLegendeItem}>
                <View style={[styles.syntheseLegendePuce, { backgroundColor: p.couleur }]} />
                <Text style={styles.syntheseLegendeTexte}>{p.libelle}</Text>
              </View>
            ))}
          </View>
        </Page>
      )}

      {/* Une section par domaine */}
      {domaines.map((domaine) => (
        <Page key={domaine.nom} size="A4" style={styles.page}>
          <Text style={styles.domaineTitre}>{domaine.nom}</Text>

          {domaine.activites.map((a, i) => (
            <View key={i} style={styles.activite} wrap={false}>
              <Text style={styles.activiteTitre}>{a.titre}</Text>
              <Text style={styles.activiteMeta}>
                {new Date(a.date).toLocaleDateString("fr-FR")}
                {a.contexte ? ` · ${a.contexte}` : ""}
              </Text>
              {a.texte && <Text style={styles.activiteTexte}>{a.texte}</Text>}

              {a.competences.length > 0 && (
                <View style={styles.competencesBloc}>
                  {a.competences.map((c, j) => (
                    <Text key={j} style={styles.competenceLigne}>
                      {c.libelle}{" "}
                      <Text style={styles.competenceNiveau}>({c.niveauAutonomie})</Text>
                    </Text>
                  ))}
                </View>
              )}

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
      ))}

      {/* Activites sans competence reliee */}
      {activitesSansDomaine.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.domaineTitre}>Autres activités</Text>
          <Text style={styles.sousTitrePage}>
            Non reliées à des compétences précises du programme officiel.
          </Text>

          {activitesSansDomaine.map((a, i) => (
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
      )}
    </Document>
  );
}
