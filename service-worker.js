const CACHE_NAME = 'webapp-locale-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Installazione e cache dei file statici
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Pulizia delle vecchie cache quando si attiva una nuova versione
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Strategia cache-first per le richieste di risorse
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - ritorna la risposta dalla cache
        if (response) {
          return response;
        }

        // Clona la richiesta. Una richiesta è un flusso e può essere consumata una sola volta
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Controlla se abbiamo ricevuto una risposta valida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona la risposta. Una risposta è un flusso e può essere consumata una sola volta
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Se la fetch fallisce (es. offline), prova a servire la pagina offline
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          // Per le richieste non HTML, ritorna un errore silenzioso
          return new Response('', {
            status: 408,
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

// Gestione degli eventi di sincronizzazione in background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes());
  }
});

// Funzione per sincronizzare le note (qui è simulata)
function syncNotes() {
  return new Promise((resolve, reject) => {
    // In un'app reale, qui si implementerebbe la logica di sincronizzazione
    console.log('Sincronizzazione delle note in background');
    resolve();
  });
}
