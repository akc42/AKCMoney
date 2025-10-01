

let version = 'money';
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(version).then(
      cache => cache.addAll([
        '/',
        '/index.html',
        '/style.css'
      ])
    )
  );
});

self.addEventListener('activate', (event) => {
  const deleteCashes = async () => {
    await self.clients.claim();
    const cacheNames = await caches.keys();
    const clients = await self.clients.matchAll();
    clients[0].postMessage(`Version ${version} is activating; Caches (${cacheNames.join(', ')}) will be trimmed.`);
    return await Promise.all(
      cacheNames.filter((cacheName) => cacheName !== version).map(cacheName => {
        //not current so delete
          if ('serviceworker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => registrations.map(r => r.unregister()));
          }
          caches.delete(cacheName);
        })
    );
  };
  event.waitUntil(deleteCashes());
});


let disabled = false;
async function responder(event) {
  const cache = await caches.open(version);
  let response = await cache.match(event.request);
  const networkResponsePromise = fetch(event.request);

  if (response) {
    /*
      We do have the a response in the cache which we are going to return, but we need to try to 
      refresh the cache with a more up to date value 
    */
    try {
      const networkResponse = await networkResponsePromise;
      await cache.put(event.request, networkResponse);
    } catch (e) {
      //do nothing here we can't update the cache and we have already responded.
    }
  } else {
    try {
      response = await networkResponsePromise;
      await cache.put(event.request, response.clone())
    } catch (e) {
      /*
        We are going to assume that the network failure was caused by a certificate error. In
        this case we are going to disable the service worker from responding until we have sorted 
        out the browser and this service worker is reloaded
      */
      disabled = true
      const clients = await self.clients.matchAll();
      clients[0].postMessage(`Service Worker Disabled Itself. Certificate Error Assumed`);
      response = new Response(null, { status: 403, statusText: 'Service Worker Failure' });
    }
  }
  return response;

};

self.addEventListener('fetch', (event) => {
  const requestURL = new URL(event.request.url);
  //service worker is only going to handle things for get requests, except this listed, and only if it hasn't failed ()
  if (!disabled && event.request.method.toLowerCase() === 'get' && !/^\/((api\/cache|api\/csv|certs|video)\/|api\/config|api\/videos)/i.test(requestURL.pathname)) {
    const responderPromise = responder(event);
    event.respondWith(responderPromise);
    event.waitUntil(responderPromise);
  }
});
//line below updated new version built
version =  'v4.3.2'