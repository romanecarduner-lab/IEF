/* Service worker de "Chemins d'apprentissage".
 *
 * Objectif volontairement limite : permettre d'OUVRIR et de REMPLIR le
 * formulaire "Ajouter une activite" sans reseau. Rien d'autre n'est garde.
 *  - les fichiers statiques de l'application (/_next/static, icones) sont
 *    gardes au premier chargement (ils ne changent jamais pour une meme
 *    adresse) ;
 *  - la page /journal/nouvelle est gardee a chaque visite reussie, et servie
 *    quand le reseau manque ;
 *  - /hors-ligne est la page de secours pour toutes les autres adresses ;
 *  - jamais de donnees de journal, de photos, ni d'appels au serveur de
 *    donnees : tout ce qui est POST ou hors de ce site passe tel quel.
 * A la deconnexion, l'application demande de vider les pages gardees.
 */
const VERSION = "v1";
const CACHE_PAGES = "ief-pages-" + VERSION;
const CACHE_STATIQUE = "ief-statique-" + VERSION;
const PAGES_HORS_LIGNE = ["/journal/nouvelle"];
const PAGE_SECOURS = "/hors-ligne";
const DELAI_RESEAU_MS = 5000;

// Les adresses des fichiers de la page figurent dans son HTML sous deux
// formes : /_next/static/... (balises script et link) et static/... (donnees
// internes de Next, sans prefixe). Les parentheses des dossiers comme
// (protege) peuvent apparaitre telles quelles ou encodees (%28 %29) : on
// garde les deux ecritures, car le navigateur redemande celle qu'il connait.
const REGEX_ASSETS = /(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\\\s]+?\.(?:js|css|woff2?)/g;

function variantes(chemin) {
  const nu = chemin.startsWith("/_next/") ? chemin : "/_next/" + chemin;
  const decode = (() => {
    try {
      return decodeURI(nu);
    } catch (e) {
      return nu;
    }
  })();
  const encode = decode.replace(/\(/g, "%28").replace(/\)/g, "%29");
  return Array.from(new Set([nu, decode, encode]));
}

async function garderAssets(texteHtml) {
  const trouves = texteHtml.match(REGEX_ASSETS) || [];
  const urls = Array.from(new Set(trouves.flatMap(variantes)));
  const cache = await caches.open(CACHE_STATIQUE);
  await Promise.all(
    urls.map(async (u) => {
      if (await cache.match(u)) return;
      try {
        const r = await fetch(u, { credentials: "same-origin" });
        if (r.ok) await cache.put(u, r);
      } catch (e) {
        /* tant pis : sera garde au prochain passage */
      }
    })
  );
}

async function garderPage(url, nomCache) {
  const reponse = await fetch(url, { credentials: "same-origin", redirect: "follow" });
  // Une redirection (page de connexion, par exemple) ne doit jamais etre
  // gardee a la place de la vraie page.
  if (!reponse.ok || reponse.redirected || reponse.type !== "basic") return false;
  const copie = reponse.clone();
  const texte = await reponse.clone().text();
  const cache = await caches.open(nomCache);
  await cache.put(url, copie);
  await garderAssets(texte);
  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        await garderPage(PAGE_SECOURS, CACHE_STATIQUE);
        const cache = await caches.open(CACHE_STATIQUE);
        await cache.addAll(["/manifest.json", "/icones/icone-192.png", "/icones/icone-512.png"]);
      } catch (e) {
        /* installation hors reseau : on reessaiera a la prochaine ouverture */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const noms = await caches.keys();
      await Promise.all(
        noms
          .filter((n) => (n.startsWith("ief-pages-") || n.startsWith("ief-statique-")) && n !== CACHE_PAGES && n !== CACHE_STATIQUE)
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "PRECHARGER") {
    event.waitUntil(
      Promise.all(PAGES_HORS_LIGNE.map((u) => garderPage(u, CACHE_PAGES).catch(() => false)))
    );
  } else if (type === "VIDER") {
    event.waitUntil(caches.delete(CACHE_PAGES));
  }
});

function avecDelai(promesse, ms) {
  return Promise.race([
    promesse,
    new Promise((_, rejeter) => setTimeout(() => rejeter(new Error("delai")), ms)),
  ]);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Fichiers statiques : on sert la copie gardee, sinon le reseau (et on garde).
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icones/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_STATIQUE);
        const gardee = await cache.match(req);
        if (gardee) return gardee;
        const reponse = await fetch(req);
        if (reponse.ok) cache.put(req, reponse.clone());
        return reponse;
      })()
    );
    return;
  }

  // Navigations (ouverture ou rechargement d'une page).
  if (req.mode === "navigate") {
    const horsLigne = PAGES_HORS_LIGNE.includes(url.pathname);
    event.respondWith(
      (async () => {
        try {
          const reponse = horsLigne
            ? await avecDelai(fetch(req), DELAI_RESEAU_MS)
            : await fetch(req);
          if (horsLigne && reponse.ok && !reponse.redirected && reponse.type === "basic") {
            const cache = await caches.open(CACHE_PAGES);
            cache.put(url.pathname, reponse.clone());
          }
          return reponse;
        } catch (e) {
          if (horsLigne) {
            const cache = await caches.open(CACHE_PAGES);
            const gardee = await cache.match(url.pathname);
            if (gardee) return gardee;
          }
          const cacheStatique = await caches.open(CACHE_STATIQUE);
          const secours = await cacheStatique.match(PAGE_SECOURS);
          if (secours) return secours;
          return new Response("Pas de réseau.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
        }
      })()
    );
  }
});
