// Service worker del Juego de la Vida.
//
// Estrategia: primero la red, la caché como respaldo. Así la versión instalada
// en el celular nunca queda vieja mientras haya señal, y sigue abriendo igual
// cuando no hay internet.

const CACHE = "vida-v1";
const ESENCIALES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icono-192.png",
  "./icono-512.png",
  "./icono-maskable-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png"
];

self.addEventListener("install", ev => {
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ESENCIALES))
      .catch(() => {})            // si algo no está, se guarda igual al primer uso
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(c => c !== CACHE).map(c => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", ev => {
  const pedido = ev.request;
  if (pedido.method !== "GET") return;

  ev.respondWith(
    fetch(pedido)
      .then(respuesta => {
        if (respuesta && respuesta.ok && new URL(pedido.url).origin === self.location.origin) {
          const copia = respuesta.clone();
          caches.open(CACHE).then(c => c.put(pedido, copia)).catch(() => {});
        }
        return respuesta;
      })
      .catch(() => caches.match(pedido).then(guardada => {
        if (guardada) return guardada;
        // sin internet y sin copia: al menos que abra el tablero
        return pedido.mode === "navigate" ? caches.match("./index.html") : Promise.reject();
      }))
  );
});
