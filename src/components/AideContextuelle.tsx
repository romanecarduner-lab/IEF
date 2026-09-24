"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

function ContenuBulle({
  titre,
  children,
  className,
}: {
  titre: string;
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`not-italic font-corps block max-h-[70vh] w-72 overflow-y-auto rounded-doux border border-trait bg-white p-3 text-left text-xs font-normal leading-relaxed text-encre shadow-doux sm:w-80 ${className}`}
    >
      <span className="mb-1 block font-medium">{titre}</span>
      {children}
    </span>
  );
}

/**
 * variante "inline" (par defaut) : petit bouton "?" juste a cote d'un
 * element precis, pour une explication ciblee -- la bulle s'ouvre juste
 * en dessous.
 *
 * variante "page" : bouton fixe en haut a droite de l'ecran, pour une
 * explication de la page entiere -- rendu via un portail (document.body)
 * pour ne jamais etre coupe par un conteneur parent en overflow-hidden,
 * quel que soit l'endroit du composant dans la page.
 */
export function AideContextuelle({
  titre,
  children,
  variante = "inline",
}: {
  titre: string;
  children: React.ReactNode;
  variante?: "inline" | "page";
}) {
  const [ouvert, setOuvert] = useState(false);

  const bouton = (
    <button
      type="button"
      onClick={() => setOuvert((v) => !v)}
      aria-expanded={ouvert}
      aria-label={`Aide : ${titre}`}
      className={
        variante === "page"
          ? "flex h-9 w-9 items-center justify-center rounded-full border border-mousse/40 bg-white text-sm font-medium text-mousse-fonce shadow-doux hover:bg-mousse/10"
          : "not-italic ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-mousse/40 font-corps text-xs font-medium text-mousse-fonce hover:bg-mousse/10"
      }
    >
      ?
    </button>
  );

  if (variante === "page") {
    return (
      <>
        <span className="fixed right-4 top-4 z-40 sm:right-6 sm:top-6">
          {bouton}
        </span>
        {ouvert &&
          typeof document !== "undefined" &&
          createPortal(
            <>
              <button
                type="button"
                aria-label="Fermer l'aide"
                onClick={() => setOuvert(false)}
                className="fixed inset-0 z-40 cursor-default bg-encre/10"
              />
              <ContenuBulle
                titre={titre}
                className="fixed right-4 top-16 z-50 sm:right-6"
              >
                {children}
                <button
                  type="button"
                  onClick={() => setOuvert(false)}
                  className="mt-2 block text-xs text-ardoise underline underline-offset-2"
                >
                  Fermer
                </button>
              </ContenuBulle>
            </>,
            document.body
          )}
      </>
    );
  }

  return (
    <span className="relative inline-block align-middle">
      {bouton}
      {ouvert && (
        <ContenuBulle titre={titre} className="absolute left-0 top-7 z-20">
          {children}
          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="mt-2 block text-xs text-ardoise underline underline-offset-2"
          >
            Fermer
          </button>
        </ContenuBulle>
      )}
    </span>
  );
}
