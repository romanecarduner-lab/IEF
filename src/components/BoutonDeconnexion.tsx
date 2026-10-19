"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { confirmerDeconnexionSiFileNonVide, viderCachePagesHorsLigne } from "@/lib/horsLigne";

export function BoutonDeconnexion() {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);

  async function seDeconnecter() {
    if (!(await confirmerDeconnexionSiFileNonVide())) return;
    setChargement(true);
    const supabase = creerClientNavigateur();
    await supabase.auth.signOut();
    await viderCachePagesHorsLigne();
    router.push("/connexion");
    router.refresh();
  }

  return (
    <button
      onClick={seDeconnecter}
      disabled={chargement}
      className="block w-full rounded-doux px-3 py-2 text-left text-sm text-encre hover:bg-lin disabled:opacity-60"
    >
      {chargement ? "…" : "Se déconnecter"}
    </button>
  );
}
