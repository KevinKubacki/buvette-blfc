// Buvette BLFC : garde l'appli disponible même avec un réseau faible.
// Les données, elles, restent dans le Google Sheet.
const CACHE = 'buvette-blfc-v2';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Google Sheet, polices, etc. : pas touché
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('config.js')) {
    // toujours la dernière version en ligne, la copie locale si pas de réseau
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); const k = url.pathname.endsWith('config.js') ? 'config.js' : 'index.html'; caches.open(CACHE).then(x => x.put(k, c)); return r; })
      .catch(() => caches.match(url.pathname.endsWith('config.js') ? 'config.js' : 'index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
