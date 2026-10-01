"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Privacy-friendly, first-party visitor analytics (public pages only).
 * - No cookies, no IP stored, no fingerprinting: just random ids kept in this browser.
 * - Skips admin pages, signed-in admins and bots (the server tells us). Do-Not-Track / Global Privacy Control are
 *   ignored unless the admin switched "Respect visitors' Do Not Track" on; the server then answers track:false.
 * - Starts after the page is idle and sends tiny messages, so pages are not slowed down.
 * Renders nothing, so server rendering, hydration and the motion system are unaffected.
 */

const ENDPOINT = "/api/analytics/collect";
const STORE_KEY = "up_an";
const OFF_KEY = "up_an_off";
const SESSION_MS = 30 * 60 * 1000;
const IDLE_MS = 60 * 1000; // no touch / mouse / key / scroll for this long → stop counting time
const HEARTBEAT_MS = 20 * 1000;
const FILE_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|7z|csv|dwg|dxf|rvt|skp|txt)$/i;

type Store = { v: string; s: string; t: number };

function rid(len = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function readStore(): Store | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Store;
    if (j && typeof j.v === "string" && typeof j.s === "string" && typeof j.t === "number") return j;
  } catch {
    /* storage blocked or damaged */
  }
  return null;
}

function writeStore(s: Store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function isOff(): boolean {
  try {
    return sessionStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
}

function setOff() {
  try {
    sessionStorage.setItem(OFF_KEY, "1");
  } catch {
    /* ignore */
  }
}

function classifyLink(a: HTMLAnchorElement): { type: string; target: string } | null {
  const raw = a.getAttribute("href") || "";
  if (!raw || raw.startsWith("#") || /^javascript:/i.test(raw)) return null;
  if (/^tel:/i.test(raw)) return { type: "phone", target: raw };
  if (/^mailto:/i.test(raw)) return { type: "email", target: raw };
  let url: URL;
  try {
    url = new URL(raw, location.href);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");
  if (/(^|\.)(wa\.me|whatsapp\.com)$/i.test(host)) return { type: "whatsapp", target: url.href };
  if (url.origin === location.origin) {
    const isFile = a.hasAttribute("download") || FILE_EXT.test(url.pathname);
    return isFile ? { type: "download", target: url.pathname } : null;
  }
  return { type: "outbound", target: url.href };
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (typeof window === "undefined" || isOff()) return;
    if (document.documentElement.classList.contains("has-admin-edit-bar")) return;

    let stopped = false;
    let pvDone: Promise<boolean> = Promise.resolve(false);
    const pid = rid(16);
    let sid = "";
    let vid = "";

    let activeMs = 0;
    let scrollPct = 0;
    let lastInteraction = Date.now();
    let lastSentMs = -1;
    let lastSentScroll = -1;

    const send = (payload: object, beacon: boolean): Promise<Response | null> | void => {
      const body = JSON.stringify(payload);
      if (beacon && navigator.sendBeacon) {
        try {
          navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
          return;
        } catch {
          /* fall through to fetch */
        }
      }
      return fetch(ENDPOINT, {
        method: "POST",
        body,
        headers: { "Content-Type": "text/plain" },
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => null);
    };

    const computeScroll = () => {
      const doc = document.documentElement;
      const total = Math.max(doc.scrollHeight, document.body?.scrollHeight || 0);
      const seen = window.scrollY + window.innerHeight;
      if (total <= 0) return;
      const pct = Math.min(100, Math.round((seen / total) * 100));
      if (pct > scrollPct) scrollPct = pct;
    };

    // keep the 30-minute session alive while the visitor is genuinely active on a long page
    const touchSession = () => {
      if (!sid) return;
      writeStore({ v: vid, s: sid, t: Date.now() });
    };

    const flush = (beacon: boolean) => {
      if (stopped || !sid) return;
      const ms = Math.round(activeMs);
      if (ms === lastSentMs && scrollPct === lastSentScroll) return;
      lastSentMs = ms;
      lastSentScroll = scrollPct;
      void pvDone.then((ok) => {
        if (ok) send({ t: "pp", sid, pid, ms, sp: scrollPct }, beacon);
      });
    };

    // active time: counts only while the tab is visible and the visitor is doing something
    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastInteraction > IDLE_MS) return;
      activeMs += 1000;
    }, 1000);

    const bump = () => {
      lastInteraction = Date.now();
    };
    let raf = 0;
    const onScroll = () => {
      bump();
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        computeScroll();
      });
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush(true);
      else bump();
    };
    const onHide = () => flush(true);
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        if (Date.now() - lastInteraction <= IDLE_MS) touchSession();
        flush(false);
      }
    }, HEARTBEAT_MS);

    const onClick = (e: Event) => {
      const el = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!el || !sid) return;
      const hit = classifyLink(el);
      if (!hit) return;
      void pvDone.then((ok) => {
        if (ok) send({ t: "ev", sid, vid, type: hit.type, path: pathname, target: hit.target }, true);
      });
    };
    const onSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement | null;
      if (!form || !sid) return;
      const label = (form.getAttribute("aria-label") || form.className || "form").toString().slice(0, 60);
      void pvDone.then((ok) => {
        if (ok) send({ t: "ev", sid, vid, type: "form", path: pathname, label }, true);
      });
    };

    const start = () => {
      if (stopped) return;
      const now = Date.now();
      let store = readStore();
      const newVisitor = !store;
      if (!store) store = { v: rid(20), s: rid(20), t: now };
      const newSession = newVisitor || now - store.t > SESSION_MS;
      if (newSession && !newVisitor) store.s = rid(20);
      store.t = now;
      writeStore(store);
      sid = store.s;
      vid = store.v;

      const q = new URLSearchParams(location.search);
      const payload: Record<string, unknown> = {
        t: "pv",
        sid,
        vid,
        pid,
        path: pathname,
        nv: newVisitor || undefined,
        ns: newSession || undefined,
        tp: navigator.maxTouchPoints || 0,
        lang: (navigator.language || "").slice(0, 20),
      };
      if (newSession) {
        payload.ref = document.referrer ? document.referrer.slice(0, 300) : undefined;
        payload.w = Math.round(window.screen?.width || window.innerWidth);
        payload.h = Math.round(window.screen?.height || window.innerHeight);
        payload.us = q.get("utm_source")?.slice(0, 100) || undefined;
        payload.um = q.get("utm_medium")?.slice(0, 100) || undefined;
        payload.uc = q.get("utm_campaign")?.slice(0, 100) || undefined;
      } else {
        // later page in the same visit: the previous page of OUR site is not a new "source"
        payload.ref = undefined;
      }

      pvDone = (send(payload, false) as Promise<Response | null>).then(async (res) => {
        if (!res || !res.ok) return false;
        const j = (await res.json().catch(() => null)) as { track?: boolean } | null;
        if (j && j.track === false) {
          setOff(); // admin, bot (or Do-Not-Track, if the admin respects it): stop for this tab
          cleanup();
          return false;
        }
        return true;
      });

      // QR scans: a visit to /r/<catalogue id> that did not come from one of our own pages
      if (/^\/r\/[^/]+$/.test(pathname)) {
        let internal = false;
        try {
          internal = !!document.referrer && new URL(document.referrer).origin === location.origin;
        } catch {
          /* ignore */
        }
        if (!internal) {
          const label = pathname.split("/")[2];
          void pvDone.then((ok) => {
            if (ok) send({ t: "ev", sid, vid, type: "qr", path: pathname, label }, false);
          });
        }
      }

      window.setTimeout(computeScroll, 800);
      computeScroll();
    };

    const cleanup = () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(tick);
      window.clearInterval(heartbeat);
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("touchstart", bump);
      window.removeEventListener("pointerdown", bump);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", bump, { passive: true });
    window.addEventListener("keydown", bump);
    window.addEventListener("touchstart", bump, { passive: true });
    window.addEventListener("pointerdown", bump, { passive: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    document.addEventListener("submit", onSubmit, true);

    // wait until the browser is idle so tracking never competes with the page itself
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    const startTimer = ric ? ric(start, { timeout: 2500 }) : window.setTimeout(start, 600);

    return () => {
      // leaving this page (in-site navigation, or the component unmounting): send the final numbers
      if (!ric) window.clearTimeout(startTimer);
      else
        (window as Window & { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback?.(startTimer);
      computeScroll();
      flush(true);
      cleanup();
    };
  }, [pathname]);

  return null;
}
