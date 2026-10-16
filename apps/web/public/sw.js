/*
 * Service worker: приложение открывается с экрана «Домой» мгновенно и без сети
 * показывает оболочку. Данные (/api) всегда идут в сеть и не кэшируются —
 * они личные и должны быть свежими.
 */
const CACHE = 'gym-shell-v1'
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  // Страницы: сначала сеть (свежая версия), без сети — сохранённая оболочка.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put('/', copy))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // Файлы сборки с хешем в имени не меняются — берём из кэша. Остальная
  // статика (иконки, манифест) отдаётся из кэша и в фоне обновляется.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached && url.pathname.startsWith('/assets/')) return cached
      const network = fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return res
      })
      if (!cached) return network
      network.catch(() => undefined)
      return cached
    }),
  )
})
