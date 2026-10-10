import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireActivite } from "./FormulaireActivite";
import { AideContextuelle } from "@/components/AideContextuelle";

// Les redactions automatiques lancees depuis cette page (description, observation)
// peuvent depasser la duree par defaut d'une fonction serveur.
export const maxDuration = 60;

export default async function PageNouvelleActivite({
  searchParams,
}: {
  searchParams: {
    titre?: string;
    description?: string;
    parcours?: string;
    objectifId?: string;
    objectifLibelle?: string;
    refaire?: string;
  };
}) {
  const supabase = creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: parcoursBruts }, { data: contextes }, { data: autonomies }, { data: appartenance }] =
    await Promise.all([
      supabase
        .from("parcours_scolaires")
        .select(
          "id, cycle_id, enfant_id, enfants(prenom), annees_scolaires(libelle, date_debut, date_fin)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("contextes_activite")
        .select("id, libelle")
        .eq("actif", true)
        .order("ordre"),
      supabase
        .from("niveaux_autonomie")
        .select("id, libelle")
        .eq("actif", true)
        .order("ordre"),
      supabase
        .from("utilisateurs_familles")
        .select("famille_id")
        .eq("user_id", user?.id ?? "")
        .limit(1)
        .maybeSingle(),
    ]);

  const parcours = (parcoursBruts ?? []).map((p) => {
    const enfant = Array.isArray(p.enfants) ? p.enfants[0] : p.enfants;
    const annee = Array.isArray(p.annees_scolaires)
      ? p.annees_scolaires[0]
      : p.annees_scolaires;
    return {
      id: p.id as string,
      cycleId: p.cycle_id as string,
      enfantId: p.enfant_id as string,
      libelle: `${enfant?.prenom ?? "?"} — ${annee?.libelle ?? "?"}`,
      prenomEnfant: (enfant?.prenom as string | undefined) ?? "",
      dateDebutAnnee: (annee?.date_debut as string | undefined) ?? "",
      dateFinAnnee: (annee?.date_fin as string | undefined) ?? "",
    };
  });

  // "Refaire cette activite" : on repart d'une activite existante (titre,
  // description, contexte, lieu, competences et niveaux d'autonomie), avec
  // la date du jour. Photos, observations du jour et paroles de l'enfant
  // ne sont pas reprises : elles sont propres a chaque fois.
  let refaire: {
    titre: string;
    description: string;
    contexteId: string;
    lieu: string;
    parcoursId: string;
    competences: { id: string; libelle: string; niveauId: string }[];
  } | null = null;
  if (searchParams.refaire) {
    const [{ data: source }, { data: obs }] = await Promise.all([
      supabase
        .from("activites")
        .select("titre, description, contexte_id, lieu, parcours_id, parcours_scolaires(enfant_id)")
        .eq("id", searchParams.refaire)
        .maybeSingle(),
      supabase
        .from("observations_elements_programme")
        .select("element_programme_id, niveau_autonomie_id, elements_programme(libelle)")
        .eq("activite_id", searchParams.refaire),
    ]);
    if (source) {
      const ps = Array.isArray(source.parcours_scolaires)
        ? source.parcours_scolaires[0]
        : source.parcours_scolaires;
      const aujourdhui = new Date().toISOString().slice(0, 10);
      const parcoursDuJour = parcours.find(
        (p) =>
          p.enfantId === ps?.enfant_id &&
          p.dateDebutAnnee &&
          p.dateFinAnnee &&
          aujourdhui >= p.dateDebutAnnee &&
          aujourdhui <= p.dateFinAnnee
      );
      refaire = {
        titre: (source.titre as string) ?? "",
        description: (source.description as string | null) ?? "",
        contexteId: (source.contexte_id as string | null) ?? "",
        lieu: (source.lieu as string | null) ?? "",
        parcoursId: parcoursDuJour?.id ?? (source.parcours_id as string),
        competences: (obs ?? []).map((o) => {
          const el = Array.isArray(o.elements_programme)
            ? o.elements_programme[0]
            : o.elements_programme;
          return {
            id: o.element_programme_id as string,
            libelle: (el?.libelle as string) ?? "",
            niveauId: (o.niveau_autonomie_id as string | null) ?? "",
          };
        }),
      };
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/journal"
        className="mb-6 inline-block text-sm text-ardoise hover:text-encre"
      >
        ← Retour
      </Link>
      <h1 className="mb-6 font-display text-2xl italic text-encre">
        Ajouter une activité
      </h1>
      <AideContextuelle titre="Ajouter une activité" variante="page">
        Décrivez ce que votre enfant a fait, avec une ou plusieurs
        photos si vous le souhaitez. Des compétences du programme
        officiel peuvent être suggérées automatiquement (par
        mots-clés ou par le bouton ✨) — ce ne sont que des
        propositions : cochez, décochez ou modifiez-les librement.
        L&rsquo;application propose, mais le suivi pédagogique de
        votre enfant reste entièrement de votre responsabilité.
      </AideContextuelle>

      {parcours.length === 0 || !appartenance ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          Il faut d&rsquo;abord créer un parcours scolaire (enfant + année)
          avant de pouvoir ajouter une activité.
        </p>
      ) : (
        <FormulaireActivite
          parcours={parcours}
          contextes={contextes ?? []}
          autonomies={autonomies ?? []}
          familleId={appartenance.famille_id}
          refaire={refaire}
          prerempli={{
            titre: searchParams.titre ?? "",
            description: searchParams.description ?? "",
            parcoursId: searchParams.parcours ?? "",
            objectifId: searchParams.objectifId ?? "",
            objectifLibelle: searchParams.objectifLibelle ?? "",
          }}
        />
      )}
    </div>
  );
}
