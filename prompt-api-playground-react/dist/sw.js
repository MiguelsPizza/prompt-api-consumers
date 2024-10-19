if (!self.define) {
  let e, s = {};
  const i = (
    i,
    n,
  ) => (i = new URL(i + ".js", n).href,
    s[i] || new Promise((s) => {
      if ("document" in self) {
        const e = document.createElement("script");
        e.src = i, e.onload = s, document.head.appendChild(e);
      } else e = i, importScripts(i), s();
    }).then(() => {
      let e = s[i];
      if (!e) throw new Error(`Module ${i} didn’t register its module`);
      return e;
    }));
  self.define = (n, t) => {
    const r = e || ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[r]) return;
    let o = {};
    const l = (e) => i(e, r),
      f = { module: { uri: r }, exports: o, require: l };
    s[r] = Promise.all(n.map((e) => f[e] || l(e))).then((e) => (t(...e), o));
  };
}
define(["./workbox-4d69892e"], function (e) {
  "use strict";
  self.addEventListener("message", (e) => {
    e.data && "SKIP_WAITING" === e.data.type && self.skipWaiting();
  }),
    e.clientsClaim(),
    e.precacheAndRoute([
      { url: "assets/index-BaevYD3k.css", revision: null },
      { url: "assets/index-BVoVj_Gh.js", revision: null },
      { url: "index.html", revision: "213fde77f5660b99a94669613f504663" },
      { url: "react.svg", revision: "f0402b67b6ce880f65666bb49e841696" },
      {
        url: "manifest.webmanifest",
        revision: "5ab00114fbbe1a5c66a935a4b29488f0",
      },
    ], {}),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      new e.NavigationRoute(e.createHandlerBoundToURL("index.html")),
    );
});
