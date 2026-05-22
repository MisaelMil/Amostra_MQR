const CACHE_NAME = 'mqr-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instala o service worker e guarda os assets em cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Ativa o service worker e limpa caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia: cache-first para assets estáticos, com fallback para rede
self.addEventListener('fetch', (e) => {
  // Ignore cross-origin requests
  if (new URL(e.request.url).origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((networkRes) => {
          // Atualiza o cache com a resposta da rede
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkRes.clone());
            return networkRes;
          });
        })
        .catch(() => {
          // Se for navegação, retornar index.html como fallback
          if (e.request.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});