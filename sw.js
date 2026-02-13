const CACHE_NAME = 'fashin-play-v1';
const ASSETS = [
    './',
    './index.html',
    './css/player.css',
    './css/variables.css',
    './js/app.js',
    './logo.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    // Network first, fall back to cache
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
