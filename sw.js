// Nkwalink Emergency Dashboard - Service Worker
// Enables offline capability with caching strategy

const CACHE_NAME = 'nkwalink-v1';
const urlsToCache = [
  '/',
  '/dashboard.html',
  '/dashboard-logic.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (event.request.method === 'POST' && requestUrl.pathname.endsWith('/api/reports')) {
    event.respondWith(
      fetch(event.request.clone())
        .then(response => response)
        .catch(async () => {
          const body = await event.request.clone().json();
          await saveReportToIndexedDB(body);
          return new Response(JSON.stringify({ success: false, offlineQueued: true }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  if (requestUrl.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));
            return response;
          })
          .catch(() => caches.match(event.request).then(response => response || new Response('Offline - Data cached locally')));
      })
  );
});

// Background sync for offline submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'Nkwalink Alert', body: 'New emergency notification received.' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: data
    })
  );
});

async function saveReportToIndexedDB(report) {
  try {
    const db = await openDb();
    const tx = db.transaction('pendingReports', 'readwrite');
    tx.objectStore('pendingReports').put(report);
    return tx.complete || new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (error) {
    console.error('ServiceWorker DB save failed:', error);
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('NkwalinkDB', 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pendingReports')) {
        db.createObjectStore('pendingReports', { keyPath: 'id' });
      }
    };
  });
}

async function syncReports() {
  try {
    const db = new Promise((resolve, reject) => {
      const req = indexedDB.open('NkwalinkDB', 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('pendingReports')) {
          db.createObjectStore('pendingReports', { keyPath: 'id', autoIncrement: true });
        }
      };
    });

    const store = (await db).transaction(['pendingReports']).objectStore('pendingReports');
    const reports = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });

    for (const report of reports) {
      try {
        await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
      } catch (error) {
        console.log('Failed to sync report, will retry:', error);
      }
    }
  } catch (error) {
    console.log('Sync failed:', error);
    throw error;
  }
}
