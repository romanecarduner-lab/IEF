"use server";

import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";

export async function terminerOnboarding() {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: appartenance } = await supabase
    .from("utilisateurs_familles")
    .select("famille_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (appartenance?.famille_id) {
    await supabase
      .from("familles")
      .update({ onboarding_termine: true })
      .eq("id", appartenance.famille_id);
  }

  redirect("/tableau-de-bord");
}
