import type { Metadata, Viewport } from "next";
// Polices hebergees avec l'application (paquets @fontsource-variable) plutot
// que telechargees chez Google a chaque build : un incident reseau lors du
// deploiement ne peut plus faire echouer le build ni faire retomber les
// titres sur une police de remplacement. Les variables CSS --font-display
// et --font-corps sont definies dans globals.css.
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource-variable/manrope/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chemins d'apprentissage",
  description:
    "Un regard sur le chemin parcouru par votre enfant en instruction en famille.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icones/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icones/icone-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    // "Add to Home Screen" sans ces balises produit un simple signet sur
    // iOS -- avec, Safari le reconnait comme une vraie application
    // installee (icone, pas de barre d'adresse, et surtout un stockage
    // de session bien plus stable entre deux ouvertures).
    capable: true,
    statusBarStyle: "default",
    title: "Chemins d'apprentissage",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Le zoom pincé reste possible (maximumScale volontairement absent) :
  // c'est une aide a l'accessibilite, jamais a desactiver.
  themeColor: "#F6F1E8",
  // Necessaire pour que env(safe-area-inset-*) renvoie de vraies valeurs
  // sur iPhone (sinon toujours 0) : utilise par la navigation fixe basse.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-corps">{children}</body>
    </html>
  );
}
