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
    // Par defaut, Next.js limite a 1 Mo les donnees envoyees a une action
    // serveur -- trop juste des qu'on envoie plusieurs photos a l'IA en
    // une fois (formulaire "Decrire l'activite et identifier les
    // competences"), meme apres compression cote client. Relevee pour
    // laisser de la marge sans redevenir illimitee.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

module.exports = nextConfig;
