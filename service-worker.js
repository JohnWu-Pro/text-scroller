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
// consequently, triggers the static-cachable-resources being refreshed.
//
const SW_VERSION = '1.0-RC1' // Should be kept in sync with APP_VERSION

const CONTEXT_PATH = (() => {
  // NOTE: location.href points to the location of this script
  const contextPath = location.pathname.substring(0, location.pathname.lastIndexOf('/'))
  const locale = new URLSearchParams(location.search).get('locale')
  return locale ? contextPath + '/' + locale : contextPath
})()
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
  })())
})

self.addEventListener('fetch', function(event) {
  // console.debug("[DEBUG] Calling ServiceWorker.fetch(%o) ...", event.request)

  if(event.request.method !== 'GET') {
    // For non-GET requests, let the browser do its default thing
    return
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const request = event.request
    const url = new URL(request.url)
    const preferFetch = navigator.onLine && url.pathname === INDEX_HTML

    // First, try to get the resource from the cache
    // console.debug("[DEBUG] Checking cache for %o ...", request)
    let response = preferFetch ? null : await cache.match(request)
    if(response) {
      return response
    }

    // Next, try to use the preloaded response, if available
    // console.debug("[DEBUG] Checking preloaded response for %o ...", request)
    response = await event.preloadResponse
    if(isCacheable(response)) {
      putIn(cache, request, response)
      return response
    }

    // Next, try to fetch the resource from the network
    // console.debug("[DEBUG] Trying to fetch and cache %o ...", request)
    url.searchParams.set('swv', SW_VERSION)
    response = await fetch(new Request(url.href, request))
    if(isCacheable(response)) {
      putIn(cache, request, response)
      return response
    }

    if(preferFetch) {
      // Fallback to cache
      return await cache.match(request)
    }

    // Return fetched response anyway
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
  return 200 <= response?.status && response.status < 300 && response.headers.has('Content-Type')
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

  return [ // Expects origin relative paths
    ...resources.map(path => CONTEXT_PATH + '/' + path),
  ]
}

function putIn(cache, request, response) {
  response = response.clone()
  cache.delete(request, {ignoreSearch : true})
    .then(() => cache.put(request, response))
}

})()
