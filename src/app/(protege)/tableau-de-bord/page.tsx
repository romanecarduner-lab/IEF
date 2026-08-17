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
  const meme = (a: Date, b: Date) =>
    a.toDateString() === b.toDateString();
  if (meme(d, aujourdhui)) return "Aujourd'hui";
  if (meme(d, hier)) return "Hier";
  return d.toLocaleDateString("fr-FR");
}

export default async function PageTableauDeBord() {
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
      .select("id, enfants(prenom), annees_scolaires(libelle)")
      .order("created_at", { ascending: false }),
    supabase
      .from("traces")
      .select(
        "id, legende, date_trace, miniature_chemin_stockage, types_trace(libelle), activites(id, titre)"
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
      enfant: enfant?.prenom as string | undefined,
      annee: annee?.libelle as string | undefined,
    };
  });

  const parcoursPrincipal = parcours[0];

  let domainesProgression: { nom: string; pourcentage: number }[] = [];
  if (parcoursPrincipal) {
    const [{ data: totauxDomaine }, { data: repartitionDomaine }] = await Promise.all([
      supabase.from("v_total_objectifs_par_domaine").select("domaine, total_objectifs"),
      supabase
        .from("v_progression_par_domaine")
        .select("domaine, statut_code, nb")
        .eq("parcours_id", parcoursPrincipal.id),
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

  const traces = await Promise.all(
    (tracesBrutes ?? []).map(async (t) => {
      const type = Array.isArray(t.types_trace) ? t.types_trace[0] : t.types_trace;
      const activite = Array.isArray(t.activites) ? t.activites[0] : t.activites;
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
      <div className="relative mb-8 overflow-hidden">
        <div className="relative z-10 max-w-md">
          <h1 className="mb-1 font-display text-3xl italic text-encre">
            Bonjour{prenom ? ` ${prenom}` : ""},
          </h1>
          <p className="mb-6 text-ardoise">
            {parcoursPrincipal
              ? `Un regard sur le chemin parcouru par ${parcoursPrincipal.enfant}.`
              : "Un regard sur le chemin parcouru par votre enfant."}
          </p>
          <Link
            href="/journal/nouvelle"
            className="inline-flex items-center gap-2 rounded-doux bg-mousse-fonce px-6 py-3.5 text-base font-medium text-white shadow-doux transition-colors hover:bg-mousse"
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

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cartes.map((c) => (
          <div
            key={c.libelle}
            className="rounded-doux border border-trait bg-white/80 p-4 text-center shadow-doux"
          >
            <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-lin">
              <c.Icone className="h-5 w-5 text-mousse-fonce" strokeWidth={1.75} />
            </span>
            <p className="font-display text-2xl italic text-encre">{c.valeur}</p>
            <p className="text-xs text-ardoise">{c.valeur > 1 ? c.pluriel : c.libelle}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux">
          {parcoursPrincipal ? (
            <>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="font-display text-xl italic text-encre">
                  Le parcours de {parcoursPrincipal.enfant}
                </p>
                <span className="rounded-full bg-lin px-2.5 py-0.5 text-xs text-ardoise">
                  Année {parcoursPrincipal.annee}
                </span>
              </div>
              <p className="mb-2 text-sm font-medium text-encre">
                Les apprentissages en mouvement
              </p>
              <p className="mb-4 text-sm text-ardoise">
                Une vue d&rsquo;ensemble des domaines explorés, à partir des
                observations validées.
              </p>

              {domainesProgression.length > 0 && (
                <div className="mb-4 space-y-1">
                  {domainesProgression.map((d) => {
                    const Icone = iconeDomaine(d.nom);
                    return (
                      <div key={d.nom} className="flex items-center gap-3 py-1.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lin">
                          <Icone className="h-4 w-4 text-mousse-fonce" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-sm text-encre">{d.nom}</p>
                          <div className="h-2 w-full rounded-full bg-lin">
                            <div
                              className="h-2 rounded-full bg-mousse"
                              style={{ width: `${d.pourcentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-10 shrink-0 text-right text-xs text-ardoise">
                          {d.pourcentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <Link
                href={`/progression?parcours=${parcoursPrincipal.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-mousse-fonce underline underline-offset-2"
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

        <div className="space-y-6">
          <div className="rounded-doux border border-trait bg-white/80 p-5 shadow-doux">
            <p className="mb-3 font-display text-lg italic text-encre">
              Dernières traces
            </p>
            {traces.length === 0 ? (
              <p className="text-sm text-ardoise">Aucune trace pour l&rsquo;instant.</p>
            ) : (
              <ul className="mb-3 space-y-2">
                {traces.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={t.activiteId ? `/journal/${t.activiteId}` : "/journal"}
                      className="flex items-center gap-3 rounded-doux p-1.5 hover:bg-lin"
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
              className="text-sm font-medium text-mousse-fonce underline underline-offset-2"
            >
              Voir toutes les traces →
            </Link>
          </div>

          <div className="flex items-center gap-4 rounded-doux border border-trait bg-white/80 p-5 shadow-doux">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/pot-plante.png"
              alt=""
              aria-hidden="true"
              className="h-24 w-auto shrink-0"
            />
            <div>
              <p className="mb-1 font-display text-base italic text-encre">
                Une observation à noter ?
              </p>
              <p className="mb-3 text-xs text-ardoise">
                Chaque trace compte pour comprendre le chemin
                {parcoursPrincipal ? ` de ${parcoursPrincipal.enfant}` : ""}.
              </p>
              <Link
                href="/journal/nouvelle"
                className="inline-flex items-center gap-1.5 rounded-doux bg-mousse-fonce px-3.5 py-2 text-xs font-medium text-white hover:bg-mousse"
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
