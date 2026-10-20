/* Contenido Barquero — service worker: notificaciones y caché de los archivos con versión (?v=).
   La página y config.js siempre se piden primero a internet, así que nunca se ve una versión vieja;
   los .js/.css con ?v= se guardan y abren al instante. Al publicar, sube el ?v= en index.html. */
var CACHE = 'contenido-archivos';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !/[?&]v=/.test(url.search) || /config\.js$/.test(url.pathname)) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req).then(function (hit) {
      return hit || fetch(req).then(function (r) {
        if (r.ok) {
          c.put(req, r.clone());
          // borra las versiones anteriores del mismo archivo
          c.keys().then(function (ks) { ks.forEach(function (k) { var u = new URL(k.url); if (u.pathname === url.pathname && u.search !== url.search) c.delete(k); }); });
        }
        return r;
      });
    });
  }));
});

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { cuerpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Contenido Barquero', {
    body: d.cuerpo || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { hash: d.hash || '#/' }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var hash = (e.notification.data && e.notification.data.hash) || '#/';
  var scope = self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].url.indexOf(scope) === 0 && 'focus' in lista[i]) {
        lista[i].postMessage({ tipo: 'abrir', hash: hash });
        return lista[i].focus();
      }
    }
    return self.clients.openWindow(scope + hash);
  }));
});
