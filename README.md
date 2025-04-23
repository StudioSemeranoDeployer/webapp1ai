WebApp Locale - MVP
Una Progressive Web App (PWA) che funziona principalmente in locale, permettendo agli utenti di creare e gestire note anche in assenza di connessione internet.
Caratteristiche

Funzionamento offline completo: Crea e visualizza note anche senza connessione
Archiviazione locale: Utilizza IndexedDB per salvare i dati sul dispositivo
Sincronizzazione intelligente: Sincronizza i dati quando la connessione è disponibile (simulata in questo MVP)
Installabile: Può essere installata come app sul dispositivo
Leggera: Minimo utilizzo di risorse esterne

Tecnologie utilizzate

HTML5, CSS3 e JavaScript vanilla
IndexedDB per l'archiviazione locale
Service Workers per il funzionamento offline
Web App Manifest per l'installazione

Come iniziare

Clona questo repository:
git clone https://github.com/tuousername/webapp-locale-mvp.git

Avvia un server locale. Per esempio con Python:
# Per Python 3
python -m http.server 8000

# Per Python 2
python -m SimpleHTTPServer 8000

Apri il browser all'indirizzo http://localhost:8000
Per testare le funzionalità offline, puoi:

Disconnettere il tuo computer da internet
Utilizzare la modalità "Offline" negli strumenti di sviluppo del browser

Funzionalità Chat AI
Questa webapp include ora una funzionalità di chat con intelligenza artificiale attraverso API:

Chat con API AI: Comunica con modelli AI come Claude attraverso le loro API
Archiviazione locale: Tutti i messaggi sono salvati in locale con IndexedDB
Funzionamento offline: La chat funziona anche senza internet con risposte di fallback
Impostazioni personalizzabili: Configura endpoint API, chiavi API e modelli
Privacy: Le chiavi API sono memorizzate solo sul tuo dispositivo

Come configurare la Chat AI:

Ottieni una chiave API da un provider di AI (come Anthropic)
Apri le "Impostazioni API" nella sezione Chat AI
Inserisci l'endpoint API, la tua chiave API e seleziona il modello
Salva le impostazioni

Supporto per provider API:
L'implementazione attuale supporta:

Anthropic Claude API: Compatibile con Claude 3.7 Sonnet, Claude 3 Opus, ecc.
Altre API: Puoi modificare l'endpoint per utilizzare altri provider API compatibili

Struttura del progetto
webapp-locale-mvp/
├── index.html          # Pagina principale dell'applicazione
├── manifest.json       # Manifest per l'installazione come PWA
├── service-worker.js   # Service worker per il funzionamento offline
├── icons/              # Icone per l'app
│   ├── favicon.ico
│   ├── icon-192x192.png
│   └── icon-512x512.png
└── README.md           # Questa documentazione
Prossimi passi
Questo è un MVP (Minimum Viable Product). Per un'applicazione completa, considera di implementare:

Backend per sincronizzazione reale (Node.js, Firebase, ecc.)
Autenticazione utenti
Miglioramenti UI/UX con framework modern (React, Vue.js, ecc.)
Funzionalità aggiuntive (categorie, ricerca, condivisione)
Test automatizzati

Licenza
MIT
