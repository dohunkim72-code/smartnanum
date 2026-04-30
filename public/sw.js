// 서비스 워커: 앱을 설치 가능하게 만들고 오프라인에서도 작동하도록 돕습니다.
const CACHE_NAME = 'smartnanum-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
