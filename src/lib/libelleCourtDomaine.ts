/**
 * Nom court et lisible pour chaque domaine du programme officiel --
 * l'intitulé complet reste toujours disponible ailleurs (accordéon,
 * page Progression, PDF d'export). Sert uniquement à l'affichage
 * compact du tableau de bord et de la navigation, jamais à identifier
 * un domaine en base (on continue de comparer sur le nom complet).
 */
export function libelleCourtDomaine(nomComplet: string): string {
  const n = nomComplet.toLowerCase();
  if (n.includes("langage")) return "Langage";
  if (n.includes("physique")) return "Activités physiques";
  if (n.includes("artistique")) return "Activités artistiques";
  if (n.includes("mathématique")) return "Outils mathématiques";
  if (n.includes("temps") || n.includes("espace")) return "Temps et espace";
  if (n.includes("vivant") || n.includes("matière")) return "Vivant et matière";
  return nomComplet.length > 28 ? `${nomComplet.slice(0, 26)}…` : nomComplet;
}
