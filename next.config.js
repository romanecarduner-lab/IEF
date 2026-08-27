/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // L'application manipule des donnees pedagogiques amenees a changer
  // frequemment (statuts de progression, syntheses IA...) : on prefere
  // toujours une donnee fraiche a une navigation legerement plus rapide.
  // Sans ce reglage, Next.js peut reafficher une version en cache d'une
  // page dynamique pendant 30 secondes apres l'avoir quittee.
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
};

module.exports = nextConfig;
