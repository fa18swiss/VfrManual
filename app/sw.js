const version = "1.0.8";
const cacheName = `vfrmanual-${version}`;

const CACHE_URLS = [
    '/',
    '/static/app.js',
    '/static/css/bootstrap.min.css',
    '/static/icon/android-chrome-192x192.png',
    '/static/icon/android-chrome-512x512.png',
    '/static/icon/apple-touch-icon.png',
    '/static/icon/browserconfig.xml',
    '/static/icon/favicon-16x16.png',
    '/static/icon/favicon-32x32.png',
    '/static/icon/favicon.ico',
    '/static/icon/mstile-144x144.png',
    '/static/icon/mstile-150x150.png',
    '/static/icon/mstile-310x150.png',
    '/static/icon/mstile-310x310.png',
    '/static/icon/mstile-70x70.png',
    '/static/icon/safari-pinned-tab.svg',
    '/static/icon/site.webmanifest',
    '/static/js/bootstrap.min.js',
    '/static/js/jquery.slim.min.js',
    '/static/svg/de.svg',
    '/static/svg/en.svg',
    '/static/svg/fr.svg',
    '/static/svg/it.svg'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll(CACHE_URLS).then(() => self.skipWaiting());
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (cacheName !== key) {
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(cacheName)
            .then(cache => cache.match(event.request, {ignoreSearch: true}))
            .then(response => {
                return response || fetch(event.request);
            })
    );
});