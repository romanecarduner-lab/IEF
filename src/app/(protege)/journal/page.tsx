import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { supprimerActivite, basculerFavori, basculerStatutActivite } from "./actions";
import { VueGalerie } from "./VueGalerie";

export default async function PageJournal({
  searchParams,
}: {
  searchParams: {
    q?: string;
    enfant?: string;
    du?: string;
    au?: string;
    vue?: string;
    annee?: string;
    type?: string;
    domaine?: string;
  };
}) {
  const supabase = creerClientServeur();
  const vue = searchParams.vue === "galerie" ? "galerie" : "liste";

  const { data: enfantsOptions } = await supabase
    .from("enfants")
    .select("id, prenom")
    .order("prenom");

  const texte = searchParams.q?.trim() ?? "";
  const enfantId = searchParams.enfant ?? "";
  const du = searchParams.du ?? "";
  const au = searchParams.au ?? "";
  const filtresActifs = Boolean(texte || enfantId || du || au);

  let requete = supabase
    .from("activites")
    .select(
      `id, date_activite, titre, description, favori,
       contextes_activite(libelle), statuts_activite(code, libelle),
       parcours_scolaires!inner(enfant_id, enfants(prenom), annees_scolaires(libelle))`
    )
    .order("date_activite", { ascending: false });

  if (texte) {
    requete = requete.or(
      `titre.ilike.%${texte}%,description.ilike.%${texte}%,observations.ilike.%${texte}%,paroles_enfant.ilike.%${texte}%`
    );
  }
  if (enfantId) requete = requete.eq("parcours_scolaires.enfant_id", enfantId);
  if (du) requete = requete.gte("date_activite", du);
  if (au) requete = requete.lte("date_activite", au);

  const { data: activitesBrutes } = vue === "liste" ? await requete : { data: [] };

  const activites = (activitesBrutes ?? []).map((a) => {
    const contexte = Array.isArray(a.contextes_activite)
      ? a.contextes_activite[0]
      : a.contextes_activite;
    const statut = Array.isArray(a.statuts_activite)
      ? a.statuts_activite[0]
      : a.statuts_activite;
    const parcoursBrut = Array.isArray(a.parcours_scolaires)
      ? a.parcours_scolaires[0]
      : a.parcours_scolaires;
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

    return {
      id: a.id as string,
      date: a.date_activite as string,
      titre: a.titre as string,
      description: a.description as string | null,
      favori: a.favori as boolean,
      contexte: contexte?.libelle as string | undefined,
      statutCode: statut?.code as string | undefined,
      statutLibelle: statut?.libelle as string | undefined,
      enfant: enfant?.prenom as string | undefined,
      annee: annee?.libelle as string | undefined,
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl italic text-encre">
          Journal pédagogique
        </h1>
        <Link
          href="/journal/nouvelle"
          className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse"
        >
          Ajouter une activité
        </Link>
      </div>

      <div className="mb-6 flex gap-1 border-b border-trait">
        <Link
          href="/journal"
          className={`px-3 py-2 text-sm font-medium ${
            vue === "liste"
              ? "border-b-2 border-mousse-fonce text-mousse-fonce"
              : "text-ardoise hover:text-encre"
          }`}
        >
          Liste
        </Link>
        <Link
          href="/journal?vue=galerie"
          className={`px-3 py-2 text-sm font-medium ${
            vue === "galerie"
              ? "border-b-2 border-mousse-fonce text-mousse-fonce"
              : "text-ardoise hover:text-encre"
          }`}
        >
          Galerie
        </Link>
      </div>

      {vue === "galerie" ? (
        <VueGalerie searchParams={searchParams} />
      ) : (
        <>
      <form
        method="get"
        className="mb-6 grid gap-3 rounded-doux border border-trait bg-white/80 p-4 shadow-doux sm:grid-cols-2 md:grid-cols-4"
      >
        <div className="sm:col-span-2 md:col-span-1">
          <label htmlFor="q" className="mb-1.5 block text-sm font-medium text-encre">
            Mot-clé
          </label>
          <input
            type="search"
            id="q"
            name="q"
            defaultValue={texte}
            placeholder="cabane, comptine…"
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="enfant" className="mb-1.5 block text-sm font-medium text-encre">
            Enfant
          </label>
          <select
            id="enfant"
            name="enfant"
            defaultValue={enfantId}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            <option value="">Tous</option>
            {(enfantsOptions ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.prenom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="du" className="mb-1.5 block text-sm font-medium text-encre">
            Du
          </label>
          <input
            type="date"
            id="du"
            name="du"
            defaultValue={du}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="au" className="mb-1.5 block text-sm font-medium text-encre">
            Au
          </label>
          <input
            type="date"
            id="au"
            name="au"
            defaultValue={au}
            className="w-full rounded-doux border border-trait bg-white px-3 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2 md:col-span-4 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-doux bg-mousse-fonce px-4 py-2 text-sm font-medium text-white hover:bg-mousse"
          >
            Filtrer
          </button>
          {filtresActifs && (
            <Link href="/journal" className="text-sm text-ardoise underline underline-offset-2">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {activites.length === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          {filtresActifs
            ? "Aucune activité ne correspond à ces critères."
            : "Aucune activité enregistrée pour l\u2019instant."}
        </p>
      ) : (
        <ul className="space-y-3">
          {activites.map((a) => (
            <li
              key={a.id}
              className="rounded-doux border border-trait bg-white/80 p-5 shadow-doux"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/journal/${a.id}`}
                    className="font-display text-lg italic text-encre hover:text-mousse-fonce"
                  >
                    {a.titre}
                  </Link>
                  <p className="text-sm text-ardoise">
                    {a.enfant} · {a.annee} ·{" "}
                    {new Date(a.date).toLocaleDateString("fr-FR")}
                    {a.contexte ? ` · ${a.contexte}` : ""}
                  </p>
                  {a.description && (
                    <p className="mt-2 text-sm text-encre">{a.description}</p>
                  )}
                  <form action={basculerStatutActivite.bind(null, a.id, a.statutCode ?? "brouillon")}>
                    <button
                      type="submit"
                      title={
                        a.statutCode === "valide"
                          ? "Remettre en brouillon"
                          : "Valider cette activité"
                      }
                      className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                        a.statutCode === "valide"
                          ? "bg-mousse/10 text-mousse-fonce hover:bg-mousse/20"
                          : "bg-trait text-ardoise hover:bg-argile/20"
                      }`}
                    >
                      {a.statutLibelle}
                      {a.statutCode !== "valide" && " · cliquer pour valider"}
                    </button>
                  </form>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <form action={basculerFavori.bind(null, a.id, a.favori)}>
                    <button
                      type="submit"
                      title={
                        a.favori
                          ? "Retirer des favoris"
                          : "Marquer comme favori"
                      }
                      className={`text-lg ${
                        a.favori ? "text-argile" : "text-trait hover:text-argile"
                      }`}
                    >
                      ★
                    </button>
                  </form>
                  <form action={supprimerActivite.bind(null, a.id)}>
                    <button
                      type="submit"
                      className="text-sm text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
        </>
      )}
    </div>
  );
}
