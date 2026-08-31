/* Offline shell: network first, cache fallback. The app itself is state-in-localStorage,
   so a cached shell means the whole business works with no signal. */
const CACHE = 'lessonloop-shell-v2'

// Waits by default; the page asks it to take over once the user accepts the update.
self.addEventListener('install', () => {})
self.addEventListener('activate', (e) =>
  e.waitUntil(
    (async () => {
      // Drop old shells so a stale bundle can never win a cache lookup.
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  ),
)

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting()
})

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
