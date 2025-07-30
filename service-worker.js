const CACHE_NAME = 'todo-cache-v5';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ----- Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

// ----- Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// ----- Fetch: navigation network-first with offline fallback; others cache-first
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch (e) {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match('./index.html')) || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});

// ===== Background Sync (one-off) =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(handleTaskSync());
  }
});

async function handleTaskSync() {
  // TODO: push queued changes to your server/Firebase if you add one.
  // Safe no-op for now.
  console.log('[SW] Background sync: sync-tasks');
}

// ===== Periodic Background Sync (asset refresh) =====
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'asset-cache') {
    event.waitUntil(refreshAssets());
  }
});

async function refreshAssets() {
  const cache = await caches.open(CACHE_NAME);
  const toUpdate = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
  ];
  try {
    await Promise.all(
      toUpdate.map((url) =>
        fetch(url, { cache: 'no-store' }).then((res) => cache.put(url, res.clone()))
      )
    );
    console.log('[SW] Assets refreshed via periodic sync');
  } catch (e) {
    console.warn('[SW] Periodic sync refresh failed:', e);
  }
}

// ===== Web Push handlers =====
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {}
  const title = data.title || 'To-Do';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: data.url || './'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || './';
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = allClients.find((c) => c.url.includes(url));
      if (existing) {
        existing.focus();
      } else {
        await clients.openWindow(url);
      }
    })()
  );
});
