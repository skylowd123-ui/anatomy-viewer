/*
 * ANATOMICA's small, dependency-free service worker.
 *
 * The build finalizer replaces the cache version and the precache marker. The
 * fallback entries keep this file valid when it is inspected or served from a
 * static copy before a production build has run.
 */
const CACHE_VERSION = '__PWA_CACHE_VERSION__'
const STATIC_CACHE = `anatomica-${CACHE_VERSION}-static`
const FONT_CACHE = `anatomica-${CACHE_VERSION}-fonts`
const MODEL_CACHE = `anatomica-${CACHE_VERSION}-models`
const MODEL_CACHE_LIMIT = 400

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  /* __PWA_PRECACHE_ENTRIES__ */
]

const scopeUrl = () => new URL(self.registration.scope)

function pathWithinScope(url) {
  const scope = scopeUrl()
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return null
  return url.pathname.slice(scope.pathname.length).replace(/^\/+/, '')
}

function isModelRequest(url) {
  const path = pathWithinScope(url)
  return Boolean(path && path.startsWith('models/'))
}

function isLocalStaticRequest(request, url) {
  const path = pathWithinScope(url)
  if (!path) return false
  if (path === '' || path === 'index.html' || path === 'manifest.webmanifest') return true
  if (/^(assets|draco|icons|fonts)\//.test(path)) return true
  return ['script', 'style', 'worker', 'image', 'font', 'manifest'].includes(request.destination)
}

function isFontRequest(request, url) {
  return url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    (pathWithinScope(url) || '').startsWith('fonts/') ||
    request.destination === 'font'
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document'
}

function canCache(response) {
  return response && (response.ok || response.type === 'opaque')
}

async function trimModelCache(cache) {
  const requests = await cache.keys()
  const excess = requests.length - MODEL_CACHE_LIMIT
  if (excess <= 0) return

  // Cache.keys() is insertion ordered. Deleting from the front makes the
  // model cache a simple rolling window while keeping the newest 400 entries.
  await Promise.all(requests.slice(0, excess).map(request => cache.delete(request)))
}

async function cacheModelResponse(request, response) {
  if (!canCache(response)) return
  const cache = await caches.open(MODEL_CACHE)
  await cache.put(request, response.clone())
  await trimModelCache(cache)
}

async function networkFirstModel(request) {
  try {
    const response = await fetch(request)
    await cacheModelResponse(request, response)
    // A successful network response always wins. Cached models are only an
    // offline fallback, so an updated GLB can never be hidden by old bytes.
    return response
  } catch {
    const cached = await caches.open(MODEL_CACHE).then(cache => cache.match(request))
    return cached || Response.error()
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request, { ignoreSearch: true })
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (canCache(response)) await cache.put(request, response.clone())
    return response
  } catch {
    return Response.error()
  }
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(STATIC_CACHE)
  try {
    const response = await fetch(request)
    if (canCache(response)) await cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true })
    return cached || cache.match(new URL('./index.html', self.registration.scope)) || Response.error()
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  const currentCaches = new Set([STATIC_CACHE, FONT_CACHE, MODEL_CACHE])
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('anatomica-') && !currentCaches.has(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (isModelRequest(url)) {
    event.respondWith(networkFirstModel(request))
    return
  }
  if (isFontRequest(request, url)) {
    // Google Fonts are cross-origin and are learned on the first online visit;
    // local font files, if supplied later, use the same offline cache.
    event.respondWith(cacheFirst(request, FONT_CACHE))
    return
  }
  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request))
    return
  }
  if (isLocalStaticRequest(request, url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  }
})
