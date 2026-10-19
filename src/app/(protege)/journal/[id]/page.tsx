import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireTrace } from "./FormulaireTrace";
import { ListeTraces } from "./ListeTraces";
import { basculerStatutActivite } from "../actions";
import { supprimerObservation } from "./competences/actions";
import { BoutonDupliquerActivite } from "./BoutonDupliquerActivite";
import { chargerAuteurs } from "@/lib/auteurs";

const DUREE_SIGNATURE_SECONDES = 60 * 60; // 1 heure, cf. Corrections-Schema-et-Lot1.md, section 11

export default async function PageActivite({ params }: { params: { id: string } }) {
  const supabase = creerClientServeur();

  const { data: activite } = await supabase
    .from("activites")
    .select(
      `id, titre, description, date_activite, lieu, observations, paroles_enfant, parcours_id, auteur_id, auteur_nom_affiche,
       contextes_activite(libelle), statuts_activite(code, libelle),
       parcours_scolaires(enfant_id, enfants(prenom, famille_id), annees_scolaires(libelle))`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!activite) notFound();

  const auteurs = await chargerAuteurs(supabase);

  const parcoursBrut = Array.isArray(activite.parcours_scolaires)
    ? activite.parcours_scolaires[0]
    : activite.parcours_scolaires;
  const enfant = parcoursBrut
    ? Array.isArray(parcoursBrut.enfants)
      ? parcoursBrut.enfants[0]
      : parcoursBrut.enfants
    : null;
  const annee = parcoursBrut
    ? Array.isArray(parcoursBrut.annees_scolaires)
      ? parcoursBrut.annees_scolaires[0]
      : parcoursBrut.annees_scolaires
    : null;
  const contexte = Array.isArray(activite.contextes_activite)
    ? activite.contextes_activite[0]
    : activite.contextes_activite;
  const statut = Array.isArray(activite.statuts_activite)
    ? activite.statuts_activite[0]
    : activite.statuts_activite;

  const familleId = enfant?.famille_id as string | undefined;
  const enfantIdActuel = parcoursBrut?.enfant_id as string | undefined;

  const { data: autresParcoursBruts } = familleId
    ? await supabase
        .from("parcours_scolaires")
        .select("enfant_id, enfants!inner(prenom, famille_id)")
        .eq("enfants.famille_id", familleId)
    : { data: null };

  // Un seul enfant par ligne, jamais deux fois le meme (peu importe son
  // nombre d'annees) : dupliquer "pour un autre enfant" ne concerne que
  // des enfants differents, la bonne annee est resolue automatiquement
  // d'apres la date de l'activite au moment de la duplication.
  const autresEnfants = Array.from(
    new Map(
      (autresParcoursBruts ?? [])
        .filter((p) => (p.enfant_id as string) !== enfantIdActuel)
        .map((p) => {
          const e = Array.isArray(p.enfants) ? p.enfants[0] : p.enfants;
          return [p.enfant_id as string, { id: p.enfant_id as string, prenom: e?.prenom ?? "?" }] as const;
        })
    ).values()
  );

  const [{ data: tracesBrutes }, { data: typesBruts }, { data: observationsBrutes }] =
    await Promise.all([
      supabase
        .from("traces")
        .select(
          "id, legende, date_trace, contenu_texte, chemin_stockage, miniature_chemin_stockage, auteur_id, auteur_nom_affiche, types_trace(libelle)"
        )
        .eq("activite_id", params.id)
        .order("ordre_affichage", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("types_trace")
        .select("code, libelle")
        .eq("actif", true)
        .neq("code", "audio") // pas encore implémenté côté interface (V1)
        .order("ordre"),
      supabase
        .from("observations_elements_programme")
        .select(
          "id, justification, elements_programme(libelle), niveaux_autonomie(libelle)"
        )
        .eq("activite_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

  const observations = (observationsBrutes ?? []).map((o) => {
    const element = Array.isArray(o.elements_programme)
      ? o.elements_programme[0]
      : o.elements_programme;
    const niveau = Array.isArray(o.niveaux_autonomie)
      ? o.niveaux_autonomie[0]
      : o.niveaux_autonomie;
    return {
      id: o.id as string,
      elementLibelle: element?.libelle as string | undefined,
      niveauLibelle: niveau?.libelle as string | undefined,
      justification: o.justification as string | null,
    };
  });

  const traces = await Promise.all(
    (tracesBrutes ?? []).map(async (t) => {
      const type = Array.isArray(t.types_trace) ? t.types_trace[0] : t.types_trace;
      let urlMiniature: string | null = null;
      let urlFichier: string | null = null;

      if (t.miniature_chemin_stockage) {
        const { data } = await supabase.storage
          .from("traces-pedagogiques")
          .createSignedUrl(t.miniature_chemin_stockage, DUREE_SIGNATURE_SECONDES);
        urlMiniature = data?.signedUrl ?? null;
      }

      if (t.chemin_stockage) {
        const { data } = await supabase.storage
          .from("traces-pedagogiques")
          .createSignedUrl(t.chemin_stockage, DUREE_SIGNATURE_SECONDES);
        urlFichier = data?.signedUrl ?? null;
      }

      return {
        id: t.id as string,
        legende: t.legende as string | null,
        date: t.date_trace as string,
        contenuTexte: t.contenu_texte as string | null,
        typeLibelle: type?.libelle as string | undefined,
        urlMiniature,
        urlFichier,
        auteurId: t.auteur_id as string | null,
        auteurInstantane: t.auteur_nom_affiche as string | null,
      };
    })
  );

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_360px]">
      <div>
        <Link href="/journal" className="mb-6 inline-block text-sm text-ardoise hover:text-encre">
          ← Retour au journal
        </Link>

        <div className="mb-2">
          <h1 className="font-display text-2xl italic text-encre">{activite.titre}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
            {autresEnfants.length > 0 && (
              <BoutonDupliquerActivite
                activiteId={params.id}
                autresEnfants={autresEnfants}
              />
            )}
            <Link
              href={`/journal/nouvelle?refaire=${params.id}`}
              className="text-sm font-medium text-mousse-fonce underline underline-offset-2 hover:text-mousse"
            >
              Refaire cette activité
            </Link>
            <Link
              href={`/journal/${params.id}/modifier`}
              className="text-sm font-medium text-mousse-fonce underline underline-offset-2 hover:text-mousse"
            >
              Modifier
            </Link>
          </div>
        </div>
        <p className="mb-4 text-sm text-ardoise">
          {enfant?.prenom} · {annee?.libelle} ·{" "}
          {new Date(activite.date_activite as string).toLocaleDateString("fr-FR")}
          {contexte ? ` · ${contexte.libelle}` : ""}
          {auteurs.afficher && auteurs.nom(activite.auteur_id as string | null, activite.auteur_nom_affiche as string | null)
            ? ` · ajoutée par ${auteurs.nom(activite.auteur_id as string | null, activite.auteur_nom_affiche as string | null)}`
            : ""}
        </p>

        <form
          action={basculerStatutActivite.bind(null, params.id, statut?.code ?? "brouillon")}
          className="mb-6"
        >
          <button
            type="submit"
            title={statut?.code === "valide" ? "Remettre en brouillon" : "Valider cette activité"}
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              statut?.code === "valide"
                ? "bg-mousse/10 text-mousse-fonce hover:bg-mousse/20"
                : "bg-trait text-ardoise hover:bg-argile/20"
            }`}
          >
            {statut?.libelle}
            {statut?.code !== "valide" && " · cliquer pour valider"}
          </button>
        </form>

        {activite.description && (
          <p className="mb-4 text-sm text-encre">{activite.description}</p>
        )}
        {activite.observations && (
          <p className="mb-4 text-sm text-ardoise">
            <span className="font-medium text-encre">Observations : </span>
            {activite.observations}
          </p>
        )}
        {activite.paroles_enfant && (
          <p className="mb-6 text-sm italic text-ardoise">
            « {activite.paroles_enfant} »
          </p>
        )}

        <Link
          href={`/journal/${params.id}/competences`}
          className="bouton-primaire bouton-petit mb-4 inline-block"
        >
          Relier à des compétences
        </Link>

        {observations.length > 0 && (
          <ul className="mb-6 space-y-2">
            {observations.map((o) => (
              <li
                key={o.id}
                className="carte flex items-start justify-between gap-3 p-3 text-sm"
              >
                <div>
                  <p className="text-encre">{o.elementLibelle}</p>
                  <p className="text-xs text-ardoise">{o.niveauLibelle}</p>
                  {o.justification && (
                    <p className="mt-1 text-xs text-ardoise">{o.justification}</p>
                  )}
                </div>
                <form action={supprimerObservation.bind(null, o.id, params.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-xs text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mb-4 font-display text-xl italic text-encre">Traces</h2>

        {traces.length === 0 ? (
          <p className="rounded-doux border border-dashed border-trait bg-white/50 p-6 text-center text-sm text-ardoise">
            Aucune trace ajoutée pour l&rsquo;instant.
          </p>
        ) : (
          <ListeTraces
            activiteId={params.id}
            traces={traces.map((t) => ({
              id: t.id,
              legende: t.legende,
              typeLibelle: t.typeLibelle,
              contenuTexte: t.contenuTexte,
              urlMiniature: t.urlMiniature,
              urlFichier: t.urlFichier,
              auteurAffiche: auteurs.afficher ? auteurs.nom(t.auteurId, t.auteurInstantane) : null,
            }))}
          />
        )}
      </div>

      {familleId && (
        <FormulaireTrace
          activiteId={params.id}
          familleId={familleId}
          types={typesBruts ?? []}
        />
      )}
    </div>
  );
}
