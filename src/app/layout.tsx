import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-corps",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Suivi pédagogique IEF",
  description:
    "Un espace calme pour documenter les apprentissages de votre enfant en instruction en famille.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${publicSans.variable}`}>
      <body className="font-corps">{children}</body>
    </html>
  );
}
