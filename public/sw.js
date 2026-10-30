// SHRIJAIV service worker: offline fallback + cache for static assets and brand images.
// v3: only real, successful files are cached (never error pages or sign-in redirects), and every
// new version wipes the old caches — a bad cached file can no longer break the site.
const CACHE = 'shrijaiv-v3';
const OFFLINE = '/offline.html';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE]).catch(() => null)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const okToCache = (url, res) => {
  if (!res || !res.ok || res.status !== 200 || res.type !== 'basic' || res.redirected) return false;
  const type = res.headers.get('content-type') || '';
  if (/\.js$/.test(url.pathname)) return type.includes('javascript');
  if (/\.css$/.test(url.pathname)) return type.includes('css');
  if (/\.(png|jpe?g|webp|svg|ico|gif|avif)$/.test(url.pathname)) return type.startsWith('image/');
  if (/\.woff2?$/.test(url.pathname)) return type.includes('font') || type.includes('octet');
  return !type.includes('text/html');
};
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/seller') || url.pathname.startsWith('/buyer')) return;
  // static assets: cache first (versioned file names never change content)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/brand/') || /\.(png|jpe?g|webp|svg|ico|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (okToCache(url, res)) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }
  // pages: network first, offline fallback
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
  }
});
