"use client";

import { PageErreur } from "@/components/PageErreur";

// Erreur dans une page publique (connexion, accueil, etc.).
export default function ErreurGenerale({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageErreur reset={reset} code={error.digest} lienAccueil="/" />;
}
