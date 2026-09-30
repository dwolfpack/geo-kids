/* Sky Rescue service worker — network-first, with an offline copy of the game's files.
 * Bump VERSION whenever any cached file changes so old caches are dropped. */
var VERSION = "sky-rescue-v6";
var FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./vendor/three.module.min.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./engine/engine.css",
  "./engine/engine.js",
  "../../geo-kids/js/countries-data.js"
];
// Network first: an online player always gets the newest game; the cache is only the offline fallback.
// ("no-cache" makes the browser revalidate with the site instead of reusing a stale HTTP-cached copy.)
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  var prefix = VERSION.replace(/v\d+$/, "");
  e.waitUntil(caches.keys().then(function (keys) {
    var old = keys.filter(function (k) { return k.indexOf(prefix) === 0 && k !== VERSION; });
    return Promise.all(old.map(function (k) { return caches.delete(k); })).then(function () { return old.length; });
  }).then(function (upgraded) {
    return self.clients.claim().then(function () {
      // Replacing an older version: reload any open game tabs so they switch to the new build right away.
      if (!upgraded) return;
      return self.clients.matchAll({ type: "window" }).then(function (list) {
        list.forEach(function (c) { if (c.navigate) c.navigate(c.url).catch(function () {}); });
      });
    });
  }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var sameOrigin = new URL(e.request.url).origin === location.origin;
  e.respondWith(fetch(e.request, sameOrigin ? { cache: "no-cache" } : undefined).then(function (res) {
    if (res && res.ok && sameOrigin) {
      var copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true });
  }));
});
