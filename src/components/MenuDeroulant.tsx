"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function MenuDeroulant({
  libelle,
  children,
}: {
  libelle: string;
  children: React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Ferme le menu a chaque changement de page (clic sur un lien a
  // l'interieur), sans avoir a instrumenter chaque lien individuellement.
  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  useEffect(() => {
    function gererClicExterieur(evenement: MouseEvent) {
      if (ref.current && !ref.current.contains(evenement.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("click", gererClicExterieur);
    return () => document.removeEventListener("click", gererClicExterieur);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        className="flex items-center gap-1 text-sm font-medium text-ardoise hover:text-mousse-fonce"
      >
        {libelle}
        <span className="text-[10px]">{ouvert ? "▲" : "▼"}</span>
      </button>
      {ouvert && (
        <div className="absolute left-0 top-full z-20 mt-2 w-48 rounded-doux border border-trait bg-white p-1.5 shadow-doux">
          {children}
        </div>
      )}
    </div>
  );
}
