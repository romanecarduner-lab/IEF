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

function melanger<T>(tableau: T[]): T[] {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copie[i];
    copie[i] = copie[j]!;
    copie[j] = temp!;
  }
  return copie;
}

export default async function PageTableauDeBord({
  searchParams,
}: {
  searchParams: { parcours?: string };
}) {
  const supabase = creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const prenom = (user?.user_metadata?.prenom as string | undefined) ?? "";

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
      .select("id, cycle_id, enfants(prenom), annees_scolaires(libelle)")
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
    const annee = Array.isArray(p.annees_scolaires)
      ? p.annees_scolaires[0]
      : p.annees_scolaires;
    return {
      id: p.id as string,
      cycleId: p.cycle_id as string,
      enfant: (enfant?.prenom as string | undefined) ?? "?",
      annee: annee?.libelle as string | undefined,
    };
  });

  const plusieursEnfants = parcours.length > 1;
  const parcoursSelectionne =
    parcours.find((p) => p.id === searchParams.parcours) ?? parcours[0];

  let domainesProgression: { nom: string; pourcentage: number }[] = [];
  if (parcoursSelectionne) {
    const [{ data: totauxDomaine }, { data: repartitionDomaine }] = await Promise.all([
      supabase
        .from("v_total_objectifs_par_domaine")
        .select("domaine, total_objectifs")
        .eq("cycle_id", parcoursSelectionne.cycleId),
      supabase
        .from("v_progression_par_domaine")
        .select("domaine, statut_code, nb")
        .eq("parcours_id", parcoursSelectionne.id),
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
  type Candidat = { id: string; libelle: string; domaine: string; enfantPrenom: string; parcoursId: string };
  const candidatsParEnfant = await Promise.all(
    parcours.map(async (p) => {
      const [{ data: tousLesObjectifs }, { data: observations }] = await Promise.all([
        supabase
          .from("v_objectif_domaine")
          .select("objectif_id, libelle, domaine")
          .eq("cycle_id", p.cycleId),
        supabase
          .from("observations_elements_programme")
          .select("element_programme_id, activites!inner(parcours_id)")
          .eq("activites.parcours_id", p.id),
      ]);

      const idsAbordes = new Set(
        (observations ?? []).map((o) => o.element_programme_id as string)
      );

      const nonAbordesParDomaine = new Map<string, { id: string; libelle: string }[]>();
      for (const o of tousLesObjectifs ?? []) {
        const id = o.objectif_id as string;
        if (idsAbordes.has(id)) continue;
        const domaine = o.domaine as string;
        const liste = nonAbordesParDomaine.get(domaine) ?? [];
        liste.push({ id, libelle: o.libelle as string });
        nonAbordesParDomaine.set(domaine, liste);
      }

      const candidats: Candidat[] = [];
      for (const [domaine, objectifs] of nonAbordesParDomaine) {
        const choisi = objectifs[Math.floor(Math.random() * objectifs.length)];
        if (!choisi) continue;
        candidats.push({
          id: choisi.id,
          libelle: choisi.libelle,
          domaine,
          enfantPrenom: p.enfant,
          parcoursId: p.id,
        });
      }
      return candidats;
    })
  );

  const suggestionsCompetences = melanger(candidatsParEnfant.flat()).slice(0, 3);

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
            <AideContextuelle titre="Le tableau de bord">
              C&rsquo;est votre page d&rsquo;accueil : un résumé de ce qui a
              déjà été fait (activités, traces) et, à droite, des idées
              pour continuer. Rien n&rsquo;est automatique ni obligatoire
              : vous restez seule ou seul maître de ce que vous décidez
              de faire.
            </AideContextuelle>
          </h1>
          <p className="mb-4 text-sm text-ardoise sm:mb-6 sm:text-base">
            {plusieursEnfants
              ? "Un regard sur le chemin parcouru par vos enfants."
              : parcoursSelectionne
              ? `Un regard sur le chemin parcouru par ${parcoursSelectionne.enfant}.`
              : "Un regard sur le chemin parcouru par votre enfant."}
          </p>
          <Link
            href="/journal/nouvelle"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-doux bg-mousse-fonce px-6 py-3 text-base font-medium text-white shadow-doux transition-colors hover:bg-mousse active:bg-mousse"
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

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:mb-8 sm:gap-3">
        {cartes.map((c) => (
          <div
            key={c.libelle}
            className="rounded-doux border border-trait bg-white/80 p-3 text-center shadow-doux sm:p-4"
          >
            <span className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-lin sm:mb-2 sm:h-11 sm:w-11">
              <c.Icone className="h-4 w-4 text-mousse-fonce sm:h-5 sm:w-5" strokeWidth={1.75} />
            </span>
            <p className="font-display text-xl italic text-encre sm:text-2xl">{c.valeur}</p>
            <p className="text-xs text-ardoise">{c.valeur > 1 ? c.pluriel : c.libelle}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-doux border border-trait bg-white/80 p-4 shadow-doux sm:p-6">
          {parcoursSelectionne ? (
            <>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="font-display text-lg italic text-encre sm:text-xl">
                  Le parcours de {parcoursSelectionne.enfant}
                </p>
                <span className="rounded-full bg-lin px-2.5 py-0.5 text-xs text-ardoise">
                  Année {parcoursSelectionne.annee}
                </span>
                {plusieursEnfants && (
                  <SelecteurParcoursTableauDeBord
                    parcoursId={parcoursSelectionne.id}
                    options={parcours.map((p) => ({
                      id: p.id,
                      libelle: `${p.enfant} — ${p.annee}`,
                    }))}
                  />
                )}
              </div>
              <p className="mb-2 text-sm font-medium text-encre">
                Les apprentissages en mouvement
              </p>
              <p className="mb-3 text-sm text-ardoise sm:mb-4">
                Une vue d&rsquo;ensemble des domaines explorés, à partir des
                observations validées.
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

        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-doux border border-trait bg-white/80 p-4 shadow-doux sm:p-5">
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

          {suggestionsCompetences.length > 0 && (
            <div className="rounded-doux border border-trait bg-white/80 p-4 shadow-doux sm:p-5">
              <p className="mb-1 font-display text-base italic text-encre sm:text-lg">
                Idées pour continuer
              </p>
              <p className="mb-3 text-xs text-ardoise">
                Quelques compétences pas encore abordées — juste des pistes,
                rien d&rsquo;obligatoire.
              </p>
              <ul className="space-y-3">
                {suggestionsCompetences.map((s) => (
                  <li key={s.id} className="border-b border-trait pb-3 last:border-b-0 last:pb-0">
                    <p className="text-xs font-medium text-argile">
                      {libelleCourtDomaine(s.domaine)}
                      {plusieursEnfants && ` · ${s.enfantPrenom}`}
                    </p>
                    <p className="mb-1 text-sm text-encre">{s.libelle}</p>
                    <BoutonIdeesActivites
                      objectifId={s.id}
                      objectifLibelle={s.libelle}
                      parcoursId={s.parcoursId}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4 rounded-doux border border-trait bg-white/80 p-4 shadow-doux sm:p-5">
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
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-doux bg-mousse-fonce px-3.5 py-2 text-xs font-medium text-white hover:bg-mousse active:bg-mousse"
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
