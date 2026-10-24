/* Service worker de "Chemins d'apprentissage".
 *
 * Objectif volontairement limite : OUVRIR et LIRE le journal, et REMPLIR le
 * formulaire "Ajouter une activite", sans reseau.
 *  - les fichiers statiques de l'application (/_next/static, icones) sont
 *    gardes au premier chargement (ils ne changent jamais pour une meme
 *    adresse) ;
 *  - ces pages sont gardees a chaque visite reussie, et servies quand le
 *    reseau manque : /journal (liste), /journal/<id> (une activite) et
 *    /journal/nouvelle (formulaire). Au demarrage de la session, les
 *    activites les plus recentes sont gardees d'avance ;
 *  - les photos affichees dans ces pages (miniatures signees) sont gardees
 *    sous leur adresse sans la signature, qui change a chaque affichage ;
 *  - /hors-ligne est la page de secours pour toutes les autres adresses ;
 *  - jamais d'appels au serveur de donnees : tout ce qui est POST ou hors de
 *    ce site (hors photos du journal) passe tel quel.
 * A la deconnexion, l'application demande de vider les pages et photos gardees.
 */
const VERSION = "v3";
const CACHE_PAGES = "ief-pages-" + VERSION;
const CACHE_IMAGES = "ief-images-" + VERSION;
const CACHE_STATIQUE = "ief-statique-" + VERSION;
const PAGES_HORS_LIGNE = ["/journal/nouvelle"];
const REGEX_ACTIVITE = /^\/journal\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NB_ACTIVITES_D_AVANCE = 12;
const NB_IMAGES_MAX = 400;
const NB_PAGES_MAX = 60;
const CHEMIN_PHOTOS = "/storage/v1/object/sign/traces-pedagogiques/";

function pageGardable(chemin) {
  return PAGES_HORS_LIGNE.includes(chemin) || chemin === "/journal" || REGEX_ACTIVITE.test(chemin);
}

// Une photo est gardee sous son adresse SANS la signature (?token=...).
function cleImage(url) {
  const u = new URL(url);
  return u.origin + u.pathname;
}

async function limiter(cache, max) {
  const cles = await cache.keys();
  for (let i = 0; i < cles.length - max; i++) await cache.delete(cles[i]);
}

async function garderImage(url, requete) {
  const cache = await caches.open(CACHE_IMAGES);
  const cle = cleImage(url);
  if (await cache.match(cle)) return;
  let reponse = null;
  try {
    reponse = await fetch(requete || url, requete ? undefined : { mode: "cors" });
  } catch (e) {
    try {
      reponse = await fetch(url, { mode: "no-cors" });
    } catch (e2) {
      return;
    }
  }
  if (reponse && (reponse.ok || reponse.type === "opaque")) {
    await cache.put(cle, reponse);
    await limiter(cache, NB_IMAGES_MAX);
  }
}

function imagesDuHtml(texteHtml) {
  const trouvees = texteHtml.match(/https:\/\/[^"'\s\\<>]+\/storage\/v1\/object\/sign\/traces-pedagogiques\/[^"'\s\\<>]+/g) || [];
  return Array.from(new Set(trouvees.map((u) => u.replace(/&amp;/g, "&"))));
}
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
  if (nomCache === CACHE_PAGES) await limiter(cache, NB_PAGES_MAX);
  await garderAssets(texte);
  await Promise.all(imagesDuHtml(texte).map((u) => garderImage(u)));
  return { texte };
}

// Garde la liste du journal puis les activites les plus recentes.
async function garderJournalD_Avance() {
  const liste = await garderPage("/journal", CACHE_PAGES).catch(() => false);
  if (!liste) return;
  const liens = [];
  for (const m of liste.texte.matchAll(/href="(\/journal\/[0-9a-f-]{36})"/g)) {
    if (!liens.includes(m[1])) liens.push(m[1]);
  }
  for (const lien of liens.slice(0, NB_ACTIVITES_D_AVANCE)) {
    await garderPage(lien, CACHE_PAGES).catch(() => false);
  }
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
          .filter(
            (n) =>
              (n.startsWith("ief-pages-") || n.startsWith("ief-statique-") || n.startsWith("ief-images-")) &&
              n !== CACHE_PAGES &&
              n !== CACHE_STATIQUE &&
              n !== CACHE_IMAGES
          )
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
      Promise.all([
        ...PAGES_HORS_LIGNE.map((u) => garderPage(u, CACHE_PAGES).catch(() => false)),
        garderJournalD_Avance(),
      ])
    );
  } else if (type === "VIDER") {
    event.waitUntil(Promise.all([caches.delete(CACHE_PAGES), caches.delete(CACHE_IMAGES)]));
  }
});

function avecDelai(promesse, ms) {
  return Promise.race([
    promesse,
    new Promise((_, rejeter) => setTimeout(() => rejeter(new Error("delai")), ms)),
  ]);
}

// Photos partagees depuis la galerie (menu Partager, Android) : le manifeste
// envoie un POST vers /partage-photos. On garde les fichiers dans IndexedDB
// puis on redirige vers le formulaire, qui les reprend. Fonctionne meme hors
// reseau, puisque rien ne part vers le serveur.
const BASE_PARTAGE = "ief-partage";
const CHEMIN_PARTAGE = "/partage-photos";

function ouvrirPartage() {
  return new Promise((resoudre, rejeter) => {
    const requete = indexedDB.open(BASE_PARTAGE, 1);
    requete.onupgradeneeded = () => requete.result.createObjectStore("fichiers", { autoIncrement: true });
    requete.onsuccess = () => resoudre(requete.result);
    requete.onerror = () => rejeter(requete.error);
  });
}

async function garderPhotosPartagees(fichiers) {
  const base = await ouvrirPartage();
  await new Promise((resoudre, rejeter) => {
    const tx = base.transaction("fichiers", "readwrite");
    const magasin = tx.objectStore("fichiers");
    magasin.clear();
    fichiers.forEach((f) => magasin.add(f));
    tx.oncomplete = () => resoudre();
    tx.onerror = () => rejeter(tx.error);
  });
  base.close();
}

async function recevoirPartage(req) {
  try {
    const donnees = await req.formData();
    const fichiers = donnees.getAll("photos").filter((f) => f && typeof f === "object" && f.size > 0);
    if (fichiers.length > 0) await garderPhotosPartagees(fichiers);
  } catch (e) {
    /* on redirige quand meme : le formulaire restera vide */
  }
  return Response.redirect("/journal/nouvelle?partage=1", 303);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method === "POST" && new URL(req.url).pathname === CHEMIN_PARTAGE) {
    event.respondWith(recevoirPartage(req));
    return;
  }
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Photos du journal (autre adresse que le site) : copie gardee d'abord.
  if (url.origin !== self.location.origin) {
    if (req.destination === "image" && url.pathname.startsWith(CHEMIN_PHOTOS)) {
      event.respondWith(
        (async () => {
          const cache = await caches.open(CACHE_IMAGES);
          const gardee = await cache.match(cleImage(req.url));
          if (gardee) return gardee;
          const reponse = await fetch(req);
          if (reponse.ok || reponse.type === "opaque") {
            event.waitUntil(
              (async () => {
                await cache.put(cleImage(req.url), reponse.clone());
                await limiter(cache, NB_IMAGES_MAX);
              })()
            );
          }
          return reponse;
        })()
      );
    }
    return;
  }

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
    const gardable = pageGardable(url.pathname);
    // La liste du journal change selon les filtres : on garde chaque variante.
    const cleCache = url.pathname + url.search;
    event.respondWith(
      (async () => {
        try {
          const reponse = gardable
            ? await avecDelai(fetch(req), DELAI_RESEAU_MS)
            : await fetch(req);
          if (gardable && reponse.ok && !reponse.redirected && reponse.type === "basic") {
            event.waitUntil(
              (async () => {
                const cache = await caches.open(CACHE_PAGES);
                await cache.put(cleCache, reponse.clone());
                await limiter(cache, NB_PAGES_MAX);
                const texte = await reponse.clone().text();
                await garderAssets(texte);
                await Promise.all(imagesDuHtml(texte).map((u) => garderImage(u)));
              })()
            );
          }
          return reponse;
        } catch (e) {
          if (gardable) {
            const cache = await caches.open(CACHE_PAGES);
            const gardee =
              (await cache.match(cleCache)) ||
              (await cache.match(url.pathname)) ||
              (await cache.match(url.pathname, { ignoreSearch: true }));
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
