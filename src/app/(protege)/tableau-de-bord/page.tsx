import Link from "next/link";
import {
  User,
  BookOpen,
  FileText,
  FolderOpen,
  MessageCircle,
  HeartPulse,
  Palette,
  Calculator,
  Compass,
  Globe,
  Sparkles,
  Camera,
  type LucideIcon,
} from "lucide-react";
import { creerClientServeur } from "@/lib/supabase/server";
import { libelleCourtDomaine } from "@/lib/libelleCourtDomaine";
import { BoutonIdeesActivites } from "../progression/BoutonIdeesActivites";
import { AideContextuelle } from "@/components/AideContextuelle";
import { SelecteurParcoursTableauDeBord } from "./SelecteurParcoursTableauDeBord";

const DUREE_SIGNATURE_SECONDES = 60 * 60;

function iconeDomaine(nom: string): LucideIcon {
  const n = nom.toLowerCase();
  if (n.includes("langage")) return MessageCircle;
  if (n.includes("physique")) return HeartPulse;
  if (n.includes("artistique")) return Palette;
  if (n.includes("mathématique")) return Calculator;
  if (n.includes("temps") || n.includes("espace")) return Compass;
  if (n.includes("vivant") || n.includes("matière")) return Globe;
  return Sparkles;
}

function libelleDate(date: string): string {
  const d = new Date(date);
  const aujourdhui = new Date();
  const hier = new Date();
  hier.setDate(aujourdhui.getDate() - 1);
  const meme = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (meme(d, aujourdhui)) return "Aujourd'hui";
  if (meme(d, hier)) return "Hier";
  return d.toLocaleDateString("fr-FR");
}

// Les idees de l'accueil ne doivent pas changer a chaque rechargement de la
// page (par exemple quand on demande des idees d'activites, ou qu'une mise a
// jour se fait en arriere-plan) : le tirage est donc fixe pour la journee.
// Il change le lendemain, ou des que les competences non abordees changent.
type Aleatoire = () => number;

function fabriquerAleatoire(graine: string): Aleatoire {
  let h = 1779033703 ^ graine.length;
  for (let i = 0; i < graine.length; i++) {
    h = Math.imul(h ^ graine.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let etat = h >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Supabase ne renvoie que 1000 lignes par requete au maximum : pour un enfant
// qui a beaucoup d'observations, la liste etait tronquee et des competences
// deja travaillees n'etaient plus reconnues. On lit donc par tranches.
async function lireToutesLesObservations(
  supabase: ReturnType<typeof creerClientServeur>,
  parcoursIds: string[]
): Promise<{ data: { element_programme_id: string }[]; error: string | null }> {
  const toutes: { element_programme_id: string }[] = [];
  if (parcoursIds.length === 0) return { data: toutes, error: null };
  const TAILLE = 1000;
  for (let debut = 0; ; debut += TAILLE) {
    const { data, error } = await supabase
      .from("observations_elements_programme")
      .select("id, element_programme_id, activites!inner(parcours_id)")
      .in("activites.parcours_id", parcoursIds)
      .order("id")
      .range(debut, debut + TAILLE - 1);
    if (error) return { data: toutes, error: error.message };
    for (const o of data ?? []) toutes.push({ element_programme_id: o.element_programme_id as string });
    if (!data || data.length < TAILLE) break;
  }
  return { data: toutes, error: null };
}

function melanger<T>(tableau: T[], alea: Aleatoire): T[] {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1));
    const temp = copie[i];
    copie[i] = copie[j]!;
    copie[j] = temp!;
  }
  return copie;
}

export default async function PageTableauDeBord({
  searchParams,
}: {
  searchParams: { parcours?: string; debug?: string };
}) {
  const supabase = creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const prenom = (user?.user_metadata?.prenom as string | undefined) ?? "";
  const jourParis = new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
  const graineDuJour = `${user?.id ?? ""}|${jourParis}`;
  const alea = fabriquerAleatoire(graineDuJour);

  const [
    { count: nbEnfants },
    { count: nbActivites },
    { count: nbTraces },
    { count: nbDossiersFinalises },
    { data: parcoursBruts },
    { data: tracesBrutes },
  ] = await Promise.all([
    supabase.from("enfants").select("id", { count: "exact", head: true }),
    supabase.from("activites").select("id", { count: "exact", head: true }),
    supabase.from("traces").select("id", { count: "exact", head: true }),
    supabase
      .from("dossiers_export")
      .select("id", { count: "exact", head: true })
      .eq("statut", "finalise"),
    supabase
      .from("parcours_scolaires")
      .select("id, cycle_id, enfant_id, enfants(prenom), cycles(libelle), annees_scolaires(libelle)")
      .order("created_at", { ascending: false }),
    supabase
      .from("traces")
      .select(
        `id, legende, date_trace, miniature_chemin_stockage, types_trace(libelle),
         activites(id, titre, parcours_scolaires(enfants(prenom)))`
      )
      .order("date_trace", { ascending: false })
      .limit(3),
  ]);

  const parcours = (parcoursBruts ?? []).map((p) => {
    const enfant = Array.isArray(p.enfants) ? p.enfants[0] : p.enfants;
    const cycle = Array.isArray(p.cycles) ? p.cycles[0] : p.cycles;
    const annee = Array.isArray(p.annees_scolaires)
      ? p.annees_scolaires[0]
      : p.annees_scolaires;
    return {
      id: p.id as string,
      cycleId: p.cycle_id as string,
      cycleLibelle: (cycle?.libelle as string | undefined) ?? "?",
      enfantId: p.enfant_id as string,
      enfant: (enfant?.prenom as string | undefined) ?? "?",
      annee: annee?.libelle as string | undefined,
    };
  });

  // La progression (tableau de bord, Progression) est desormais cumulee
  // sur tout le cycle : choisir entre deux annees du meme enfant et du
  // meme cycle n'y changerait plus rien a afficher. Le repere pertinent
  // ici est donc l'enfant et son cycle, pas l'annee -- un seul parcours
  // retenu par (enfant, cycle), le plus recent (deja l'ordre de la
  // requete). Un enfant ayant change de cycle apparait, a juste titre,
  // en plusieurs entrees distinctes (chaque cycle a sa propre
  // progression, ca n'a pas de sens de les cumuler ensemble).
  const enfantsUniques = Array.from(
    new Map(parcours.map((p) => [`${p.enfantId}-${p.cycleId}`, p])).values()
  );

  const plusieursEnfants = enfantsUniques.length > 1;
  const parcoursSelectionne =
    enfantsUniques.find((p) => p.id === searchParams.parcours) ?? enfantsUniques[0];

  let domainesProgression: { nom: string; pourcentage: number }[] = [];
  if (parcoursSelectionne) {
    const [{ data: totauxDomaine }, { data: repartitionDomaine }] = await Promise.all([
      supabase
        .from("v_total_objectifs_par_domaine")
        .select("domaine, total_objectifs")
        .eq("cycle_id", parcoursSelectionne.cycleId),
      supabase
        .from("v_progression_par_domaine_cumulee")
        .select("domaine, statut_code, nb")
        .eq("enfant_id", parcoursSelectionne.enfantId)
        .eq("cycle_id", parcoursSelectionne.cycleId),
    ]);

    domainesProgression = (totauxDomaine ?? []).map((t) => {
      const domaine = t.domaine as string;
      const total = t.total_objectifs as number;
      const nbValides = (repartitionDomaine ?? [])
        .filter((r) => r.domaine === domaine && r.statut_code !== "non_encore_observe")
        .reduce((acc, r) => acc + (r.nb as number), 0);
      return {
        nom: domaine,
        pourcentage: total > 0 ? Math.round((nbValides / total) * 100) : 0,
      };
    });
  }

  // Jusqu'a 3 competences jamais reliees a une activite -- une par
  // domaine ET reparties entre tous les enfants du foyer (pas seulement
  // celui affiche dans "Le parcours de..." ci-dessus), pour que chaque
  // enfant ait ses chances d'apparaitre au fil des visites. Choix
  // volontaire : la selection est gratuite et immediate (pas d'IA),
  // l'idee concrete reste a un clic. Tirage aleatoire a chaque
  // chargement (enfant, domaine, ET competence dans le domaine).
  type Candidat = {
    id: string;
    libelle: string;
    domaine: string;
    enfantPrenom: string;
    parcoursId: string;
    // Renseigne quand la competence appartient a un sous-domaine dans
    // lequel RIEN n'a encore ete observe (pas seulement cette competence).
    sousDomaineVierge?: string;
  };

  // Chemins complets (domaine > sous-domaine > ... > objectif) par petits
  // groupes d'identifiants : evite une liste trop longue dans une seule
  // requete, et contourne la limite de lignes d'une requete non filtree.
  async function chargerChemins(ids: string[]): Promise<Map<string, string>> {
    const morceaux: string[][] = [];
    for (let i = 0; i < ids.length; i += 150) morceaux.push(ids.slice(i, i + 150));
    const reponses = await Promise.all(
      morceaux.map((m) =>
        supabase.from("v_chemin_complet_objectif").select("objectif_id, chemin").in("objectif_id", m)
      )
    );
    const carte = new Map<string, string>();
    for (const r of reponses) {
      for (const c of r.data ?? []) carte.set(c.objectif_id as string, c.chemin as string);
    }
    return carte;
  }
  // Un seul parcours traite par (enfant, cycle) : sinon, un enfant ayant
  // deux annees du meme cycle verrait ses suggestions calculees deux
  // fois (une par annee), pour le meme resultat en double.
  const parcoursUnParEnfantCycle = Array.from(
    new Map(parcours.map((p) => [`${p.enfantId}-${p.cycleId}`, p])).values()
  );
  // Diagnostic temporaire, visible seulement avec ?debug=1 dans l'adresse.
  const debugIdsAbordes = new Map<string, { ids: Set<string>; nbObs: number; erreur: string | null }>();
  const candidatsParEnfant = await Promise.all(
    parcoursUnParEnfantCycle.map(async (p) => {
      // Un objectif compte comme "aborde" des qu'il a ete observe sur
      // N'IMPORTE QUELLE annee du meme cycle pour ce meme enfant -- pas
      // seulement sur ce parcours precis -- pour ne pas reproposer une
      // competence deja acquise l'annee precedente.
      const parcoursMemeCycle = parcours
        .filter((autre) => autre.enfantId === p.enfantId && autre.cycleId === p.cycleId)
        .map((autre) => autre.id);

      // Un tirage propre a chaque parcours : ces calculs se font en parallele,
      // l'ordre dans lequel ils finissent ne doit pas changer le resultat.
      const aleaParcours = fabriquerAleatoire(`${graineDuJour}|${p.id}`);

      const [
        { data: tousLesObjectifs, error: erreurObjectifs },
        { data: observations, error: erreurObservations },
        { data: syntheses, error: erreurSyntheses },
      ] = await Promise.all([
        supabase
          .from("v_objectif_domaine")
          .select("objectif_id, libelle, domaine")
          .eq("cycle_id", p.cycleId)
          .order("objectif_id"),
        lireToutesLesObservations(supabase, parcoursMemeCycle),
        // Une competence deja suivie (statut present, valide a la main
        // ou automatiquement) compte aussi comme abordee, meme sans
        // observation directe sur une activite.
        supabase
          .from("v_synthese_cumulee_cycle")
          .select("element_programme_id")
          .eq("enfant_id", p.enfantId)
          .eq("cycle_id", p.cycleId),
      ]);

      // Si une lecture echoue, les competences deja travaillees ne sont plus
      // retirees des idees : on le signale dans les journaux du serveur.
      if (erreurObjectifs || erreurObservations || erreurSyntheses) {
        console.error("Accueil, idees : lecture incomplete", {
          parcours: p.id,
          erreurObjectifs,
          erreurObservations,
          erreurSyntheses,
        });
      }

      const idsAbordes = new Set([
        ...(observations ?? []).map((o) => o.element_programme_id as string),
        ...(syntheses ?? []).map((o) => o.element_programme_id as string),
      ]);
      // Une competence au libelle strictement identique a une competence
      // deja abordee (reprise a un autre age du cycle) est elle aussi
      // consideree comme abordee : le suivi se fait a l'echelle du cycle.
      // Les libelles sont compares a partir des ELEMENTS EFFECTIVEMENT observes
      // (table elements_programme du cycle), et pas seulement a partir de la
      // liste des objectifs proposes : une competence observee peut etre un
      // autre element portant le meme libelle, absent de cette liste.
      // La comparaison ignore espaces et majuscules.
      const normaliser = (texte: string) => texte.replace(/\s+/g, " ").trim().toLowerCase();
      const { data: elementsDuCycle } = await supabase
        .from("elements_programme")
        .select("id, libelle")
        .eq("cycle_id", p.cycleId);
      const libellesAbordes = new Set<string>();
      for (const e of elementsDuCycle ?? []) {
        if (idsAbordes.has(e.id as string)) libellesAbordes.add(normaliser(e.libelle as string));
      }
      for (const o of tousLesObjectifs ?? []) {
        if (idsAbordes.has(o.objectif_id as string)) libellesAbordes.add(normaliser(o.libelle as string));
      }
      for (const o of tousLesObjectifs ?? []) {
        if (libellesAbordes.has(normaliser(o.libelle as string))) idsAbordes.add(o.objectif_id as string);
      }
      for (const e of elementsDuCycle ?? []) {
        if (libellesAbordes.has(normaliser(e.libelle as string))) idsAbordes.add(e.id as string);
      }

      // Sous-domaine d'une competence = 2e segment de son chemin complet
      // (on ignore les structures a deux niveaux seulement, ou ce
      // "sous-domaine" serait la competence elle-meme).
      const chemins = await chargerChemins(
        (tousLesObjectifs ?? []).map((o) => o.objectif_id as string)
      );
      const cleSousDomaine = (id: string): string | null => {
        const segments = chemins.get(id)?.split(" > ");
        if (!segments || segments.length < 3) return null;
        return `${segments[0]} > ${segments[1]}`;
      };
      const sousDomainesTouches = new Set<string>();
      for (const id of idsAbordes) {
        const cle = cleSousDomaine(id);
        if (cle) sousDomainesTouches.add(cle);
      }

      debugIdsAbordes.set(p.id, {
        ids: new Set(idsAbordes),
        nbObs: (observations ?? []).length,
        erreur: erreurObservations ?? null,
      });

      const nonAbordesParDomaine = new Map<string, { id: string; libelle: string }[]>();
      const viergesParSousDomaine = new Map<
        string,
        { id: string; libelle: string; domaine: string; sousDomaine: string }[]
      >();
      for (const o of tousLesObjectifs ?? []) {
        const id = o.objectif_id as string;
        if (idsAbordes.has(id)) continue;
        const domaine = o.domaine as string;
        const liste = nonAbordesParDomaine.get(domaine) ?? [];
        liste.push({ id, libelle: o.libelle as string });
        nonAbordesParDomaine.set(domaine, liste);

        const cle = cleSousDomaine(id);
        if (cle && !sousDomainesTouches.has(cle)) {
          const listeVierge = viergesParSousDomaine.get(cle) ?? [];
          listeVierge.push({
            id,
            libelle: o.libelle as string,
            domaine,
            sousDomaine: cle.split(" > ")[1] ?? cle,
          });
          viergesParSousDomaine.set(cle, listeVierge);
        }
      }

      const normaux: Candidat[] = [];
      for (const [domaine, objectifs] of nonAbordesParDomaine) {
        const choisi = objectifs[Math.floor(aleaParcours() * objectifs.length)];
        if (!choisi) continue;
        normaux.push({
          id: choisi.id,
          libelle: choisi.libelle,
          domaine,
          enfantPrenom: p.enfant,
          parcoursId: p.id,
        });
      }

      const vierges: Candidat[] = [];
      for (const objectifs of viergesParSousDomaine.values()) {
        const choisi = objectifs[Math.floor(aleaParcours() * objectifs.length)];
        if (!choisi) continue;
        vierges.push({
          id: choisi.id,
          libelle: choisi.libelle,
          domaine: choisi.domaine,
          enfantPrenom: p.enfant,
          parcoursId: p.id,
          sousDomaineVierge: choisi.sousDomaine,
        });
      }
      return { normaux, vierges };
    })
  );

  // Trois suggestions : toujours des competences pas encore abordees,
  // dont UNE choisie, quand c'est possible, dans un sous-domaine ou rien
  // n'a encore ete observe du tout. L'ordre est melange pour que celle-ci
  // ne soit pas toujours en premiere position.
  const tousNormaux = candidatsParEnfant.flatMap((c) => c.normaux);
  const tousVierges = candidatsParEnfant.flatMap((c) => c.vierges);
  const viergeChoisie = melanger(tousVierges, alea)[0];
  const suggestionsCompetences = viergeChoisie
    ? [
        viergeChoisie,
        ...melanger(
          tousNormaux.filter(
            (c) => c.id !== viergeChoisie.id && c.libelle !== viergeChoisie.libelle
          ),
          alea
        ).slice(0, 2),
      ]
    : melanger(tousNormaux, alea).slice(0, 3);

  // Chemin complet (tranche d'age comprise) recupere seulement pour les
  // quelques suggestions finalement retenues -- requete bornee, pas un
  // appel par objectif du programme.
  const { data: cheminsSuggestions } =
    suggestionsCompetences.length > 0
      ? await supabase
          .from("v_chemin_complet_objectif")
          .select("objectif_id, chemin")
          .in(
            "objectif_id",
            suggestionsCompetences.map((s) => s.id)
          )
      : { data: [] };
  const cheminParObjectifId = new Map(
    (cheminsSuggestions ?? []).map((c) => [c.objectif_id as string, c.chemin as string])
  );

  const traces = await Promise.all(
    (tracesBrutes ?? []).map(async (t) => {
      const type = Array.isArray(t.types_trace) ? t.types_trace[0] : t.types_trace;
      const activite = Array.isArray(t.activites) ? t.activites[0] : t.activites;
      const parcoursActivite = activite
        ? Array.isArray(activite.parcours_scolaires)
          ? activite.parcours_scolaires[0]
          : activite.parcours_scolaires
        : null;
      const enfantActivite = parcoursActivite
        ? Array.isArray(parcoursActivite.enfants)
          ? parcoursActivite.enfants[0]
          : parcoursActivite.enfants
        : null;
      let urlMiniature: string | null = null;
      if (t.miniature_chemin_stockage) {
        const { data } = await supabase.storage
          .from("traces-pedagogiques")
          .createSignedUrl(t.miniature_chemin_stockage as string, DUREE_SIGNATURE_SECONDES);
        urlMiniature = data?.signedUrl ?? null;
      }
      return {
        id: t.id as string,
        legende: (t.legende as string | null) || (activite?.titre as string | undefined) || "Trace",
        date: t.date_trace as string,
        typeLibelle: type?.libelle as string | undefined,
        activiteId: activite?.id as string | undefined,
        enfantPrenom: enfantActivite?.prenom as string | undefined,
        urlMiniature,
      };
    })
  );

  // Derniere activite enregistree (tous enfants confondus) : point de
  // depart rapide pour "refaire" ou reprendre le fil.
  const { data: derniereBrute } = await supabase
    .from("activites")
    .select("id, titre, date_activite, parcours_scolaires!inner(enfants(prenom))")
    .order("date_activite", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const derniereActivite = derniereBrute
    ? (() => {
        const ps = Array.isArray(derniereBrute.parcours_scolaires)
          ? derniereBrute.parcours_scolaires[0]
          : derniereBrute.parcours_scolaires;
        const enf = ps ? (Array.isArray(ps.enfants) ? ps.enfants[0] : ps.enfants) : null;
        return {
          id: derniereBrute.id as string,
          titre: derniereBrute.titre as string,
          date: derniereBrute.date_activite as string,
          enfant: (enf?.prenom as string | undefined) ?? "",
        };
      })()
    : null;

  const cartes = [
    { libelle: "Enfant", pluriel: "Enfants", Icone: User, valeur: nbEnfants ?? 0 },
    { libelle: "Activité", pluriel: "Activités", Icone: BookOpen, valeur: nbActivites ?? 0 },
    { libelle: "Trace", pluriel: "Traces", Icone: FileText, valeur: nbTraces ?? 0 },
    {
      libelle: "Dossier finalisé",
      pluriel: "Dossiers finalisés",
      Icone: FolderOpen,
      valeur: nbDossiersFinalises ?? 0,
    },
  ];

  return (
    <div>
      <div className="relative mb-5 overflow-hidden sm:mb-8">
        <div className="relative z-10 max-w-md">
          <h1 className="mb-1 font-display text-2xl italic text-encre sm:text-3xl">
            Bonjour{prenom ? ` ${prenom}` : ""},
          </h1>
          <AideContextuelle titre="Le tableau de bord" variante="page">
            C&rsquo;est votre page d&rsquo;accueil : un résumé de ce qui a
            déjà été fait (activités, traces) et, à droite, des idées
            pour continuer. Rien n&rsquo;est automatique ni obligatoire
            : vous restez seule ou seul maître de ce que vous décidez
            de faire.
          </AideContextuelle>
          <p className="mb-4 text-sm text-ardoise sm:mb-6 sm:text-base">
            {plusieursEnfants
              ? "Un regard sur le chemin parcouru par vos enfants."
              : parcoursSelectionne
              ? `Un regard sur le chemin parcouru par ${parcoursSelectionne.enfant}.`
              : "Un regard sur le chemin parcouru par votre enfant."}
          </p>
          <Link
            href="/journal/nouvelle"
            className="bouton-primaire inline-flex min-h-[48px] items-center gap-2 text-base shadow-doux active:bg-mousse"
          >
            + Ajouter une activité
          </Link>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/chemin-vegetal.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-2 hidden w-80 opacity-90 lg:block"
        />
      </div>


      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-4 sm:space-y-6">
          {derniereActivite && (
            <div className="carte p-4 sm:p-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ardoise">
                Dernière activité
              </p>
              <Link
                href={`/journal/${derniereActivite.id}`}
                className="block font-display text-lg italic text-encre hover:text-mousse-fonce sm:text-xl"
              >
                {derniereActivite.titre}
              </Link>
              <p className="mb-3 text-sm text-ardoise">
                {libelleDate(derniereActivite.date)}
                {plusieursEnfants && derniereActivite.enfant ? ` · ${derniereActivite.enfant}` : ""}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/journal/nouvelle?refaire=${derniereActivite.id}`}
                  className="bouton-secondaire bouton-petit"
                >
                  Refaire cette activité
                </Link>
                <Link href={`/journal/${derniereActivite.id}`} className="bouton-secondaire bouton-petit">
                  Ouvrir
                </Link>
              </div>
            </div>
          )}

          {suggestionsCompetences.length > 0 && (
            <div className="carte p-4 sm:p-5">
              <p className="mb-1 font-display text-base italic text-encre sm:text-lg">
                Idées pour continuer
              </p>
              <p className="mb-3 text-xs text-ardoise">
                Quelques compétences pas encore abordées — juste des pistes,
                rien d&rsquo;obligatoire.
              </p>
              <ul className="space-y-3">
                {suggestionsCompetences.map((s) => {
                  const dupliqueParmiLesSuggestions =
                    suggestionsCompetences.filter((autre) => autre.libelle === s.libelle).length >
                    1;
                  return (
                    <li key={s.id} className="border-b border-trait pb-3 last:border-b-0 last:pb-0">
                      <p className="text-xs font-medium text-argile">
                        {libelleCourtDomaine(s.domaine)}
                        {plusieursEnfants && ` · ${s.enfantPrenom}`}
                      </p>
                      <p className="mb-1 text-sm text-encre">{s.libelle}</p>
                      {s.sousDomaineVierge && (
                        <p className="mb-1 text-xs text-mousse-fonce">
                          Rien n&rsquo;a encore été abordé dans ce sous-domaine
                          ({s.sousDomaineVierge})
                        </p>
                      )}
                      {dupliqueParmiLesSuggestions && cheminParObjectifId.has(s.id) && (
                        <p className="mb-1 text-xs text-ardoise">
                          {cheminParObjectifId.get(s.id)}
                        </p>
                      )}
                      <BoutonIdeesActivites
                        objectifId={s.id}
                        objectifLibelle={s.libelle}
                        parcoursId={s.parcoursId}
                      />
                    </li>
                  );
                })}
              </ul>
              {searchParams.debug === "1" && (
                <div className="mt-3 border-t border-trait pt-3 text-xs text-ardoise">
                  <p className="font-medium">Diagnostic (temporaire)</p>
                  {suggestionsCompetences.map((s) => {
                    const d = debugIdsAbordes.get(s.parcoursId);
                    return (
                      <p key={s.id}>
                        {s.id.slice(0, 8)} · parcours {s.parcoursId.slice(0, 8)} · observations lues :{" "}
                        {d?.nbObs ?? "?"} · erreur : {d?.erreur ?? "aucune"} · comptée comme travaillée :{" "}
                        {d?.ids.has(s.id) ? "oui" : "non"}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="carte min-w-0 p-4 sm:p-6">
          {parcoursSelectionne ? (
            <>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="font-display text-lg italic text-encre sm:text-xl">
                  Le parcours de {parcoursSelectionne.enfant}
                </p>
                <span className="rounded-full bg-lin px-2.5 py-0.5 text-xs text-ardoise">
                  {parcoursSelectionne.cycleLibelle}
                </span>
                {plusieursEnfants && (
                  <SelecteurParcoursTableauDeBord
                    parcoursId={parcoursSelectionne.id}
                    options={enfantsUniques.map((p) => ({
                      id: p.id,
                      libelle:
                        enfantsUniques.filter((q) => q.enfantId === p.enfantId).length > 1
                          ? `${p.enfant} — ${p.cycleLibelle}`
                          : p.enfant,
                    }))}
                  />
                )}
              </div>
              <p className="mb-2 text-sm font-medium text-encre">
                Les apprentissages en mouvement
              </p>
              <p className="mb-3 text-sm text-ardoise sm:mb-4">
                Une vue d&rsquo;ensemble, cumulée sur tout le cycle, des
                domaines explorés à partir des observations validées.
              </p>

              {domainesProgression.length > 0 && (
                <div className="mb-3 sm:mb-4">
                  {domainesProgression.map((d) => {
                    const Icone = iconeDomaine(d.nom);
                    const nomCourt = libelleCourtDomaine(d.nom);
                    return (
                      <div
                        key={d.nom}
                        className="border-b border-trait py-2.5 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lin sm:h-9 sm:w-9">
                            <Icone className="h-4 w-4 text-mousse-fonce" strokeWidth={1.75} />
                          </span>
                          <p className="min-w-0 flex-1 truncate text-sm text-encre">
                            {nomCourt}
                          </p>
                          <span className="shrink-0 text-sm tabular-nums text-ardoise">
                            {d.pourcentage}%
                          </span>
                        </div>
                        <div className="ml-11 mt-1.5 h-1.5 rounded-full bg-lin sm:ml-12">
                          <div
                            className="h-1.5 rounded-full bg-mousse"
                            style={{ width: `${d.pourcentage}%` }}
                          />
                        </div>
                        {nomCourt !== d.nom && (
                          <details className="ml-11 mt-1 sm:ml-12">
                            <summary className="cursor-pointer text-xs text-mousse-fonce">
                              Voir l&rsquo;intitulé officiel complet
                            </summary>
                            <p className="mt-1 text-xs text-ardoise">{d.nom}</p>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Link
                href={`/progression?parcours=${parcoursSelectionne.id}`}
                className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-mousse-fonce underline underline-offset-2"
              >
                Voir le détail des compétences →
              </Link>
            </>
          ) : (
            <p className="text-sm text-ardoise">
              Créez un parcours scolaire pour voir apparaître le chemin
              parcouru ici.
            </p>
          )}
        </div>

        </div>

        <div className="min-w-0 space-y-4 sm:space-y-6">
          <div className="carte p-4 sm:p-5">
            <p className="mb-3 font-display text-base italic text-encre sm:text-lg">
              Dernières traces
            </p>
            {traces.length === 0 ? (
              <p className="text-sm text-ardoise">Aucune trace pour l&rsquo;instant.</p>
            ) : (
              <ul className="mb-3 space-y-1">
                {traces.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={t.activiteId ? `/journal/${t.activiteId}` : "/journal"}
                      className="flex min-h-[48px] items-center gap-3 rounded-doux p-1.5 hover:bg-lin active:bg-lin"
                    >
                      {t.urlMiniature ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.urlMiniature}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-argile/20">
                          <Camera className="h-4 w-4 text-argile" strokeWidth={1.75} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-encre">
                        {t.legende}
                        {plusieursEnfants && t.enfantPrenom && (
                          <span className="text-ardoise"> · {t.enfantPrenom}</span>
                        )}
                      </span>
                      <span className="shrink-0 rounded-full bg-ocre/20 px-2 py-0.5 text-xs text-encre">
                        {libelleDate(t.date)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/journal?vue=galerie"
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-mousse-fonce underline underline-offset-2"
            >
              Voir toutes les traces →
            </Link>
          </div>

          <div className="carte p-4 sm:p-5">
            <p className="mb-3 font-display text-base italic text-encre sm:text-lg">
              En quelques chiffres
            </p>
            <div className="grid grid-cols-2 gap-3">
              {cartes.map((c) => (
                <div key={c.libelle} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lin">
                    <c.Icone className="h-4 w-4 text-mousse-fonce" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-display text-xl italic leading-tight text-encre">{c.valeur}</p>
                    <p className="text-xs text-ardoise">{c.valeur > 1 ? c.pluriel : c.libelle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="carte flex items-center gap-4 p-4 sm:p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/pot-plante.png"
              alt=""
              aria-hidden="true"
              className="h-20 w-auto shrink-0 sm:h-24"
            />
            <div>
              <p className="mb-1 font-display text-base italic text-encre">
                Une observation à noter ?
              </p>
              <p className="mb-3 text-xs text-ardoise">
                Chaque trace compte pour comprendre le chemin
                {plusieursEnfants
                  ? " de vos enfants"
                  : parcoursSelectionne
                  ? ` de ${parcoursSelectionne.enfant}`
                  : ""}
                .
              </p>
              <Link
                href="/journal/nouvelle"
                className="bouton-primaire bouton-petit inline-flex min-h-[40px] items-center gap-1.5 active:bg-mousse"
              >
                + Ajouter une observation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
