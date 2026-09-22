/* eslint-disable no-restricted-globals */
/**
 * Countdown 的轻量 Service Worker。
 *
 * 只做三件事，不引入任何构建插件（与 Next 16 Turbopack 零冲突）：
 *   1. install —— 预缓存 app shell（首页、manifest、图标）
 *   2. 导航请求 —— network-first，断网时回退到缓存的 index.html
 *   3. 其他同源静态资源 —— stale-while-revalidate
 *
 * 所有路径都从 `self.registration.scope` 推导，因此天然支持
 * GitHub Pages 项目页的 `/Countdown/` 子路径，不需要构建期替换占位符。
 */

const VERSION = 'v1';
const CACHE = `countdown-${VERSION}`;

// scope 形如 https://tickhaijun.github.io/Countdown/，结尾一定带斜杠
const SCOPE = self.registration.scope;

const SHELL = [
  SCOPE,
  `${SCOPE}index.html`,
  `${SCOPE}manifest.webmanifest`,
  `${SCOPE}icons/icon-192.png`,
  `${SCOPE}icons/icon-512.png`,
  `${SCOPE}icons/icon-512-maskable.png`,
  `${SCOPE}icons/apple-touch-icon.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // 单个资源失败不应让整个安装回滚，用 allSettled 兜住
      await Promise.allSettled(SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1) 导航：network-first，离线回退 app shell
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(`${SCOPE}index.html`, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(`${SCOPE}index.html`)) ||
            (await cache.match(SCOPE)) ||
            new Response('离线且没有缓存', { status: 503, headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
          );
        }
      })(),
    );
    return;
  }

  // 2) 静态资源：stale-while-revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => undefined);

      return cached || (await network) || new Response('', { status: 504 });
    })(),
  );
});
