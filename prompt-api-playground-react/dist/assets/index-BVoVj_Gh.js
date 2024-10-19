import { marked as N } from "https://cdn.jsdelivr.net/npm/marked@13.0.3/lib/marked.esm.js";
import F from "https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.es.mjs";
(function () {
  const m = document.createElement("link").relList;
  if (m && m.supports && m.supports("modulepreload")) return;
  for (const e of document.querySelectorAll('link[rel="modulepreload"]')) l(e);
  new MutationObserver((e) => {
    for (const t of e) {
      if (t.type === "childList") {
        for (const r of t.addedNodes) {
          r.tagName === "LINK" && r.rel === "modulepreload" && l(r);
        }
      }
    }
  }).observe(document, { childList: !0, subtree: !0 });
  function f(e) {
    const t = {};
    return e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      e.crossOrigin === "use-credentials"
        ? t.credentials = "include"
        : e.crossOrigin === "anonymous"
        ? t.credentials = "omit"
        : t.credentials = "same-origin",
      t;
  }
  function l(e) {
    if (e.ep) return;
    e.ep = !0;
    const t = f(e);
    fetch(e.href, t);
  }
})();
(async () => {
  const y = document.getElementById("error-message"),
    m = document.getElementById("cost"),
    f = document.getElementById("prompt-area"),
    l = document.getElementById("problematic-area"),
    e = document.getElementById("prompt-input"),
    t = document.getElementById("response-area"),
    r = document.getElementById("copy-link-button"),
    P = document.getElementById("reset-button"),
    p = document.querySelector("small"),
    b = document.querySelector("details div"),
    E = document.querySelector("form"),
    v = document.getElementById("max-tokens"),
    x = document.getElementById("temperature"),
    w = document.getElementById("tokens-left"),
    L = document.getElementById("tokens-so-far"),
    C = document.getElementById("top-k"),
    g = document.getElementById("session-temperature"),
    u = document.getElementById("session-top-k");
  t.style.display = "none";
  let a = null;
  if (!self.ai || !self.ai.languageModel) {
    y.style.display = "block",
      y.innerHTML =
        `Your browser doesn't support the Prompt API. If you're on Chrome, join the <a href="https://developer.chrome.com/docs/ai/built-in#get_an_early_preview">Early Preview Program</a> to enable it.`;
    return;
  }
  f.style.display = "block", r.style.display = "none", p.style.display = "none";
  const k = async (n = !1) => {
      r.style.display = "none",
        p.style.display = "none",
        l.style.display = "none";
      const o = e.value.trim();
      if (!o) return;
      t.style.display = "block";
      const s = document.createElement("h3");
      s.classList.add("prompt", "speech-bubble"),
        s.textContent = o,
        t.append(s);
      const i = document.createElement("p");
      i.classList.add("response", "speech-bubble"),
        i.textContent = "Generating response...",
        t.append(i);
      let c = "";
      try {
        a || (await d(), h());
        const I = await a.promptStreaming(o);
        for await (const M of I) {
          c = M.trim(), i.innerHTML = F.sanitize(N.parse(c)), b.innerText = c;
        }
      } catch (I) {
        i.textContent = `Error: ${I.message}`;
      } finally {
        n &&
        (l.style.display = "block",
          l.querySelector("#problem").innerText = decodeURIComponent(n).trim()),
          r.style.display = "inline-block",
          p.style.display = "inline",
          h();
      }
    },
    h = () => {
      if (!a) return;
      const {
        maxTokens: n,
        temperature: o,
        tokensLeft: s,
        tokensSoFar: i,
        topK: c,
      } = a;
      v.textContent = new Intl.NumberFormat("en-US").format(n),
        x.textContent = new Intl.NumberFormat("en-US", {
          maximumSignificantDigits: 5,
        }).format(o),
        w.textContent = new Intl.NumberFormat("en-US").format(s),
        L.textContent = new Intl.NumberFormat("en-US").format(i),
        C.textContent = new Intl.NumberFormat("en-US").format(c);
    },
    S = new URLSearchParams(location.search),
    B = S.get("prompt"),
    U = S.get("highlight");
  B && (e.value = decodeURIComponent(B).trim(), await k(U)),
    E.addEventListener("submit", async (n) => {
      n.preventDefault(), await k();
    }),
    e.addEventListener("keydown", (n) => {
      n.key === "Enter" && !n.shiftKey &&
        (n.preventDefault(), E.dispatchEvent(new Event("submit")));
    }),
    e.addEventListener("focus", () => {
      e.select();
    }),
    e.addEventListener("input", async () => {
      const n = e.value.trim();
      if (!n) return;
      const o = await a.countPromptTokens(n);
      o && (m.textContent = `${o} token${o === 1 ? "" : "s"}`);
    });
  const T = () => {
    t.style.display = "none",
      t.innerHTML = "",
      b.innerHTML = "",
      l.style.display = "none",
      r.style.display = "none",
      p.style.display = "none",
      v.textContent = "",
      x.textContent = "",
      w.textContent = "",
      L.textContent = "",
      C.textContent = "",
      e.focus();
  };
  P.addEventListener("click", () => {
    e.value = "", T(), a.destroy(), a = null, d();
  }),
    r.addEventListener("click", () => {
      const n = e.value.trim();
      if (!n) return;
      const o = new URL(self.location.href);
      o.searchParams.set("prompt", encodeURIComponent(n));
      const s = getSelection().toString() || "";
      s
        ? o.searchParams.set("highlight", encodeURIComponent(s))
        : o.searchParams.delete("highlight"),
        navigator.clipboard.writeText(o.toString()).catch((c) => {
          alert("Failed to copy link: ", c);
        });
      const i = r.textContent;
      r.textContent = "Copied",
        setTimeout(() => {
          r.textContent = i;
        }, 3e3);
    });
  const d = async () => {
    a = await self.ai.languageModel.create({
      temperature: Number(g.value),
      topK: Number(u.value),
    }),
      T(),
      h();
  };
  if (
    g.addEventListener("input", async () => {
      await d();
    }),
      u.addEventListener("input", async () => {
        await d();
      }),
      !a
  ) {
    const { defaultTopK: n, maxTopK: o, defaultTemperature: s } = await self.ai
      .languageModel.capabilities();
    g.value = s, u.value = n, u.max = o, await d();
  }
})();
