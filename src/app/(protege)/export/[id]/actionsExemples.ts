"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { appellerClaude } from "@/lib/appelIA";
import {
  chargerContexteExport,
  chargerCandidatsParSousDomaine,
  lireExemples,
  morceaux,
  type ExempleStocke,
} from "@/lib/exemplesExport";

export type CandidatPourChoix = {
  id: string;
  titre: string;
  date: string;
  anneeCourante: boolean;
  favori: boolean;
  photos: { id: string; url: string | null }[];
};

const MAX_PHOTOS_PAR_ACTIVITE_AFFICHEES = 8;

type Supabase = ReturnType<typeof creerClientServeur>;

async function lireLigne(supabase: Supabase, dossierId: string, sousDomaine: string) {
  const { data } = await supabase
    .from("dossiers_export_sous_domaines")
    .select("domaine, exemples")
    .eq("dossier_id", dossierId)
    .eq("sous_domaine", sousDomaine)
    .maybeSingle();
  return data;
}

async function enregistrerExemples(
  supabase: Supabase,
  dossierId: string,
  sousDomaine: string,
  exemples: ExempleStocke[]
): Promise<boolean> {
  // Toute modification manuelle des exemples fige le sous-domaine : la
  // preparation groupee ne le regenere plus.
  const { error } = await supabase
    .from("dossiers_export_sous_domaines")
    .update({ exemples, modifie_par_parent: true })
    .eq("dossier_id", dossierId)
    .eq("sous_domaine", sousDomaine);
  if (error) console.error("Erreur d'enregistrement des exemples", error);
  return !error;
}

/**
 * Activites candidates pour illustrer un sous-domaine (avec miniatures de
 * leurs photos), ainsi que le choix actuel -- pour la bande de selection.
 */
export async function chargerCandidatsSousDomaine(
  dossierId: string,
  sousDomaine: string
): Promise<
  | { erreur: string }
  | { candidats: CandidatPourChoix[]; choix: { activiteId: string; traceIds: string[] }[] }
> {
  const supabase = creerClientServeur();

  const contexte = await chargerContexteExport(supabase, dossierId);
  if ("erreur" in contexte) return contexte;

  const entree = contexte.objectifsParSousDomaine.get(sousDomaine);
  if (!entree) return { candidats: [], choix: [] };

  const parSousDomaine = await chargerCandidatsParSousDomaine(
    supabase,
    contexte,
    new Map([[sousDomaine, entree]])
  );
  const liste = parSousDomaine.get(sousDomaine) ?? [];

  // Liens temporaires pour les miniatures, par groupes.
  const chemins = Array.from(
    new Set(
      liste.flatMap((c) =>
        c.photos.slice(0, MAX_PHOTOS_PAR_ACTIVITE_AFFICHEES).map((p) => p.miniature ?? p.chemin)
      )
    )
  );
  const urlParChemin = new Map<string, string>();
  for (const groupe of morceaux(chemins, 80)) {
    const { data } = await supabase.storage.from("traces-pedagogiques").createSignedUrls(groupe, 3600);
    for (const e of data ?? []) {
      if (e.path && e.signedUrl) urlParChemin.set(e.path, e.signedUrl);
    }
  }

  const ligne = await lireLigne(supabase, dossierId, sousDomaine);
  const choix = lireExemples(ligne ?? {}).map((e) => ({
    activiteId: e.activite_id,
    traceIds: e.trace_ids,
  }));

  return {
    candidats: liste.map((c) => ({
      id: c.id,
      titre: c.titre,
      date: c.date,
      anneeCourante: c.anneeCourante,
      favori: c.favori,
      photos: c.photos.slice(0, MAX_PHOTOS_PAR_ACTIVITE_AFFICHEES).map((p) => ({
        id: p.id,
        url: urlParChemin.get(p.miniature ?? p.chemin) ?? null,
      })),
    })),
    choix,
  };
}

async function lirePronom(supabase: Supabase, dossierId: string): Promise<string | null> {
  const { data: dossier } = await supabase
    .from("dossiers_export")
    .select("parcours_scolaires(enfant_id)")
    .eq("id", dossierId)
    .maybeSingle();
  const parcours = Array.isArray(dossier?.parcours_scolaires)
    ? dossier.parcours_scolaires[0]
    : dossier?.parcours_scolaires;
  const enfantId = parcours?.enfant_id as string | undefined;
  if (!enfantId) return null;
  const { data: enfant } = await supabase.from("enfants").select("pronom").eq("id", enfantId).maybeSingle();
  return (enfant?.pronom as string | null) ?? null;
}

/**
 * Ajoute ou retire une activite des exemples d'un sous-domaine. A
 * l'ajout : la premiere photo de l'activite est retenue par defaut, et un
 * court texte pedagogique est redige pour cet exemple (modifiable ensuite).
 */
export async function basculerExemple(
  dossierId: string,
  sousDomaine: string,
  activiteId: string,
  actif: boolean
): Promise<{ erreur: string } | { exemples: ExempleStocke[]; avertissement?: string }> {
  const supabase = creerClientServeur();

  const ligne = await lireLigne(supabase, dossierId, sousDomaine);
  if (!ligne) {
    return { erreur: "Ce sous-domaine n'a pas encore été préparé : lancez d'abord la préparation." };
  }
  let exemples = lireExemples(ligne);
  let avertissement: string | undefined;

  if (!actif) {
    exemples = exemples.filter((e) => e.activite_id !== activiteId);
  } else if (!exemples.some((e) => e.activite_id === activiteId)) {
    const [{ data: activite }, { data: photos }, pronom] = await Promise.all([
      supabase
        .from("activites")
        .select("titre, date_activite, description, observations")
        .eq("id", activiteId)
        .maybeSingle(),
      supabase
        .from("traces")
        .select("id, types_trace!inner(code)")
        .eq("activite_id", activiteId)
        .eq("types_trace.code", "photo")
        .order("date_trace", { ascending: true })
        .order("id")
        .limit(1),
      lirePronom(supabase, dossierId),
    ]);
    if (!activite) return { erreur: "Activité introuvable." };

    const texteActivite = [activite.description as string | null, activite.observations as string | null]
      .filter(Boolean)
      .join(" - ");

    const prompt = `Tu aides un parent qui pratique l'instruction en famille à préparer un dossier destiné au contrôle pédagogique académique. Pour le sous-domaine "${sousDomaine}" (domaine : "${ligne.domaine as string}"), l'activité suivante est retenue comme exemple :
"${activite.titre as string}" (${new Date(activite.date_activite as string).toLocaleDateString("fr-FR")})${texteActivite ? ` : ${texteActivite}` : ""}

Rédige 2 à 3 phrases qui expliquent ce que cette activité montre de la compréhension de l'enfant dans ce sous-domaine.

Règles impératives :
- Base-toi uniquement sur ce qui est écrit ci-dessus : n'invente aucun fait, aucune date, aucun détail absent.
- Ne conclus pas à une maîtrise complète que rien ne confirme.
- ${pronom ? `Si tu emploies un pronom pour désigner l'enfant, utilise exclusivement "${pronom}".` : "N'utilise aucun pronom genré (\"il\"/\"elle\") pour désigner l'enfant."}
- N'utilise pas de tirets longs (— ou –) : préfère des virgules, des deux-points ou des phrases courtes.
- Réponds UNIQUEMENT avec le texte, sans titre ni guillemets autour.`;

    const redaction = await appellerClaude(prompt, 500);
    let synthese: string | null = null;
    if ("erreur" in redaction) {
      avertissement = "L'activité est ajoutée, mais son texte n'a pas pu être rédigé : vous pouvez l'écrire vous-même.";
    } else {
      synthese = redaction.texte.replace(/^["«\s]+|["»\s]+$/g, "") || null;
    }

    const premierePhoto = photos?.[0]?.id as string | undefined;
    exemples = [
      ...exemples,
      { activite_id: activiteId, synthese, trace_ids: premierePhoto ? [premierePhoto] : [] },
    ];
  }

  if (!(await enregistrerExemples(supabase, dossierId, sousDomaine, exemples))) {
    return { erreur: "Impossible d'enregistrer ce choix. Merci de réessayer." };
  }
  revalidatePath(`/export/${dossierId}`);
  return { exemples, avertissement };
}

/** Remplace la liste des photos retenues pour un exemple. */
export async function changerPhotosExemple(
  dossierId: string,
  sousDomaine: string,
  activiteId: string,
  traceIds: string[]
): Promise<{ erreur: string } | { exemples: ExempleStocke[] }> {
  const supabase = creerClientServeur();

  const ligne = await lireLigne(supabase, dossierId, sousDomaine);
  if (!ligne) return { erreur: "Sous-domaine introuvable." };

  // Ne garde que des photos qui appartiennent bien a cette activite.
  const { data: valides } =
    traceIds.length > 0
      ? await supabase.from("traces").select("id").eq("activite_id", activiteId).in("id", traceIds)
      : { data: [] };
  const idsValides = new Set((valides ?? []).map((t) => t.id as string));
  const retenues = traceIds.filter((id) => idsValides.has(id));

  const exemples = lireExemples(ligne).map((e) =>
    e.activite_id === activiteId ? { ...e, trace_ids: retenues } : e
  );
  if (!(await enregistrerExemples(supabase, dossierId, sousDomaine, exemples))) {
    return { erreur: "Impossible d'enregistrer ce choix. Merci de réessayer." };
  }
  revalidatePath(`/export/${dossierId}`);
  return { exemples };
}

/** Enregistre le texte d'un exemple, modifie a la main. */
export async function enregistrerSyntheseExemple(
  dossierId: string,
  sousDomaine: string,
  activiteId: string,
  texte: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();

  const ligne = await lireLigne(supabase, dossierId, sousDomaine);
  if (!ligne) return { erreur: "Sous-domaine introuvable." };

  const exemples = lireExemples(ligne).map((e) =>
    e.activite_id === activiteId ? { ...e, synthese: texte } : e
  );
  if (!(await enregistrerExemples(supabase, dossierId, sousDomaine, exemples))) {
    return { erreur: "Impossible d'enregistrer. Merci de réessayer." };
  }
  revalidatePath(`/export/${dossierId}`);
  return { ok: true };
}
