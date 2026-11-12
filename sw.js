/* La Oficina — service worker: abre sin conexión y gestiona los avisos */
const VERSION = 'lo-v6';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'office.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.svg',
  'icons/av_lucia.svg', 'icons/av_ana.svg', 'icons/av_marta.svg', 'icons/av_dani.svg', 'icons/av_marilyn.svg',
  'icons/av_inspector.svg', 'icons/av_gabinete.svg', 'icons/av_cristian.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Los datos de la oficina siempre en directo
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  // Fuentes: caché primero
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(caches.open(VERSION).then(async (c) => (await c.match(e.request)) || fetch(e.request).then((r) => { c.put(e.request, r.clone()); return r; })));
    return;
  }
  // App: red primero (para recibir mejoras) y caché si no hay conexión
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
  }
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.notification.tag && e.notification.tag.startsWith('al') ? './#registro' : './#aprobar';
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => {
    for (const c of cs) { c.navigate(target); return c.focus(); }
    return self.clients.openWindow(target);
  }));
});
