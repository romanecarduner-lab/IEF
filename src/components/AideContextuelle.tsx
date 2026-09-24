"use client";

import { useState } from "react";

export function AideContextuelle({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        aria-label={`Aide : ${titre}`}
        className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-mousse/40 text-xs font-medium text-mousse-fonce hover:bg-mousse/10"
      >
        ?
      </button>
      {ouvert && (
        <span className="absolute left-0 top-7 z-20 block w-72 rounded-doux border border-trait bg-white p-3 text-left text-xs leading-relaxed text-encre shadow-doux sm:w-80">
          <span className="mb-1 block font-medium">{titre}</span>
          {children}
          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="mt-2 block text-xs text-ardoise underline underline-offset-2"
          >
            Fermer
          </button>
        </span>
      )}
    </span>
  );
}
