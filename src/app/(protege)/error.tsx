"use client";

import { PageErreur } from "@/components/PageErreur";

// Erreur dans une page protegee : l'en-tete et la navigation du bas restent
// affiches, seule la zone de contenu est remplacee.
export default function ErreurProtegee({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageErreur reset={reset} code={error.digest} />;
}
