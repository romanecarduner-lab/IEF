"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { appellerClaude } from "@/lib/appelIA";
import {
  chargerContexteExport,
  chargerCandidatsParSousDomaine,
  repartirExemples,
  lireExemples,
  type ExempleStocke,
} from "@/lib/exemplesExport";

const TAILLE_LOT_PREPARATION = 3;

/**
 * Prepare, par petits lots successifs, pour chaque sous-domaine ayant au
 * moins une competence observee (statut cumulatif reel) : une synthese qui
 * melange les competences observees (ecrite au positif, en mentionnant
 * "en cours d'acquisition" la ou c'est pertinent, sans jamais lister ce
 * qui n'est pas fait), et des exemples d'activites avec leur propre
 * synthese et leur photo.
 *
 * Choix des exemples : au moins 2 par sous-domaine quand c'est possible,
 * activites avec photo en priorite, et une meme activite n'illustre pas
 * deux sous-domaines differents tant qu'il reste d'autres choix (la
 * repartition est faite avant toute redaction, voir exemplesExport.ts).
 * Un sous-domaine modifie a la main n'est jamais regenere, et ses
 * activites comptent comme deja utilisees.
 *
 * Traite au plus TAILLE_LOT_PREPARATION sous-domaines par appel (chacun
 * demande une redaction de plusieurs secondes : tout en un seul appel
 * depasserait la duree maximale d'une fonction serveur). Le client rappelle
 * cette action avec la liste de ceux deja traites pendant cette preparation.
 */
export async function preparerFormulationsExport(
  dossierId: string,
  dejaTraites: string[] = []
): Promise<
  | { erreur: string }
  | { nbPreparees: number; traites: string[]; resteAFaire: boolean; totalRestant: number }
> {
  const supabase = creerClientServeur();

  const resultatContexte = await chargerContexteExport(supabase, dossierId);
  if ("erreur" in resultatContexte) return resultatContexte;
  const contexte = resultatContexte;

  const { data: lignesExistantes, error: erreurLignes } = await supabase
    .from("dossiers_export_sous_domaines")
    .select("sous_domaine, modifie_par_parent, exemples")
    .eq("dossier_id", dossierId);
  if (erreurLignes) {
    // Table ou colonne absente : une migration n'a pas ete appliquee.
    console.error("Table des sous-domaines de l'export indisponible", erreurLignes);
    return {
      erreur:
        "Une mise à jour de la base de données est manquante (exemples de l'export). Contactez la personne qui administre l'application.",
    };
  }

  const modifiesParParent = new Set<string>();
  const dejaUtilisees = new Set<string>();
  for (const ligne of lignesExistantes ?? []) {
    if (!ligne.modifie_par_parent) continue;
    modifiesParParent.add(ligne.sous_domaine as string);
    for (const e of lireExemples(ligne)) dejaUtilisees.add(e.activite_id);
  }

  const candidatsParSousDomaine = await chargerCandidatsParSousDomaine(
    supabase,
    contexte,
    contexte.objectifsParSousDomaine
  );

  const aAttribuer = Array.from(contexte.objectifsParSousDomaine.keys()).filter(
    (nom) => !modifiesParParent.has(nom) && (candidatsParSousDomaine.get(nom)?.length ?? 0) > 0
  );
  const repartition = repartirExemples(candidatsParSousDomaine, aAttribuer, dejaUtilisees);

  const dejaTraitesSet = new Set(dejaTraites);
  const aTraiter = aAttribuer.filter((nom) => !dejaTraitesSet.has(nom));
  const lot = aTraiter.slice(0, TAILLE_LOT_PREPARATION);

  // Libelles des competences du lot, en une seule requete.
  const idsDuLot = lot.flatMap((nom) => contexte.objectifsParSousDomaine.get(nom)?.objectifIds ?? []);
  const { data: objectifsDetailles } =
    idsDuLot.length > 0
      ? await supabase.from("elements_programme").select("id, libelle").in("id", idsDuLot)
      : { data: [] };
  const libelleParObjectif = new Map(
    (objectifsDetailles ?? []).map((o) => [o.id as string, o.libelle as string])
  );

  async function preparerUnSousDomaine(sousDomaine: string): Promise<boolean> {
    const entree = contexte.objectifsParSousDomaine.get(sousDomaine);
    if (!entree) return false;
    const idsChoisis = repartition.get(sousDomaine) ?? [];
    const candidats = candidatsParSousDomaine.get(sousDomaine) ?? [];
    const exemplesRetenus = idsChoisis
      .map((id) => candidats.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    if (exemplesRetenus.length === 0) return false;

    const blocCompetences = entree.objectifIds
      .map((id) => {
        const libelle = libelleParObjectif.get(id) ?? "";
        const statut = contexte.libelleParStatutCode.get(contexte.statutParObjectif.get(id) ?? "") ?? "";
        return `- ${libelle} (${statut})`;
      })
      .join("\n");

    const blocExemples = exemplesRetenus
      .map(
        (e, i) =>
          `${i + 1}. "${e.titre}" (${new Date(e.date).toLocaleDateString("fr-FR")})${e.texte ? ` : ${e.texte}` : ""}`
      )
      .join("\n");

    const prompt = `Tu aides un parent qui pratique l'instruction en famille à préparer, pour un dossier destiné au contrôle pédagogique académique, le bilan d'un sous-domaine du programme officiel : "${sousDomaine}" (domaine : "${entree.domaine}").

${contexte.pronom ? `Si tu emploies un pronom pour désigner l'enfant, utilise exclusivement "${contexte.pronom}".` : "N'utilise aucun pronom genré (\"il\"/\"elle\") pour désigner l'enfant."}

Compétences de ce sous-domaine déjà observées, avec leur statut réel :
${blocCompetences}

Activités retenues comme exemples pour ce sous-domaine :
${blocExemples}

Rédige :
1. "synthese" : un paragraphe de 4 à 6 phrases qui décrit, en mélangeant naturellement les compétences listées ci-dessus, ce que l'enfant sait faire dans ce sous-domaine. Reste factuel et nuancé : pour une compétence encore "en cours d'acquisition" ou "à travailler", dis-le avec ce vocabulaire plutôt que de laisser croire à une maîtrise complète. Ne mentionne JAMAIS les compétences qui ne sont pas dans la liste ci-dessus (celles non encore abordées) : ce paragraphe ne parle que de ce qui a été observé.
2. "exemples" : un tableau de ${exemplesRetenus.length} texte(s), dans le même ordre que les activités listées ci-dessus. Chaque texte fait 2 à 3 phrases et explique ce que l'activité correspondante montre de la compréhension de l'enfant.

Règles impératives :
- Base-toi uniquement sur les compétences et activités listées ci-dessus : n'invente aucun fait, aucune date, aucun détail absent.
- Ne déduis jamais une maîtrise complète que le statut réel ne confirme pas.
- Ne recopie jamais le texte du programme officiel mot pour mot : reformule avec tes propres mots.
- N'utilise pas de tirets longs (— ou –) : préfère des virgules, des deux-points ou des phrases courtes.
- Réponds UNIQUEMENT avec un objet JSON de cette forme exacte, sans rien d'autre autour :
{"synthese": "...", "exemples": ["...", "..."]}`;

    const resultat = await appellerClaude(prompt, 1800);
    if ("erreur" in resultat) {
      console.error("Erreur lors de la preparation groupee (sous-domaine)", sousDomaine, resultat.erreur);
      return false;
    }

    let reponse: { synthese?: string; exemples?: string[] } = {};
    try {
      const correspondance = resultat.texte.match(/\{[\s\S]*\}/);
      if (!correspondance) throw new Error("Aucun objet JSON trouve dans la reponse.");
      reponse = JSON.parse(correspondance[0]);
    } catch (e) {
      console.error("Reponse non exploitable (preparation export)", sousDomaine, e, resultat.texte);
      return false;
    }

    const exemples: ExempleStocke[] = exemplesRetenus.map((c, i) => ({
      activite_id: c.id,
      synthese: typeof reponse.exemples?.[i] === "string" ? (reponse.exemples[i] as string) : null,
      trace_ids: c.photos[0] ? [c.photos[0].id] : [],
    }));

    const { error } = await supabase.from("dossiers_export_sous_domaines").upsert(
      {
        dossier_id: dossierId,
        domaine: entree.domaine,
        sous_domaine: sousDomaine,
        synthese: reponse.synthese ?? null,
        exemples,
        genere_le: new Date().toISOString(),
        modifie_par_parent: false,
      },
      { onConflict: "dossier_id,sous_domaine" }
    );
    if (error) {
      console.error("Erreur d'enregistrement du sous-domaine", sousDomaine, error);
      return false;
    }
    return true;
  }

  const resultats = await Promise.all(
    lot.map((nom) =>
      preparerUnSousDomaine(nom).catch((e) => {
        console.error("Erreur inattendue (preparation sous-domaine)", nom, e);
        return false;
      })
    )
  );

  revalidatePath(`/export/${dossierId}`);
  return {
    nbPreparees: resultats.filter(Boolean).length,
    traites: lot,
    resteAFaire: aTraiter.length > lot.length,
    totalRestant: aTraiter.length - lot.length,
  };
}

/**
 * Enregistre la synthese d'un sous-domaine modifiee a la main par le
 * parent : marque le sous-domaine comme modifie, pour que la preparation
 * groupee ne l'ecrase plus jamais ensuite.
 */
export async function enregistrerSousDomaine(
  dossierId: string,
  sousDomaine: string,
  texte: string
): Promise<{ erreur: string } | { ok: true }> {
  const supabase = creerClientServeur();

  const { error } = await supabase.from("dossiers_export_sous_domaines").upsert(
    {
      dossier_id: dossierId,
      sous_domaine: sousDomaine,
      synthese: texte,
      modifie_par_parent: true,
    },
    { onConflict: "dossier_id,sous_domaine" }
  );

  if (error) {
    console.error("Erreur lors de l'enregistrement du sous-domaine", error);
    return { erreur: "Impossible d'enregistrer. Merci de réessayer." };
  }

  revalidatePath(`/export/${dossierId}`);
  return { ok: true };
}
