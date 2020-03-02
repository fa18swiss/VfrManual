const version = "0.0.3";
const cacheName = `vfrmanual-${version}`;

const CACHE_URLS = [
    '/',
    '/static/css/bootstrap.min.css',
    '/static/js/jquery.slim.min.js',
    '/static/js/popper.min.js',
    '/static/js/bootstrap.min.js',
    '/static/svg/de.svg',
    '/static/svg/en.svg',
    '/static/svg/fr.svg',
    '/static/svg/it.svg',
    '/static/app.js'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll(CACHE_URLS).then(() => self.skipWaiting());
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
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