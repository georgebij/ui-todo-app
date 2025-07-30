const CACHE_NAME = "todo-cache-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Install: pre-cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Network with cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Navigation fallback to index.html (handy on GH Pages)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(request);
          return net;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match("./index.html")) || Response.error();
        }
      })()
    );
    return;
  }

  // Other requests: cache-first, then network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
