"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";

export function BoutonDeconnexion() {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);

  async function seDeconnecter() {
    setChargement(true);
    const supabase = creerClientNavigateur();
    await supabase.auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  return (
    <button
      onClick={seDeconnecter}
      disabled={chargement}
      className="text-sm font-medium text-ardoise underline decoration-trait underline-offset-2 hover:text-encre disabled:opacity-60"
    >
      {chargement ? "…" : "Se déconnecter"}
    </button>
  );
}
