const CACHE_NAME = 'precokg-cache-v5';

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './src/calculator.js',
  './manifest.json',
  './vendor/pico.min.css',
  './vendor/vue.global.js',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// Evento de Instalação: Pré-carrega todos os assets locais no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pré-carregando todos os assets locais...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Evento de Ativação: Limpa versões anteriores de cache e toma controle imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Removendo cache obsoleto:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento de Fetch: Estratégia Cache First (100% Offline)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET ou com esquemas que o cache não suporta
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Se não estiver em cache, busca na rede e guarda uma cópia no cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback offline caso a rede falhe e seja navegação
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
