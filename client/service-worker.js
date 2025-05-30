/**
    @licence
    Copyright (c) 2021 Alan Chandler, all rights reserved

    This file is part of PASv5, an implementation of the Patient Administration
    System used to support Accuvision's Laser Eye Clinics.

    PASv5 is licenced to Accuvision (and its successors in interest) free of royality payments
    and in perpetuity in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
    implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. Accuvision
    may modify, or employ an outside party to modify, any of the software provided that
    this modified software is only used as part of Accuvision's internal business processes.

    The software may be run on either Accuvision's own computers or on external computing
    facilities provided by a third party, provided that the software remains soley for use
    by Accuvision (or by potential or existing customers in interacting with Accuvision).
*/

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
version =  'v4.2.3'