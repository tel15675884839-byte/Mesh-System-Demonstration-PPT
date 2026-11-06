"use strict";

const CACHE_NAME = "mesh-presentation-offline-v20261106-performance-r3";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./pages/opening.html",
  "./pages/overview.html",
  "./pages/mesh.html",
  "./pages/reliability.html",
  "./pages/response.html",
  "./pages/distance.html",
  "./pages/battery.html",
  "./pages/installation.html",
  "./pages/installation-cost.html",
  "./pages/capacity.html",
  "./pages/product-showcase.html",
  "./css/style.css",
  "./css/welcome.css",
  "./css/page-base.css",
  "./css/pages/opening.css",
  "./css/pages/overview.css",
  "./css/pages/mesh.css",
  "./css/pages/reliability.css",
  "./css/pages/reliability-animations.css",
  "./css/pages/response.css",
  "./css/pages/distance.css",
  "./css/pages/battery.css",
  "./css/pages/installation.css",
  "./css/pages/capacity.css",
  "./css/pages/product-showcase.css",
  "./js/fixed-stage.js",
  "./js/cyber-page-background.js",
  "./js/app.js",
  "./js/welcome.js",
  "./js/page-messaging.js",
  "./js/opening-page.js",
  "./js/mesh-page.js",
  "./js/pages/reliability-animations.js",
  "./js/response-page.js",
  "./js/distance-page.js",
  "./js/capacity-page.js",
  "./js/product-showcase.js",
  "./js/mesh-scene-player.js",
  "./assets/branding/icon.png",
  "./assets/branding/logo-long.png",
  "./assets/distance-map-bg.png",
  "./assets/images/hero-1.JPG",
  "./assets/images/hero-2.JPG",
  "./assets/images/hero-3.JPG",
  "./assets/images/mesh2D.png",
  "./assets/images/fast-f-transparent.png",
  "./assets/images/System Capacity.png",
  "./assets/images/installation-cost-comparison-2560.webp",
  "./assets/images/wiring.jpg",
  "./assets/images/wireless.jpg",
  "./assets/images/products/all.png",
  "./assets/images/products/wireless loop expansion card.png",
  "./assets/images/products/node.png",
  "./assets/images/products/beam-detector.png",
  "./assets/images/products/smoke.png",
  "./assets/images/products/17450.png",
  "./assets/images/products/mcp.png",
  "./assets/images/products/17450mcp.png",
  "./assets/images/products/wireless-av-alarm.png",
  "./assets/images/products/io module.png",
  "./assets/icons/cie.svg",
  "./assets/icons/heat-mult.svg",
  "./assets/icons/io-module.svg",
  "./assets/icons/leader-node.svg",
  "./assets/icons/loop expansion card.svg",
  "./assets/icons/mcp.svg",
  "./assets/icons/node.svg",
  "./assets/icons/panel.svg",
  "./assets/icons/smoke.svg",
  "./assets/icons/sounder.svg",
  "./assets/icons/wired_vs_wireless.svg",
  "./assets/mesh-states/blocked.json",
  "./assets/mesh-states/normal.json",
  "./assets/mesh-states/opening.json",
  "./assets/mesh-states/recovery-1.json",
  "./Mesh System Demonstration/three.min.js",
  "./Mesh System Demonstration/OrbitControls.js",
  "./Mesh System Demonstration/link-effects.js",
  "./Mesh System Demonstration/assets/icons/heat-mult.svg",
  "./Mesh System Demonstration/assets/icons/io-module.svg",
  "./Mesh System Demonstration/assets/icons/mcp.svg",
  "./Mesh System Demonstration/assets/icons/node.svg",
  "./Mesh System Demonstration/assets/icons/smoke.svg",
  "./Mesh System Demonstration/assets/icons/sounder.svg"
];

const STARTUP_URLS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./css/style.css", "./css/welcome.css", "./css/page-base.css",
  "./js/fixed-stage.js", "./js/app.js", "./js/welcome.js",
  "./js/cyber-page-background.js", "./js/page-messaging.js"
];

async function cacheOfflinePresentation() {
  const cache = await caches.open(CACHE_NAME);
  const reload = url => new Request(url, { cache: "reload" });
  await cache.addAll(STARTUP_URLS.map(reload));
  const remaining = PRECACHE_URLS.filter(url => !STARTUP_URLS.includes(url));
  // Bound background downloads so the current page's requests can make progress.
  for (let index = 0; index < remaining.length; index += 4) {
    await cache.addAll(remaining.slice(index, index + 4).map(reload));
  }
  // Activation, and therefore Offline ready, still means the whole deck is cached.
  return self.skipWaiting();
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    cacheOfflinePresentation()
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          return key === CACHE_NAME ? undefined : caches.delete(key);
        }));
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then(function (cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.match("./index.html");
      }).then(function (cachedFallback) {
        if (cachedFallback) {
          return cachedFallback;
        }

        return fetch(request);
      }).catch(function () {
        return caches.match("./index.html");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(function (networkResponse) {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
