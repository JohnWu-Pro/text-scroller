'use strict';

//
// CAUTION:
// This script should be placed in the directory where the `index.html` resides, or its parent directory,
// so that the script location resolution can work as expected.
//
(() => {

const APP_ID = 'text-scroller'

//
// NOTE: Update the SW_VERSION would trigger the Service Worker being updated, and
// consequently, refresh the static-cachable-resources
//
const SW_VERSION = '1.0-RC3' // Should be kept in sync with the APP_VERSION

const CONTEXT_PATH = ((location) => {
  // NOTE: location.href points to the location of this script
  const contextPath = location.pathname.substring(0, location.pathname.lastIndexOf('/'))
  const locale = new URLSearchParams(location.search).get('locale')
  return locale ? contextPath + '/' + locale : contextPath
})(location)
// console.debug("[DEBUG] [ServiceWorker] CONTEXT_PATH: %s, location: %o", CONTEXT_PATH, location)

const INDEX_HTML = `${CONTEXT_PATH}/index.html`

const CACHE_NAME = 'cache.' + APP_ID + '.resources'

self.addEventListener('install', function(event) {
  console.debug("[DEBUG] Calling ServiceWorker[%o].install(%s) ...", SW_VERSION, JSON.stringify(event))

  event.waitUntil(
    cacheStaticResources()
      .catch(error => console.error(error))
  )

  // Trigger installed service worker to progress into the activating state
  self.skipWaiting()
})

self.addEventListener('activate', function(event) {
  console.debug("[DEBUG] Calling ServiceWorker[%o].activate(%s) ...", SW_VERSION, JSON.stringify(event))

  event.waitUntil((async () => {
    // Enable navigation preload if it's supported.
    // See https://developers.google.com/web/updates/2017/02/navigation-preload
    if(self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable()
    }

    // Tell the active service worker to take control of the page immediately.
    await self.clients.claim()

    await self.clients.matchAll().then((windowClients) => {
      for(const client of windowClients) {
        client.postMessage({type: 'SW_ACTIVATED', version: SW_VERSION});
      }
    })
  })())
})

self.addEventListener('fetch', function(event) {
  // console.debug("[DEBUG] Calling ServiceWorker.fetch(%o) ...", event.request)

  if(event.request.method !== 'GET') {
    // For non-GET requests, let the browser perform its default behaviour
    return
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const request = event.request
    const preferFetch = navigator.onLine && new URL(request.url).pathname === INDEX_HTML

    // First, try to get the resource from the cache
    let response = preferFetch ? null : await cache.match(request)
    if(response) {
      // console.debug("[DEBUG] Returning response from cache for %o ...", request)
      return response
    }

    // Next, try to use the preloaded response, if available
    response = await event.preloadResponse
    if(isCacheable(response)) {
      putIn(cache, request, response)
      // console.debug("[DEBUG] Returning preload-response for %o ...", request)
      return response
    }

    // Next, try to fetch the resource from the network
    response = await fetch(request)
    // response = await fetch(((request) => {
    //   const url = new URL(request.url)
    //   url.searchParams.set('swv', SW_VERSION)
    //   const {method, headers, body, mode, credentials, cache, redirect, referrer, referrerPolicy, integrity} = request
    //   const options = {method, headers, body, mode, credentials, cache, redirect, referrer, referrerPolicy, integrity}
    //   if(options.mode === 'navigate') options.mode = 'same-origin'
    //   console.debug("[DEBUG] Fetch options: %o", options)
    //   return new Request(url.href, options)
    // })(request))
    //   .catch(error => console.error("[ERROR] Error occurred while trying to fetch %o: %o", request, error))
    if(isCacheable(response)) {
      putIn(cache, request, response)
      // console.debug("[DEBUG] Returning fetched response for %o ...", request)
      return response
    }

    if(preferFetch) {
      // Fallback to cache, for the prefer-fetch resources
      // console.debug("[DEBUG] Trying to return response from cache for %o ...", request)
      return await cache.match(request)
    }

    // Return fetched non-cacheable response anyway
    // console.debug("[DEBUG] Returning fetched non-cacheable response for %o ...", request)
    return response
  })())
})

async function cacheStaticResources() {
  const cache = await caches.open(CACHE_NAME)

  const response = await fetch(INDEX_HTML)
  if(isCacheable(response)) {
    await cache.put(INDEX_HTML, response.clone())

    const indexHtml = await response.clone().text()
    const resources = resolveStaticCachableResources(indexHtml)
    // console.debug("[DEBUG] Resolved static cachable resources: %o", resources)

    return await cache.addAll(resources)
  } else {
    console.error("[ERROR] Failed in loading %s: %o", INDEX_HTML, response)
    throw "Failed in loading " + INDEX_HTML
  }
}

function isCacheable(response) {
  return 200 <= response?.status && response.status <= 205 && response.headers.has('Content-Type')
}

function resolveStaticCachableResources(indexHtml) {
  const resources = []
  Array(
    /<resource location="([\/\-\.\w]+(?:\?v=\w+)?)" data-cacheable>/g,
    /<link[^<>]+href="([\/\-\.\w]+\.css(?:\?v=\w+)?)" data-cacheable [^<>]+>/g,
    /<script[^<>]+src="([\/\-\.\w]+\.js(?:\?v=\w+)?)" data-cacheable [^<>]+>/g,
  ).forEach((regexp) => {
    for (const [_, ...match] of indexHtml.matchAll(regexp)) {
      resources.push(...match) // Append captured resource paths
    }
  })

  // Expects origin relative paths
  return resources.map(path => CONTEXT_PATH + '/' + path)
}

function putIn(cache, request, response) {
  response = response.clone()
  cache.delete(request, {ignoreSearch : true})
    .then(() => cache.put(request, response))
}

})()
