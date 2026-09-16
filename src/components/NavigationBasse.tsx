"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Plus, TrendingUp, MoreHorizontal, X } from "lucide-react";
import { creerClientNavigateur } from "@/lib/supabase/client";

const ONGLETS = [
  { href: "/tableau-de-bord", libelle: "Accueil", Icone: Home },
  { href: "/journal", libelle: "Journal", Icone: BookOpen },
];

const ONGLETS_DROITE = [{ href: "/progression", libelle: "Progression", Icone: TrendingUp }];

export function NavigationBasse() {
  const pathname = usePathname();
  const router = useRouter();
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);

  // Ferme la feuille "Plus" a chaque changement de page.
  useEffect(() => {
    setFeuilleOuverte(false);
  }, [pathname]);

  function estActif(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function seDeconnecter() {
    const supabase = creerClientNavigateur();
    await supabase.auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  return (
    <>
      {feuilleOuverte && (
        <div
          className="fixed inset-0 z-40 bg-encre/30 md:hidden"
          onClick={() => setFeuilleOuverte(false)}
          aria-hidden="true"
        />
      )}

      {feuilleOuverte && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-trait bg-white p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-doux md:hidden"
          role="dialog"
          aria-label="Plus d'options"
        >
          <div className="mb-1 flex items-center justify-between px-3 py-2">
            <p className="text-sm font-medium text-encre">Plus</p>
            <button
              type="button"
              onClick={() => setFeuilleOuverte(false)}
              aria-label="Fermer"
              className="flex h-11 w-11 items-center justify-center text-ardoise"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <Link
            href="/export"
            className="flex min-h-[44px] items-center rounded-doux px-3 py-3 text-sm text-encre active:bg-lin"
          >
            Export
          </Link>
          <Link
            href="/famille"
            className="flex min-h-[44px] items-center rounded-doux px-3 py-3 text-sm text-encre active:bg-lin"
          >
            Famille
          </Link>
          <Link
            href="/confidentialite"
            className="flex min-h-[44px] items-center rounded-doux px-3 py-3 text-sm text-encre active:bg-lin"
          >
            Confidentialité
          </Link>
          <button
            type="button"
            onClick={seDeconnecter}
            className="flex min-h-[44px] w-full items-center rounded-doux px-3 py-3 text-left text-sm text-alerte active:bg-lin"
          >
            Se déconnecter
          </button>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-trait bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Navigation principale"
      >
        <div className="mx-auto flex max-w-4xl items-stretch justify-around">
          {ONGLETS.map((onglet) => (
            <Link
              key={onglet.href}
              href={onglet.href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
                estActif(onglet.href)
                  ? "font-semibold text-mousse-fonce"
                  : "text-ardoise active:text-mousse-fonce"
              }`}
            >
              <onglet.Icone className="h-5 w-5" strokeWidth={estActif(onglet.href) ? 2.25 : 1.75} />
              {onglet.libelle}
            </Link>
          ))}

          <div className="relative flex flex-1 items-center justify-center">
            <Link
              href="/journal/nouvelle"
              aria-label="Ajouter une activité"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-brume bg-mousse-fonce text-white shadow-doux active:bg-mousse"
            >
              <Plus className="h-6 w-6" strokeWidth={2.25} />
            </Link>
          </div>

          {ONGLETS_DROITE.map((onglet) => (
            <Link
              key={onglet.href}
              href={onglet.href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
                estActif(onglet.href)
                  ? "font-semibold text-mousse-fonce"
                  : "text-ardoise active:text-mousse-fonce"
              }`}
            >
              <onglet.Icone className="h-5 w-5" strokeWidth={estActif(onglet.href) ? 2.25 : 1.75} />
              {onglet.libelle}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setFeuilleOuverte(true)}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
              feuilleOuverte ? "font-semibold text-mousse-fonce" : "text-ardoise active:text-mousse-fonce"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
            Plus
          </button>
        </div>
      </nav>
    </>
  );
}
