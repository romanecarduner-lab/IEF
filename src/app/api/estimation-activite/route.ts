import { NextResponse } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";
import { estimerProgressionAutomatique } from "@/app/(protege)/progression/actions";

// L'estimation de plusieurs competences (parfois une redaction chacune) peut
// durer : duree maximale etendue, et surtout executee HORS de l'enregistrement
// de l'activite, qui ne l'attend plus.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Estime en arriere-plan le statut automatique de chaque competence reliee a
 * une activite. Appelee sans etre attendue par le formulaire : l'utilisatrice
 * est deja sur la fiche de l'activite pendant que ceci se deroule. Les
 * competences qui n'auraient pas pu etre estimees restent proposees au choix
 * manuel sur Progression (et rattrapables par le bouton dedie).
 */
export async function POST(requete: Request) {
  let activiteId: string | undefined;
  try {
    const corps = await requete.json();
    activiteId = typeof corps?.activiteId === "string" ? corps.activiteId : undefined;
  } catch {
    // corps absent ou illisible
  }
  if (!activiteId) {
    return NextResponse.json({ erreur: "Activité manquante." }, { status: 400 });
  }

  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erreur: "Session expirée." }, { status: 401 });
  }

  const { data: activite } = await supabase
    .from("activites")
    .select("parcours_id")
    .eq("id", activiteId)
    .maybeSingle();
  if (!activite) {
    return NextResponse.json({ erreur: "Activité introuvable." }, { status: 404 });
  }

  const { data: observations } = await supabase
    .from("observations_elements_programme")
    .select("element_programme_id")
    .eq("activite_id", activiteId);

  // Une a la fois : des ecritures simultanees en base peuvent entrer en
  // conflit entre elles.
  let nbEchecs = 0;
  for (const o of observations ?? []) {
    try {
      const resultat = await estimerProgressionAutomatique(
        activite.parcours_id as string,
        o.element_programme_id as string
      );
      if ("erreur" in resultat) nbEchecs++;
    } catch (e) {
      console.error("Erreur d'estimation en arriere-plan", o.element_programme_id, e);
      nbEchecs++;
    }
  }

  return NextResponse.json({ ok: true, nbEchecs });
}
