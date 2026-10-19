"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { reordonnerTraces, supprimerTrace } from "./actions";

export type TraceAffichee = {
  id: string;
  legende: string | null;
  typeLibelle: string | undefined;
  contenuTexte: string | null;
  urlMiniature: string | null;
  urlFichier: string | null;
  auteurAffiche: string | null;
};

/**
 * Traces d'une activite, reordonnables : on attrape la poignee ⠿ d'une
 * carte et on la fait glisser devant ou derriere une autre (souris ou
 * doigt). Le bouton « En premier » et les fleches du clavier font la meme
 * chose sans glisser. La premiere photo sert d'apercu dans le Journal.
 */
export function ListeTraces({ activiteId, traces }: { activiteId: string; traces: TraceAffichee[] }) {
  const router = useRouter();
  const parId = new Map(traces.map((t) => [t.id, t]));
  const [ordre, setOrdre] = useState<string[]>(traces.map((t) => t.id));
  const [message, setMessage] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [glisse, setGlisse] = useState<{ id: string; x: number; y: number; w: number; h: number; dx: number; dy: number } | null>(
    null
  );
  const cartes = useRef(new Map<string, HTMLLIElement>());
  const ordreAvantGeste = useRef<string[]>([]);
  const ordreCourant = useRef<string[]>(ordre);
  ordreCourant.current = ordre;
  const defilement = useRef<number>(0);
  const dernierPointeur = useRef<{ x: number; y: number } | null>(null);

  // Quand la page est rechargee avec une autre liste (ajout, suppression,
  // autre appareil), on repart de ce que dit le serveur.
  const signature = traces.map((t) => t.id).join(",");
  useEffect(() => {
    setOrdre(traces.map((t) => t.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  async function enregistrer(nouvelOrdre: string[], ancienOrdre: string[]) {
    if (nouvelOrdre.join(",") === ancienOrdre.join(",")) return;
    setEnregistrement(true);
    setMessage(null);
    try {
      const r = await reordonnerTraces(activiteId, nouvelOrdre);
      if ("erreur" in r) {
        setOrdre(ancienOrdre);
        setMessage(r.erreur);
      } else {
        setMessage("Ordre enregistré.");
        window.setTimeout(() => setMessage((m) => (m === "Ordre enregistré." ? null : m)), 2500);
        router.refresh();
      }
    } catch {
      setOrdre(ancienOrdre);
      setMessage("L'ordre n'a pas pu être enregistré (réseau ?). Merci de réessayer.");
    } finally {
      setEnregistrement(false);
    }
  }

  function deplacer(id: string, versIndex: number) {
    setOrdre((courant) => {
      const depuis = courant.indexOf(id);
      if (depuis === -1 || depuis === versIndex) return courant;
      const copie = courant.slice();
      copie.splice(depuis, 1);
      copie.splice(versIndex, 0, id);
      return copie;
    });
  }

  async function mettreEnPremier(id: string) {
    const ancien = ordre;
    const nouveau = [id, ...ordre.filter((x) => x !== id)];
    setOrdre(nouveau);
    await enregistrer(nouveau, ancien);
  }

  async function surTouche(e: React.KeyboardEvent, id: string) {
    const delta = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : 0;
    if (!delta) return;
    e.preventDefault();
    const i = ordre.indexOf(id);
    const j = i + delta;
    if (j < 0 || j >= ordre.length) return;
    const ancien = ordre;
    const nouveau = ordre.slice();
    nouveau.splice(i, 1);
    nouveau.splice(j, 0, id);
    setOrdre(nouveau);
    await enregistrer(nouveau, ancien);
  }

  // --- Glisser (souris ou doigt), via la poignee ---
  function debutGeste(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    const carte = cartes.current.get(id);
    if (!carte) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = carte.getBoundingClientRect();
    ordreAvantGeste.current = ordreCourant.current;
    dernierPointeur.current = { x: e.clientX, y: e.clientY };
    setGlisse({ id, x: e.clientX, y: e.clientY, w: r.width, h: r.height, dx: e.clientX - r.left, dy: e.clientY - r.top });
    setMessage(null);
  }

  function mouvementGeste(e: React.PointerEvent<HTMLButtonElement>) {
    if (!glisse) return;
    dernierPointeur.current = { x: e.clientX, y: e.clientY };
    setGlisse((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
    // La carte survolee (autre que celle qu'on tient) donne la nouvelle place.
    for (const [autreId, el] of cartes.current) {
      if (autreId === glisse.id) continue;
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        deplacer(glisse.id, ordreCourant.current.indexOf(autreId));
        break;
      }
    }
  }

  async function finGeste(e: React.PointerEvent<HTMLButtonElement>) {
    if (!glisse) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* deja relache */
    }
    setGlisse(null);
    dernierPointeur.current = null;
    await enregistrer(ordreCourant.current, ordreAvantGeste.current);
  }

  function annulerGeste() {
    if (!glisse) return;
    setGlisse(null);
    dernierPointeur.current = null;
    setOrdre(ordreAvantGeste.current);
  }

  // Defilement automatique de la page quand on approche du haut ou du bas de l'ecran.
  useEffect(() => {
    if (!glisse) return;
    const boucle = () => {
      const p = dernierPointeur.current;
      if (p) {
        if (p.y < 90) window.scrollBy(0, -12);
        else if (p.y > window.innerHeight - 90) window.scrollBy(0, 12);
      }
      defilement.current = requestAnimationFrame(boucle);
    };
    defilement.current = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(defilement.current);
  }, [glisse]);

  return (
    <div>
      {traces.length > 1 && (
        <p className="mb-3 text-xs text-ardoise">
          Faites glisser ⠿ pour changer l&rsquo;ordre, ou touchez « En premier ». La première sert d&rsquo;aperçu
          dans le Journal.
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {message}
      </p>
      {message && (
        <p className={`mb-3 text-xs ${message === "Ordre enregistré." ? "text-mousse-fonce" : "text-alerte"}`}>
          {message}
        </p>
      )}

      <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${glisse ? "select-none" : ""}`}>
        {ordre.map((id, rang) => {
          const t = parId.get(id);
          if (!t) return null;
          const estGlisse = glisse?.id === id;
          return (
            <li
              key={id}
              ref={(el) => {
                if (el) cartes.current.set(id, el);
                else cartes.current.delete(id);
              }}
              className={`carte relative p-3 transition-opacity ${estGlisse ? "opacity-30" : ""}`}
            >
              {traces.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={`Déplacer cette trace (position ${rang + 1} sur ${ordre.length}). Faites glisser, ou utilisez les flèches du clavier.`}
                    onPointerDown={(e) => debutGeste(e, id)}
                    onPointerMove={mouvementGeste}
                    onPointerUp={finGeste}
                    onPointerCancel={annulerGeste}
                    onKeyDown={(e) => void surTouche(e, id)}
                    style={{ touchAction: "none" }}
                    className="absolute left-1.5 top-1.5 z-10 flex h-9 w-9 cursor-grab items-center justify-center rounded-full bg-white/90 text-lg text-ardoise shadow-doux active:cursor-grabbing"
                  >
                    ⠿
                  </button>
                  {rang === 0 && (
                    <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-mousse-fonce px-2 py-0.5 text-[10px] font-medium text-white">
                      Première
                    </span>
                  )}
                </>
              )}

              <Contenu t={t} />

              <p className="text-xs text-ardoise">{t.typeLibelle}</p>
              {t.auteurAffiche && <p className="text-xs text-ardoise">Ajoutée par {t.auteurAffiche}</p>}
              {t.legende && <p className="text-xs text-encre">{t.legende}</p>}

              <div className="mt-1 flex flex-wrap items-center gap-x-3">
                {rang > 0 && (
                  <button
                    type="button"
                    disabled={enregistrement}
                    onClick={() => void mettreEnPremier(id)}
                    className="min-h-[36px] text-xs text-mousse-fonce underline underline-offset-2"
                  >
                    En premier
                  </button>
                )}
                <form
                  action={async () => {
                    if (!window.confirm("Supprimer cette trace ? Cette action est définitive.")) return;
                    await supprimerTrace(id, activiteId);
                  }}
                >
                  <button
                    type="submit"
                    className="min-h-[36px] text-xs text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Copie flottante qui suit le doigt ou la souris pendant le glissement. */}
      {glisse && parId.get(glisse.id) && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 rotate-2 opacity-95 shadow-2xl"
          style={{ left: glisse.x - glisse.dx, top: glisse.y - glisse.dy, width: glisse.w, height: glisse.h }}
        >
          <div className="carte h-full overflow-hidden p-3">
            <Contenu t={parId.get(glisse.id) as TraceAffichee} />
          </div>
        </div>
      )}
    </div>
  );
}

function Contenu({ t }: { t: TraceAffichee }) {
  if (t.urlMiniature) {
    return (
      <a href={t.urlFichier ?? t.urlMiniature} target="_blank" rel="noopener noreferrer" draggable={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.urlMiniature}
          alt={t.legende ?? t.typeLibelle ?? "Trace"}
          draggable={false}
          className="mb-2 h-24 w-full rounded object-cover"
        />
      </a>
    );
  }
  if (t.urlFichier) {
    return (
      <a
        href={t.urlFichier}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 flex h-24 flex-col items-center justify-center gap-1 rounded bg-lin text-center text-mousse-fonce hover:bg-trait"
      >
        <span className="text-2xl">📄</span>
        <span className="text-xs underline underline-offset-2">Ouvrir le document</span>
      </a>
    );
  }
  return <p className="mb-2 line-clamp-3 text-sm text-encre">{t.contenuTexte}</p>;
}
