/* Contenido Barquero — service worker: solo notificaciones (no guarda caché para no mostrar versiones viejas) */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

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
