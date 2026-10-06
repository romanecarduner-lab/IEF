"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  basculerExemple,
  changerPhotosExemple,
  chargerCandidatsSousDomaine,
  type CandidatPourChoix,
} from "./actionsExemples";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

type Choix = { activiteId: string; traceIds: string[] };

/**
 * Bande defilante d'activites candidates pour illustrer un sous-domaine :
 * on coche celles a retenir, et, pour chacune, les photos a montrer. Les
 * activites avec photo viennent en premier. Cocher une activite redige
 * automatiquement un court texte pour cet exemple (modifiable ensuite).
 */
export function SelecteurExemples({
  dossierId,
  sousDomaine,
}: {
  dossierId: string;
  sousDomaine: string;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [candidats, setCandidats] = useState<CandidatPourChoix[] | null>(null);
  const [choix, setChoix] = useState<Choix[]>([]);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function ouvrir() {
    const nouveau = !ouvert;
    setOuvert(nouveau);
    if (!nouveau || candidats) return;
    setChargement(true);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(chargerCandidatsSousDomaine(dossierId, sousDomaine), 45000);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      setCandidats(resultat.candidats);
      setChoix(resultat.choix);
    } catch (e) {
      setErreur(messagePourErreurInattendue(e));
    } finally {
      setChargement(false);
    }
  }

  function majChoix(exemples: { activite_id: string; trace_ids: string[] }[]) {
    setChoix(exemples.map((e) => ({ activiteId: e.activite_id, traceIds: e.trace_ids })));
    router.refresh();
  }

  async function basculerActivite(activiteId: string, actif: boolean) {
    setOccupe(activiteId);
    setErreur(null);
    setNote(null);
    try {
      const resultat = await avecDelaiMaximal(basculerExemple(dossierId, sousDomaine, activiteId, actif), 60000);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      if (resultat.avertissement) setNote(resultat.avertissement);
      majChoix(resultat.exemples);
    } catch (e) {
      setErreur(messagePourErreurInattendue(e));
    } finally {
      setOccupe(null);
    }
  }

  async function basculerPhoto(activiteId: string, photoId: string) {
    const actuel = choix.find((c) => c.activiteId === activiteId);
    if (!actuel) return;
    const traceIds = actuel.traceIds.includes(photoId)
      ? actuel.traceIds.filter((id) => id !== photoId)
      : [...actuel.traceIds, photoId];
    setOccupe(activiteId);
    setErreur(null);
    try {
      const resultat = await avecDelaiMaximal(changerPhotosExemple(dossierId, sousDomaine, activiteId, traceIds));
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      majChoix(resultat.exemples);
    } catch (e) {
      setErreur(messagePourErreurInattendue(e));
    } finally {
      setOccupe(null);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={ouvrir}
        className="text-xs font-medium text-mousse-fonce underline underline-offset-2 hover:text-mousse"
      >
        {ouvert ? "Masquer le choix des exemples" : "Choisir les exemples et les photos"}
      </button>

      {ouvert && (
        <div className="mt-2">
          {chargement && <p className="text-xs text-ardoise">Chargement des activités…</p>}
          {erreur && <p className="text-xs text-alerte">{erreur}</p>}
          {note && <p className="text-xs text-ardoise">{note}</p>}

          {candidats && candidats.length === 0 && (
            <p className="text-xs text-ardoise">
              Aucune activité reliée à ce sous-domaine pour l&rsquo;instant.
            </p>
          )}

          {candidats && candidats.length > 0 && (
            <>
              <p className="mb-2 text-xs text-ardoise">
                Faites défiler et cochez les activités à retenir, puis touchez les
                photos à montrer pour chacune. Les activités avec photo sont en premier.
              </p>
              <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
                {candidats.map((c) => {
                  const retenu = choix.find((x) => x.activiteId === c.id);
                  const enCours = occupe === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`w-52 shrink-0 snap-start rounded-doux border p-2.5 ${
                        retenu ? "border-mousse bg-mousse/5" : "border-trait bg-white"
                      }`}
                    >
                      <label className="flex items-start gap-2 text-xs text-encre">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={Boolean(retenu)}
                          disabled={occupe !== null}
                          onChange={(e) => basculerActivite(c.id, e.target.checked)}
                        />
                        <span>
                          <span className="font-medium">{c.titre}</span>
                          <span className="block text-ardoise">
                            {new Date(c.date).toLocaleDateString("fr-FR")}
                            {c.anneeCourante ? "" : " · autre année"}
                            {c.favori ? " · ★" : ""}
                          </span>
                        </span>
                      </label>

                      {enCours && (
                        <p className="mt-2 text-xs text-ardoise">
                          {retenu ? "Mise à jour…" : "Rédaction du texte…"}
                        </p>
                      )}

                      {c.photos.length === 0 ? (
                        <p className="mt-2 text-xs text-ardoise">Sans photo</p>
                      ) : (
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          {c.photos.map((p) => {
                            const choisie = retenu?.traceIds.includes(p.id) ?? false;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={!retenu || occupe !== null}
                                onClick={() => basculerPhoto(c.id, p.id)}
                                title={retenu ? "Montrer ou retirer cette photo" : "Cochez d'abord l'activité"}
                                className={`relative aspect-square overflow-hidden rounded-doux border-2 ${
                                  choisie ? "border-mousse" : "border-transparent"
                                } ${retenu ? "" : "opacity-60"}`}
                              >
                                {p.url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center bg-lin text-xs text-ardoise">
                                    ?
                                  </span>
                                )}
                                {choisie && (
                                  <span className="absolute right-0.5 top-0.5 rounded-full bg-mousse-fonce px-1 text-[10px] text-white">
                                    ✓
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
