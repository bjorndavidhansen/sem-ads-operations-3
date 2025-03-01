import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache Google Ads API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/google-ads/v15'),
  new NetworkFirst({
    cacheName: 'google-ads-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      })
    ]
  })
);

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'image',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Cache operation templates
registerRoute(
  ({ url }) => url.pathname.includes('/templates'),
  new StaleWhileRevalidate({
    cacheName: 'operation-templates',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
);

// Background sync for failed operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'failed-operation') {
    event.waitUntil(retryFailedOperations());
  }
});

async function retryFailedOperations() {
  const failedOps = await getFailedOperations();
  for (const op of failedOps) {
    try {
      await retryOperation(op);
    } catch (error) {
      console.error('Failed to retry operation:', error);
    }
  }
}

async function getFailedOperations() {
  // Implementation depends on how failed operations are stored
  return [];
}

async function retryOperation(operation: any) {
  // Implementation depends on operation type
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Navigate to appropriate page based on notification data
      const data = event.notification.data;
      if (windowClients.length > 0) {
        windowClients[0].navigate(data.url);
        windowClients[0].focus();
      } else {
        clients.openWindow(data.url);
      }
    })
  );
});