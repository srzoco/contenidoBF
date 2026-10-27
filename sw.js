/* Contenido Barquero — service worker: notificaciones y caché de los archivos con versión (?v=).
   La página se pide primero a internet (si tarda más de 1,5 s, se abre la guardada);
   los .js/.css con ?v= (también config.js) se guardan y abren al instante. Al publicar, sube el ?v= en index.html. */
var CACHE = 'contenido-archivos', PAGINAS = 'contenido-paginas';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // La página: primero internet, pero si tarda más de 1,5 s se abre la guardada (con internet lento no queda en blanco)
  if (req.mode === 'navigate') {
    var red = fetch(req).then(function (r) { if (r.ok) { var copia = r.clone(); caches.open(PAGINAS).then(function (c) { c.put(req, copia); }); } return r; });
    var guardada = caches.open(PAGINAS).then(function (c) { return c.match(req, { ignoreSearch: true }); });
    e.waitUntil(red.catch(function () { /* sin internet */ }));
    e.respondWith(new Promise(function (ok, mal) {
      var listo = false, fin = function (r) { if (!listo && r) { listo = true; ok(r); } };
      var plan = function () { guardada.then(function (hit) { if (hit) fin(hit); else red.then(fin, mal); }); };
      var t = setTimeout(plan, 1500);
      red.then(function (r) { clearTimeout(t); fin(r); }, function () { clearTimeout(t); plan(); });
    }));
    return;
  }
  if (!/[?&]v=/.test(url.search)) return;
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
