"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EVENEMENT_FILE_CHANGEE,
  lireFile,
  signalerChangementFile,
  supprimerElement,
  type ElementFile,
} from "@/lib/fileAttente";
import { synchroniserFile } from "@/lib/synchroActivite";
import { useEnLigne } from "@/lib/useEnLigne";

/**
 * Mode hors-ligne, cote application :
 *  - enregistre le service worker et fait garder le formulaire d'ajout
 *    d'activite pour qu'il s'ouvre sans reseau ;
 *  - affiche ce qui attend d'etre envoye et l'envoie tout seul des que le
 *    reseau revient (retour en ligne, reouverture de l'application, ou
 *    toutes les 15 secondes tant que quelque chose attend).
 * Rien n'est affiche quand il n'y a rien en attente et que le reseau est bon.
 */
export function HorsLigne({ familleId }: { familleId: string }) {
  const router = useRouter();
  const enLigne = useEnLigne();
  const [elements, setElements] = useState<ElementFile[]>([]);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [message, setMessage] = useState<{ type: "succes" | "info" | "alerte"; texte: string[] } | null>(null);
  const [detailOuvert, setDetailOuvert] = useState(false);
  const delaiMessageRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rafraichirListe = useCallback(async () => {
    try {
      const tous = await lireFile();
      setElements(tous.filter((e) => e.familleId === familleId));
    } catch {
      setElements([]);
    }
  }, [familleId]);

  const envoyer = useCallback(async () => {
    setEnvoiEnCours(true);
    try {
      const bilan = await synchroniserFile(familleId);
      await rafraichirListe();
      if (bilan.sessionExpiree) {
        setMessage({
          type: "alerte",
          texte: ["Votre session a expiré : reconnectez-vous pour envoyer vos activités en attente."],
        });
      } else if (bilan.envoyees > 0) {
        setMessage({
          type: bilan.avertissements.length > 0 ? "alerte" : "succes",
          texte: [
            bilan.envoyees === 1
              ? "1 activité gardée sur ce téléphone vient d'être envoyée."
              : `${bilan.envoyees} activités gardées sur ce téléphone viennent d'être envoyées.`,
            ...bilan.avertissements,
          ],
        });
        router.refresh();
        if (delaiMessageRef.current) clearTimeout(delaiMessageRef.current);
        if (bilan.avertissements.length === 0) {
          delaiMessageRef.current = setTimeout(() => setMessage(null), 7000);
        }
      }
    } finally {
      setEnvoiEnCours(false);
    }
  }, [familleId, rafraichirListe, router]);

  // Service worker + pages gardees pour le hors-ligne.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let annule = false;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        if (annule) return;
        let dejaFait = false;
        try {
          dejaFait = sessionStorage.getItem("ief-precharge") === "1";
        } catch {
          /* sans consequence */
        }
        if (!dejaFait && navigator.onLine) {
          reg.active?.postMessage({ type: "PRECHARGER" });
          try {
            sessionStorage.setItem("ief-precharge", "1");
          } catch {
            /* sans consequence */
          }
        }
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, []);

  // Liste a jour + envoi automatique.
  useEffect(() => {
    void rafraichirListe();
    const surChangement = () => void rafraichirListe();
    window.addEventListener(EVENEMENT_FILE_CHANGEE, surChangement);
    return () => window.removeEventListener(EVENEMENT_FILE_CHANGEE, surChangement);
  }, [rafraichirListe]);

  const nbEnAttente = elements.length;

  useEffect(() => {
    if (nbEnAttente === 0 || !enLigne) return;
    void envoyer();
    const minuteur = setInterval(() => void envoyer(), 15000);
    const surRetourAuPremierPlan = () => {
      if (document.visibilityState === "visible") void envoyer();
    };
    document.addEventListener("visibilitychange", surRetourAuPremierPlan);
    return () => {
      clearInterval(minuteur);
      document.removeEventListener("visibilitychange", surRetourAuPremierPlan);
    };
    // `envoyer` change quand la liste change : on ne relance que sur ces conditions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nbEnAttente > 0, enLigne]);

  // Un nouvel element vient d'etre mis en file : on tente l'envoi tout de suite si possible.
  useEffect(() => {
    if (nbEnAttente > 0 && enLigne && !envoiEnCours) void envoyer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nbEnAttente]);

  if (nbEnAttente === 0 && enLigne && !message) return null;

  return (
    <div className="mb-4 space-y-2" aria-live="polite">
      {!enLigne && (
        <p className="rounded-doux border border-trait bg-white px-3 py-2 text-xs text-ardoise">
          📡 Hors connexion. Vous pouvez saisir une activité : elle sera envoyée dès le retour du réseau.
        </p>
      )}

      {message && (
        <div
          className={`rounded-doux border px-3 py-2 text-sm ${
            message.type === "alerte"
              ? "border-alerte/40 bg-white text-alerte"
              : "border-mousse/40 bg-mousse/10 text-mousse-fonce"
          }`}
        >
          {message.texte.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
          {message.type === "alerte" && (
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="mt-1 text-xs underline underline-offset-2"
            >
              Fermer
            </button>
          )}
        </div>
      )}

      {nbEnAttente > 0 && (
        <div className="rounded-doux border border-ocre/50 bg-white px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-encre">
              <strong>
                {nbEnAttente} activité{nbEnAttente > 1 ? "s" : ""} en attente d&rsquo;envoi
              </strong>
              <span className="block text-xs text-ardoise">
                {envoiEnCours
                  ? "Envoi en cours…"
                  : enLigne
                  ? "Nouvel essai automatique dans quelques secondes."
                  : "Elles partiront dès que le réseau sera de retour."}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDetailOuvert((v) => !v)}
                className="min-h-[40px] text-xs text-mousse-fonce underline underline-offset-2"
              >
                {detailOuvert ? "Masquer" : "Détails"}
              </button>
              {enLigne && (
                <button
                  type="button"
                  disabled={envoiEnCours}
                  onClick={() => void envoyer()}
                  className="bouton-secondaire bouton-petit"
                >
                  Envoyer maintenant
                </button>
              )}
            </div>
          </div>

          {detailOuvert && (
            <ul className="mt-3 space-y-2 border-t border-trait pt-3">
              {elements.map((e) => (
                <li key={e.idLocal} className="flex flex-wrap items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="text-encre">{e.donnees.titre}</p>
                    <p className="text-xs text-ardoise">
                      {new Date(e.donnees.dateActivite).toLocaleDateString("fr-FR")}
                      {e.photos.length > 0
                        ? ` · ${e.photos.length} photo${e.photos.length > 1 ? "s" : ""}`
                        : ""}
                      {e.etat.activiteCreee ? " · activité envoyée, suite en cours" : ""}
                    </p>
                    {e.derniereErreur && <p className="text-xs text-alerte">{e.derniereErreur}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Retirer « ${e.donnees.titre} » de l'attente ? Elle ne sera pas envoyée et sera perdue.`
                        )
                      )
                        return;
                      await supprimerElement(e.idLocal);
                      signalerChangementFile();
                    }}
                    className="min-h-[40px] px-1 text-xs text-alerte underline decoration-alerte/40 underline-offset-2"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
