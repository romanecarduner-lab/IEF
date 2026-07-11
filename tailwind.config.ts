import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Palette "douce, élégante, rassurante" — ni le cream/terracotta ni le sombre/néon par défaut.
        brume: "#F4F6F3", // fond principal, blanc cassé légèrement vert-de-gris
        lin: "#ECEAE2", // fond secondaire, cartes
        mousse: {
          DEFAULT: "#5F7A63", // accent principal, vert sauge profond
          clair: "#8AA48D",
          fonce: "#3E5442",
        },
        argile: "#8C7E6A", // accent secondaire chaleureux, sans être terracotta
        encre: "#2B3230", // texte principal, presque noir mais chaud
        ardoise: "#6B7570", // texte secondaire
        trait: "#DCDFD7", // bordures / hairlines
        alerte: "#B5573E",
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
