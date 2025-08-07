const CACHE_NAME = "aurum-circle-v1";
const API_CACHE_NAME = "aurum-circle-api-v1";
const STATIC_CACHE_URLS = [
  "/",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/next.svg",
  "/globe.svg",
  "/file.svg",
  "/window.svg",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log("Service Worker: Clearing old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle API requests with cache-first strategy
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, return a basic error response
            return new Response("Offline", { status: 503 });
          });
      })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (url.protocol === "http:" || url.protocol === "https:") {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
    );
  }
});

// Handle push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New notification from Aurum Circle",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Explore",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icon-192x192.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Aurum Circle", options));
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    clients.openWindow("/discover");
  }

  // Focus the window if it's already open
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow("/");
    })
  );
});
