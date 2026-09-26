/* Cachea el juego para que ande sin conexión desde GitHub Pages.
   Primero va a la red, así una versión nueva se toma enseguida, y cae al
   cache si no hay señal. Los textos no pasan por acá: viven en el navegador. */
const CACHE = 'de-que-texto-es-v1';
const BASE = ['./', './index.html', './manifest.json', './icono-192.png', './icono-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
