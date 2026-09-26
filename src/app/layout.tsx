import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Test", description: "Test" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="fr"><body className="font-corps">{children}</body></html>);
}
