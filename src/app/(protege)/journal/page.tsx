import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { supprimerActivite, basculerFavori, basculerStatutActivite } from "./actions";
import { VueGalerie } from "./VueGalerie";
import { AideContextuelle } from "@/components/AideContextuelle";
import { BoutonSupprimerActivite } from "./BoutonSupprimerActivite";
import { Camera } from "lucide-react";
import { chargerAuteurs } from "@/lib/auteurs";

const DUREE_SIGNATURE_SECONDES = 60 * 60;
const PAS_AFFICHAGE = 24;

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
    limite?: string;
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
  // Affichage par paquets : la liste peut compter plusieurs centaines
  // d'activites, chacune avec sa photo -- on en montre 24 puis "Voir plus".
  const limite = Math.min(
    Math.max(parseInt(searchParams.limite ?? "", 10) || PAS_AFFICHAGE, PAS_AFFICHAGE),
    2000
  );

  const auteurs = await chargerAuteurs(supabase);

  let requete = supabase
    .from("activites")
    .select(
      `id, date_activite, titre, description, favori, auteur_id, auteur_nom_affiche,
       contextes_activite(libelle), statuts_activite(code, libelle),
       parcours_scolaires!inner(enfant_id, enfants(prenom), annees_scolaires(libelle))`,
      { count: "exact" }
    )
    .order("date_activite", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite);

  if (texte) {
    requete = requete.or(
      `titre.ilike.%${texte}%,description.ilike.%${texte}%,observations.ilike.%${texte}%,paroles_enfant.ilike.%${texte}%`
    );
  }
  if (enfantId) requete = requete.eq("parcours_scolaires.enfant_id", enfantId);
  if (du) requete = requete.gte("date_activite", du);
  if (au) requete = requete.lte("date_activite", au);

  const { data: activitesBrutes, count: nbTotal } =
    vue === "liste" ? await requete : { data: [], count: 0 };

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
      auteurId: a.auteur_id as string | null,
      auteurInstantane: a.auteur_nom_affiche as string | null,
    };
  });

  // Premiere photo (miniature) de chaque activite affichee : une seule
  // requete pour toutes, puis une seule signature groupee.
  const miniatureParActivite = new Map<string, string>();
  if (activites.length > 0) {
    const { data: tracesPhoto } = await supabase
      .from("traces")
      .select("activite_id, miniature_chemin_stockage, ordre_affichage")
      .in(
        "activite_id",
        activites.map((a) => a.id)
      )
      .not("miniature_chemin_stockage", "is", null)
      .order("ordre_affichage", { ascending: true });
    const cheminParActivite = new Map<string, string>();
    for (const t of tracesPhoto ?? []) {
      const id = t.activite_id as string;
      if (!cheminParActivite.has(id)) {
        cheminParActivite.set(id, t.miniature_chemin_stockage as string);
      }
    }
    const chemins = Array.from(new Set(cheminParActivite.values()));
    if (chemins.length > 0) {
      const { data: signees } = await supabase.storage
        .from("traces-pedagogiques")
        .createSignedUrls(chemins, DUREE_SIGNATURE_SECONDES);
      const urlParChemin = new Map(
        (signees ?? []).map((u) => [u.path as string, u.signedUrl as string | undefined])
      );
      for (const [activiteId, chemin] of cheminParActivite) {
        const url = urlParChemin.get(chemin);
        if (url) miniatureParActivite.set(activiteId, url);
      }
    }
  }

  const paramsFiltres = new URLSearchParams();
  if (texte) paramsFiltres.set("q", texte);
  if (enfantId) paramsFiltres.set("enfant", enfantId);
  if (du) paramsFiltres.set("du", du);
  if (au) paramsFiltres.set("au", au);
  paramsFiltres.set("limite", String(limite + PAS_AFFICHAGE));
  const lienVoirPlus = `/journal?${paramsFiltres.toString()}`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl italic text-encre">
          Journal pédagogique
        </h1>
        <AideContextuelle titre="Le journal pédagogique" variante="page">
          C&rsquo;est ici que vous notez chaque activité de votre
          enfant (titre, description, photos) au fil du temps. C&rsquo;est
          la base de tout le reste : la progression et les exports en
          dépendent directement.
        </AideContextuelle>
        <Link
          href="/journal/nouvelle"
          className="bouton-primaire bouton-petit"
        >
          Ajouter une activité
        </Link>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-trait">
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
      <details className="carte mb-6" open={filtresActifs}>
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm font-medium text-encre">
          <span>Rechercher et filtrer</span>
          {filtresActifs && (
            <span className="rounded-full bg-mousse/15 px-2.5 py-0.5 text-xs font-normal text-mousse-fonce">
              filtre actif
            </span>
          )}
        </summary>
      <form
        method="get"
        className="grid gap-3 border-t border-trait p-4 sm:grid-cols-2 md:grid-cols-4"
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
            className="champ-saisie champ-compact w-full"
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
            className="champ-saisie champ-compact w-full"
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
            className="champ-saisie champ-compact w-full"
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
            className="champ-saisie champ-compact w-full"
          />
        </div>
        <div className="sm:col-span-2 md:col-span-4 flex items-center gap-3">
          <button
            type="submit"
            className="bouton-primaire bouton-petit"
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
      </details>

      {activites.length === 0 ? (
        <p className="rounded-doux border border-dashed border-trait bg-white/50 p-8 text-center text-sm text-ardoise">
          {filtresActifs
            ? "Aucune activité ne correspond à ces critères."
            : "Aucune activité enregistrée pour l\u2019instant."}
        </p>
      ) : (
        <>
        <p className="mb-3 text-sm text-ardoise">
          {activites.length < (nbTotal ?? 0)
            ? `${activites.length} activités affichées sur ${nbTotal}`
            : `${activites.length} activité${activites.length > 1 ? "s" : ""}`}
        </p>
        <ul className="space-y-3">
          {activites.map((a) => {
            const miniature = miniatureParActivite.get(a.id);
            return (
              <li key={a.id} className="carte p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <Link
                    href={`/journal/${a.id}`}
                    aria-label={`Ouvrir ${a.titre}`}
                    className="shrink-0"
                  >
                    {miniature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={miniature}
                        alt=""
                        loading="lazy"
                        className="h-20 w-20 rounded-doux object-cover sm:h-24 sm:w-24"
                      />
                    ) : (
                      <span className="flex h-20 w-20 items-center justify-center rounded-doux bg-lin sm:h-24 sm:w-24">
                        <Camera className="h-6 w-6 text-ardoise/60" strokeWidth={1.5} />
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/journal/${a.id}`}
                        className="font-display text-lg italic leading-snug text-encre hover:text-mousse-fonce"
                      >
                        {a.titre}
                      </Link>
                      <form action={basculerFavori.bind(null, a.id, a.favori)} className="shrink-0">
                        <button
                          type="submit"
                          title={a.favori ? "Retirer des favoris" : "Marquer comme favori"}
                          aria-label={a.favori ? "Retirer des favoris" : "Marquer comme favori"}
                          className={`flex h-10 w-10 items-center justify-center text-xl ${
                            a.favori ? "text-argile" : "text-trait hover:text-argile"
                          }`}
                        >
                          ★
                        </button>
                      </form>
                    </div>
                    <p className="text-sm text-ardoise">
                      {a.enfant} · {a.annee} ·{" "}
                      {new Date(a.date).toLocaleDateString("fr-FR")}
                      {a.contexte ? ` · ${a.contexte}` : ""}
                      {auteurs.afficher && auteurs.nom(a.auteurId, a.auteurInstantane)
                        ? ` · ajoutée par ${auteurs.nom(a.auteurId, a.auteurInstantane)}`
                        : ""}
                    </p>
                    {a.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-encre">{a.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-trait pt-2">
                  <form action={basculerStatutActivite.bind(null, a.id, a.statutCode ?? "brouillon")}>
                    <button
                      type="submit"
                      title={
                        a.statutCode === "valide"
                          ? "Remettre en brouillon"
                          : "Valider cette activité"
                      }
                      className={`min-h-[36px] rounded-full px-3 py-1 text-xs transition-colors ${
                        a.statutCode === "valide"
                          ? "bg-mousse/10 text-mousse-fonce hover:bg-mousse/20"
                          : "bg-trait text-ardoise hover:bg-argile/20"
                      }`}
                    >
                      {a.statutLibelle}
                      {a.statutCode !== "valide" && " · cliquer pour valider"}
                    </button>
                  </form>
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/journal/nouvelle?refaire=${a.id}`}
                      className="inline-flex min-h-[40px] items-center text-sm font-medium text-mousse-fonce underline underline-offset-2 hover:text-mousse"
                    >
                      Refaire
                    </Link>
                    <form action={supprimerActivite.bind(null, a.id)}>
                      <BoutonSupprimerActivite titre={a.titre} />
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {activites.length < (nbTotal ?? 0) && (
          <div className="mt-5 text-center">
            <Link href={lienVoirPlus} className="bouton-secondaire">
              Voir {Math.min(PAS_AFFICHAGE, (nbTotal ?? 0) - activites.length)} de plus
            </Link>
          </div>
        )}
        </>
      )}
        </>
      )}
    </div>
  );
}
