// Buvette BLFC (V3) : ouverture instantanée depuis la copie locale, mise à jour en arrière-plan.
// Les données, elles, restent dans le Google Sheet.
const CACHE = 'buvette-blfc-v3';
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
    // copie locale tout de suite (ouverture instantanée), nouvelle version récupérée en arrière-plan
    const k = url.pathname.endsWith('config.js') ? 'config.js' : 'index.html';
    const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(k, c)); } return r; });
    e.respondWith(caches.match(k).then(c => c || net).catch(() => net));
    e.waitUntil(net.catch(() => {}));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
