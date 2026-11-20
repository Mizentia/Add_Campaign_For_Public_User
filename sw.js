const CACHE_NAME = 'nl-camp-pwa-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json?v=20261120_1',
  './css/theme.css?v=20261120_1',
  './css/style.css?v=20261120_1',
  './css/orders.css?v=20261120_1',
  './css/calculator.css?v=20261120_1',
  './js/i18n.js?v=20261120_1',
  './js/platforms.js?v=20261120_1',
  './js/currencies.js?v=20261120_1',
  './js/calc-ui.js?v=20261120_1',
  './js/curr-drop.js?v=20261120_1',
  './js/order-anim.js?v=20261120_1',
  './js/orders.js?v=20261120_1',
  './js/app.js?v=20261120_1'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/submit-order') || url.pathname.startsWith('/api/order-status') || url.pathname.startsWith('/api/server-info')) return;
  const trusted = url.origin === self.location.origin || /(googleapis\.com|gstatic\.com|flagcdn\.com|res\.cloudinary\.com)$/i.test(url.hostname);
  if (!trusted) return;

  if (req.mode === 'navigate' || url.pathname.endsWith('/api/campaign-settings') || url.pathname.endsWith('/manifest.json')) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const cl = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, cl)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const cl = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, cl));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
