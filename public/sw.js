// 서비스 워커: 앱 자동 업데이트 및 네트워크 우선 전략 적용 ✨
const CACHE_NAME = 'smartnanum-v' + Date.now(); // 배포 시마다 고유한 버전 생성
const urlsToCache = [
  '/',
  '/index.html',
  '/icon.png',
  '/manifest.json'
];

// 1. 설치 단계: 필요한 파일들을 캐시에 저장
self.addEventListener('install', (event) => {
  console.log('[SW] Installing New Service Worker...');
  self.skipWaiting(); // 대기 상태 없이 즉시 활성화
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. 활성화 단계: 오래된 캐시 자동 삭제
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 모든 클라이언트 제어권 즉시 획득
  );
});

// 3. 요청 처리: 네트워크 우선 (Network First) 전략
// 인터넷이 연결되어 있으면 항상 최신 소스를 가져오고, 안 될 때만 캐시를 사용합니다.
self.addEventListener('fetch', (event) => {
  // 브라우저 확장 프로그램 등에서 발생하는 non-http 요청 무시
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공적으로 응답을 받으면 캐시 업데이트 후 반환
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 오프라인이거나 에러 시 캐시에서 찾아서 반환
        return caches.match(event.request);
      })
  );
});
