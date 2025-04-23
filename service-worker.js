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
// IndexedDB per le impostazioni API e la cronologia chat
function initializeChatDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChatDB', 1);
    
    request.onerror = function(event) {
      console.error("Errore nell'apertura del database Chat:", event.target.errorCode);
      reject(event.target.errorCode);
    };
    
    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      
      // Store per le impostazioni API
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
      
      // Store per la cronologia delle chat
      if (!db.objectStoreNames.contains('messages')) {
        const messagesStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
        messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      resolve(db);
    };
  });
}

// Funzione per salvare le impostazioni API
function saveAPISettings(endpoint, apiKey, model) {
  return initializeChatDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const settings = {
        id: 'api-settings',
        endpoint: endpoint,
        apiKey: apiKey,
        model: model,
        timestamp: new Date().getTime()
      };
      
      const request = store.put(settings);
      
      request.onsuccess = function() {
        resolve(true);
      };
      
      request.onerror = function(event) {
        reject(event.target.error);
      };
    });
  });
}

// Funzione per caricare le impostazioni API
function loadAPISettings() {
  return initializeChatDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('api-settings');
      
      request.onsuccess = function(event) {
        if (event.target.result) {
          resolve(event.target.result);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = function(event) {
        reject(event.target.error);
      };
    });
  });
}

// Funzione per salvare un messaggio nella cronologia
function saveMessage(message) {
  return initializeChatDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      
      const request = store.add(message);
      
      request.onsuccess = function(event) {
        resolve(event.target.result);
      };
      
      request.onerror = function(event) {
        reject(event.target.error);
      };
    });
  });
}

// Funzione per caricare la cronologia dei messaggi
function loadMessages() {
  return initializeChatDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'next');
      
      const messages = [];
      
      request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          resolve(messages);
        }
      };
      
      request.onerror = function(event) {
        reject(event.target.error);
      };
    });
  });
}

// Aggiungi un messaggio all'interfaccia
function addMessageToUI(content, isUser) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');
  messageElement.className = `message ${isUser ? 'user' : 'ai'}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = content;
  
  messageElement.appendChild(messageContent);
  messagesContainer.appendChild(messageElement);
  
  // Scrolla fino all'ultimo messaggio
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Salva il messaggio nel database
  saveMessage({
    content: content,
    isUser: isUser,
    timestamp: new Date().getTime()
  });
}

// Funzione per inviare un messaggio all'API
async function sendMessageToAI(message) {
  try {
    // Carica le impostazioni API
    const settings = await loadAPISettings();
    
    if (!settings || !settings.apiKey) {
      addMessageToUI("Per favore configura le impostazioni API prima di inviare messaggi.", false);
      return;
    }
    
    // Aggiungi un indicatore di caricamento
    const sendButton = document.getElementById('send-message');
    const loadingIndicator = document.createElement('span');
    loadingIndicator.className = 'loading';
    sendButton.disabled = true;
    sendButton.appendChild(loadingIndicator);
    
    // Prepara la richiesta per l'API di Claude/Anthropic
    const response = await fetch(settings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 1000,
        messages: [
          { role: "user", content: message }
        ]
      })
    });
    
    // Rimuovi l'indicatore di caricamento
    sendButton.removeChild(loadingIndicator);
    sendButton.disabled = false;
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Errore nella richiesta API');
    }
    
    const data = await response.json();
    const aiResponse = data.content?.[0]?.text || "Mi dispiace, non sono riuscito a elaborare una risposta.";
    
    // Aggiungi la risposta dell'AI all'interfaccia
    addMessageToUI(aiResponse, false);
    
  } catch (error) {
    console.error('Errore durante l'invio del messaggio:', error);
    addMessageToUI(`Errore durante la comunicazione con l'API: ${error.message}`, false);
    
    // Rimuovi l'indicatore di caricamento in caso di errore
    const sendButton = document.getElementById('send-message');
    const loadingIndicator = sendButton.querySelector('.loading');
    if (loadingIndicator) {
      sendButton.removeChild(loadingIndicator);
      sendButton.disabled = false;
    }
  }
}

// Funzione di fallback per ambienti offline
function offlineAIResponse(message) {
  // Risposte semplici per ambienti offline
  const responses = [
    "Mi dispiace, sei offline. Salverò il tuo messaggio e proverò a inviarlo quando tornerai online.",
    "Sembra che non ci sia connessione internet. Il tuo messaggio è stato salvato localmente.",
    "Modalità offline attiva. I tuoi messaggi verranno sincronizzati appena possibile."
  ];
  
  // Scegli una risposta casuale
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  addMessageToUI(randomResponse, false);
}

// Inizializzazione dell'interfaccia chat
document.addEventListener('DOMContentLoaded', async function() {
  // Carica le impostazioni API salvate
  const settings = await loadAPISettings();
  if (settings) {
    document.getElementById('api-endpoint').value = settings.endpoint;
    document.getElementById('api-key').value = settings.apiKey;
    document.getElementById('model-selection').value = settings.model;
  }
  
  // Carica la cronologia dei messaggi
  const messages = await loadMessages();
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = ''; // Rimuovi il messaggio di benvenuto iniziale
  
  if (messages.length > 0) {
    messages.forEach(message => {
      addMessageToUI(message.content, message.isUser);
    });
  } else {
    // Aggiungi un messaggio di benvenuto se non c'è cronologia
    addMessageToUI("Ciao! Come posso aiutarti oggi?", false);
  }
  
  // Gestore per il pulsante di invio messaggi
  document.getElementById('send-message').addEventListener('click', function() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (message) {
      // Aggiungi il messaggio dell'utente all'interfaccia
      addMessageToUI(message, true);
      input.value = '';
      
      // Invia il messaggio all'AI se online, altrimenti usa il fallback
      if (navigator.onLine) {
        sendMessageToAI(message);
      } else {
        offlineAIResponse(message);
      }
    }
  });
  
  // Permetti l'invio con Invio (ma Shift+Invio va a capo)
  document.getElementById('chat-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      document.getElementById('send-message').click();
    }
  });
  
  // Gestore per il salvataggio delle impostazioni API
  document.getElementById('save-api-settings').addEventListener('click', async function() {
    const endpoint = document.getElementById('api-endpoint').value.trim();
    const apiKey = document.getElementById('api-key').value.trim();
    const model = document.getElementById('model-selection').value;
    
    if (endpoint && apiKey) {
      try {
        await saveAPISettings(endpoint, apiKey, model);
        alert('Impostazioni API salvate con successo!');
      } catch (error) {
        console.error('Errore nel salvataggio delle impostazioni:', error);
        alert('Errore nel salvataggio delle impostazioni.');
      }
    } else {
      alert('Per favore compila tutti i campi delle impostazioni API.');
    }
  });
});
