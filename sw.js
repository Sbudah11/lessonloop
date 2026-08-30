/* Offline shell: network first, cache fallback. The app itself is state-in-localStorage,
   so a cached shell means the whole business works with no signal. */
const CACHE = 'lessonloop-shell-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(() =>
        caches.match(req).then((hit) => hit ?? (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())),
      ),
  )
})
