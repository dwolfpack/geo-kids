/* Merchant Caravan service worker — cache-first for the game's static files.
 * Bump VERSION whenever any cached file changes so old caches are dropped. */
var VERSION = "merchant-caravan-v1";
var FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./logic.js",
  "./ui.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./engine/engine.css",
  "./engine/engine.js",
  "../../geo-kids/js/countries-data.js"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("merchant-caravan-") === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(e.request).then(function (res) {
      if (res && res.ok && new URL(e.request.url).origin === location.origin) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    });
  }));
});
