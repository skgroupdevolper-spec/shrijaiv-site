// The SHRIJAIV app (service worker) was removed. This file only exists so that browsers which still have the
// old worker installed replace it with this one, which clears every cache and unregisters itself.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((c) => c.navigate(c.url).catch(() => null)))
  );
});
