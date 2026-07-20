"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Ordre du degagé, du moins avancé au plus avancé — dérivé de la palette
// mousse déjà utilisée dans l'application (voir tailwind.config.ts).
const PALIERS = [
  { code: "premiere_observation", libelle: "Première observation", couleur: "#C9D6C9" },
  { code: "en_cours_exploration", libelle: "En cours d'exploration", couleur: "#A9C0AC" },
  { code: "realise_avec_accompagnement", libelle: "Avec accompagnement", couleur: "#8AA48D" },
  { code: "realise_autonome", libelle: "Autonome", couleur: "#5F7A63" },
  { code: "mobilise_spontanement", libelle: "Mobilisé spontanément", couleur: "#48624C" },
  { code: "mobilise_plusieurs_contextes", libelle: "Plusieurs contextes", couleur: "#3E5442" },
];
const COULEUR_NON_ABORDE = "#E4E1D6";

export type DonneesDomaine = {
  domaine: string;
  totalObjectifs: number;
  parStatut: Record<string, number>;
};

export function GraphiqueProgression({ donnees }: { donnees: DonneesDomaine[] }) {
  const donneesGraphique = donnees.map((d) => {
    const ligne: Record<string, string | number> = {
      domaine: d.domaine.length > 28 ? d.domaine.slice(0, 26) + "…" : d.domaine,
    };
    let sommePaliers = 0;
    for (const p of PALIERS) {
      const nb = d.parStatut[p.code] ?? 0;
      sommePaliers += nb;
      ligne[p.libelle] = d.totalObjectifs > 0 ? (nb / d.totalObjectifs) * 100 : 0;
    }
    const nonAborde = d.totalObjectifs - sommePaliers;
    ligne["Pas encore abordé"] =
      d.totalObjectifs > 0 ? (Math.max(nonAborde, 0) / d.totalObjectifs) * 100 : 0;
    return ligne;
  });

  return (
    <div className="mb-8 rounded-doux border border-trait bg-white/80 p-4 shadow-doux">
      <p className="mb-1 text-sm font-medium text-encre">
        Couverture du programme par domaine
      </p>
      <p className="mb-4 text-xs text-ardoise">
        Proportion des objectifs officiels de chaque domaine déjà validés,
        par niveau atteint. Le calcul se base sur les statuts validés en
        page Progression — pas sur les simples observations.
      </p>
      <ResponsiveContainer width="100%" height={Math.max(donnees.length * 46, 140)}>
        <BarChart
          data={donneesGraphique}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#6B7570" }}
          />
          <YAxis
            type="category"
            dataKey="domaine"
            width={150}
            tick={{ fontSize: 11, fill: "#2B3230" }}
          />
          <Tooltip
            formatter={(valeur) => `${Number(valeur).toFixed(0)}%`}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #DCDFD7",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar
            dataKey="Pas encore abordé"
            stackId="a"
            fill={COULEUR_NON_ABORDE}
          />
          {PALIERS.map((p) => (
            <Bar key={p.code} dataKey={p.libelle} stackId="a" fill={p.couleur} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
