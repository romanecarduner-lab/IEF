"use server";

import JSZip from "jszip";
import { creerClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { listerCheminsFamille, purgerChemins } from "@/lib/purgeStorage";

async function recupererFamilleUtilisateur() {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: appartenance } = await supabase
    .from("utilisateurs_familles")
    .select("famille_id, familles(nom)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!appartenance) return null;
  const famille = Array.isArray(appartenance.familles)
    ? appartenance.familles[0]
    : appartenance.familles;

  return { userId: user.id, familleId: appartenance.famille_id as string, nomFamille: famille?.nom as string };
}

/**
 * Export complet des donnees de la famille, au format JSON. S'appuie
 * entierement sur la RLS (le client utilise est celui de l'utilisateur,
 * pas un client admin) : chaque requete ne retourne donc naturellement
 * que les donnees de sa propre famille.
 */
export async function exporterDonneesJSON(): Promise<
  { erreur: string } | { donnees: Record<string, unknown> }
> {
  const contexte = await recupererFamilleUtilisateur();
  if (!contexte) return { erreur: "Aucun espace familial associé à votre compte." };

  const supabase = creerClientServeur();

  const [
    { data: familles },
    { data: enfants },
    { data: anneesScolaires },
    { data: parcoursScolaires },
    { data: activites },
    { data: traces },
    { data: observations },
    { data: syntheses },
    { data: dossiers },
  ] = await Promise.all([
    supabase.from("familles").select("*"),
    supabase.from("enfants").select("*"),
    supabase.from("annees_scolaires").select("*"),
    supabase.from("parcours_scolaires").select("*"),
    supabase.from("activites").select("*"),
    supabase.from("traces").select("*"),
    supabase.from("observations_elements_programme").select("*"),
    supabase.from("syntheses_progression").select("*"),
    supabase.from("dossiers_export").select("*"),
  ]);

  return {
    donnees: {
      export_genere_le: new Date().toISOString(),
      famille: familles,
      enfants,
      annees_scolaires: anneesScolaires,
      parcours_scolaires: parcoursScolaires,
      activites,
      traces_metadonnees: traces,
      observations_competences: observations,
      syntheses_progression: syntheses,
      dossiers_export: dossiers,
    },
  };
}

/**
 * Export de tous les fichiers (photos, documents, PDF de dossiers) sous
 * forme d'une archive ZIP, encodee en base64 pour traverser la Server
 * Action (le telechargement reel se fait ensuite cote client).
 */
export async function exporterFichiersZIP(): Promise<
  { erreur: string } | { base64: string; nombreFichiers: number }
> {
  const contexte = await recupererFamilleUtilisateur();
  if (!contexte) return { erreur: "Aucun espace familial associé à votre compte." };

  const supabase = creerClientServeur();
  const chemins = await listerCheminsFamille(supabase, contexte.familleId);

  if (chemins.length === 0) {
    return { erreur: "Aucun fichier à exporter pour l'instant." };
  }

  const zip = new JSZip();
  for (const chemin of chemins) {
    const { data: fichier } = await supabase.storage
      .from("traces-pedagogiques")
      .download(chemin);
    if (fichier) {
      zip.file(chemin.split("/").slice(1).join("/"), await fichier.arrayBuffer());
    }
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return { base64: buffer.toString("base64"), nombreFichiers: chemins.length };
}

/**
 * Suppression complete et irreversible de l'espace familial : purge des
 * fichiers Storage, journalisation avant suppression (le journal
 * survit, lui, a la suppression de la famille), suppression en cascade
 * des donnees SQL, puis suppression du compte d'authentification.
 *
 * Necessite que le nom exact de la famille soit retape, pour eviter
 * toute suppression accidentelle.
 */
export async function supprimerEspaceFamilial(
  confirmationNom: string
): Promise<{ erreur: string } | { ok: true }> {
  const contexte = await recupererFamilleUtilisateur();
  if (!contexte) return { erreur: "Aucun espace familial associé à votre compte." };

  if (confirmationNom.trim() !== contexte.nomFamille) {
    return { erreur: "Le nom saisi ne correspond pas exactement au nom de votre espace familial." };
  }

  const supabase = creerClientServeur();

  // Recupere tous les membres AVANT la suppression (utilisateurs_familles
  // sera supprime par la cascade sur familles).
  const { data: membres } = await supabase
    .from("utilisateurs_familles")
    .select("user_id")
    .eq("famille_id", contexte.familleId);

  const chemins = await listerCheminsFamille(supabase, contexte.familleId);

  await supabase.rpc("rpc_journal_auditer", {
    p_famille_id: contexte.familleId,
    p_type_action: "suppression_famille",
    p_cible_type: "famille",
    p_cible_id: contexte.familleId,
    p_details: {
      nom: contexte.nomFamille,
      nb_fichiers_purges: chemins.length,
      nb_membres: membres?.length ?? 0,
    },
  });

  await purgerChemins(supabase, chemins);

  const { error: erreurSuppression } = await supabase
    .from("familles")
    .delete()
    .eq("id", contexte.familleId);

  if (erreurSuppression) {
    return { erreur: "Impossible de supprimer l'espace familial. Merci de réessayer." };
  }

  // Suppression du ou des comptes d'authentification. Seule operation de
  // toute l'application a utiliser la cle service_role (voir admin.ts).
  try {
    const clientAdmin = creerClientAdmin();
    for (const membre of membres ?? []) {
      await clientAdmin.auth.admin.deleteUser(membre.user_id as string);
    }
  } catch (erreurAdmin) {
    console.error("Erreur lors de la suppression du compte d'authentification", erreurAdmin);
    // Les donnees sont deja supprimees ; le compte d'authentification
    // orphelin devra etre retire manuellement si cette etape echoue.
    return {
      erreur:
        "Les données ont été supprimées, mais la suppression du compte a échoué. Contactez le support pour finaliser.",
    };
  }

  return { ok: true };
}
