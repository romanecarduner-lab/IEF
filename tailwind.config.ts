import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Direction graphique "Chemins d'apprentissage" : vert forêt,
        // vert sauge, crème, terracotta, ocre doux — evoque la
        // progression, la nature, le temps long.
        brume: "#F6F1E8", // creme, fond principal
        lin: "#EFE6D3", // fond secondaire, cartes / etats hover
        mousse: {
          DEFAULT: "#9BAF9C", // vert sauge, accent principal
          clair: "#C3D0C4",
          fonce: "#264C3B", // vert foret, boutons/CTA
        },
        argile: "#C9785D", // terracotta, accent chaleureux
        ocre: "#D9A441", // ocre doux, mise en avant (favoris, badges)
        encre: "#26312D", // texte principal
        ardoise: "#5C6A62", // texte secondaire
        trait: "#E3DCCB", // bordures / hairlines
        alerte: "#B4442E",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        corps: ["var(--font-corps)"],
      },
      borderRadius: {
        doux: "0.9rem",
      },
      boxShadow: {
        doux: "0 1px 2px rgba(43, 50, 48, 0.04), 0 8px 24px -12px rgba(43, 50, 48, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
