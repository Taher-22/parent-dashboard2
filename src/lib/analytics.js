// Privacy-respecting site analytics that posts to our own backend so the
// data is queryable and historical. Replaces the previous Discord webhook.
//
// Privacy guardrails:
//   - No cookies. Session id lives in sessionStorage (dies with the tab).
//   - Geo lookup happens browser-side via ipapi.co — our server never sees
//     the raw IP for the purpose of geo. (It does see it for hashing, but
//     stores only a one-way truncated SHA-256.)
//   - UA parsed to family-level only (Chrome/Safari/iOS — no exact versions).
//   - Honors browser Do Not Track.
//   - Honors a localStorage opt-out (`nq_no_track` = "1").
//   - Fire-and-forget — every fetch is wrapped in try/catch.

const API_URL = "https://parent-dashboard2-production.up.railway.app";

const SESSION_KEY = "nq_sid";
const OPTOUT_KEY  = "nq_no_track";
const HEARTBEAT_MS = 30_000;
const MAX_TOTAL_MS = 30 * 60 * 1000; // stop heartbeating after 30 min idle

let cachedGeo  = null;
let geoFetched = false;
let sessionIdCache = null;
let currentPageviewId = null;
let pageStart  = 0;
let lastPath   = null;
let heartbeatTimer = null;

/* ────────────────────────── opt-out & session ────────────────────────── */

function isOptedOut() {
  if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return true;
  try { return localStorage.getItem(OPTOUT_KEY) === "1"; } catch { return false; }
}

function getSessionId() {
  if (sessionIdCache) return sessionIdCache;
  try {
    sessionIdCache = sessionStorage.getItem(SESSION_KEY);
    if (!sessionIdCache) {
      const uuid = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionIdCache = uuid.slice(0, 32);
      sessionStorage.setItem(SESSION_KEY, sessionIdCache);
    }
  } catch {
    sessionIdCache = `mem-${Date.now()}`;
  }
  return sessionIdCache;
}

/* ────────────────────────── geo & UA helpers ─────────────────────────── */

async function fetchGeo() {
  if (geoFetched) return cachedGeo;
  geoFetched = true;
  try {
    const r = await fetch("https://ipapi.co/json/", { mode: "cors" });
    if (!r.ok) return null;
    const j = await r.json();
    cachedGeo = {
      country: j.country_code || null,   // "GB", "US", etc.
      region:  j.region        || null,
      city:    j.city          || null,
      org:     j.org           || null,
    };
  } catch { /* offline / blocked / rate-limited */ }
  return cachedGeo;
}

function parseUA() {
  const ua = typeof navigator !== "undefined" ? (navigator.userAgent || "") : "";

  let browser = "?";
  if      (/Edg\//.test(ua))         browser = "Edge";
  else if (/OPR\/|Opera\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua))      browser = "Chrome";
  else if (/Firefox\//.test(ua))     browser = "Firefox";
  else if (/Safari\//.test(ua))      browser = "Safari";

  let os = "?";
  if      (/Windows NT/.test(ua))           os = "Windows";
  else if (/Macintosh|Mac OS X/.test(ua))   os = "macOS";
  else if (/iPhone|iPad|iPod/.test(ua))     os = "iOS";
  else if (/Android/.test(ua))              os = "Android";
  else if (/Linux/.test(ua))                os = "Linux";

  const device =
    /Mobi|Android|iPhone|iPod/.test(ua) ? "mobile" :
    /iPad|Tablet/.test(ua)              ? "tablet" :
    "desktop";

  return { browser, os, device };
}

/* ────────────────────────── heartbeat ────────────────────────────────── */

function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (!currentPageviewId) return;
    const elapsed = Date.now() - pageStart;
    if (elapsed > MAX_TOTAL_MS) { stopHeartbeat(); return; }
    fetch(`${API_URL}/api/analytics/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageviewId: currentPageviewId, durationMs: elapsed }),
      keepalive: true,
    }).catch(() => {});
  }, HEARTBEAT_MS);
}

function attachUnloadBeacon() {
  if (typeof window === "undefined" || window.__nqUnloadAttached) return;
  window.__nqUnloadAttached = true;
  const beacon = () => {
    if (!currentPageviewId) return;
    const body = JSON.stringify({
      pageviewId: currentPageviewId,
      durationMs: Date.now() - pageStart,
    });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(`${API_URL}/api/analytics/heartbeat`, blob);
    } else {
      fetch(`${API_URL}/api/analytics/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body, keepalive: true,
      }).catch(() => {});
    }
  };
  window.addEventListener("pagehide", beacon);
  window.addEventListener("beforeunload", beacon);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") beacon();
  });
}

/* ────────────────────────── public API ───────────────────────────────── */

/**
 * Record one pageview. Safe to call on every route change.
 * @param {string} path
 * @param {object} [opts]
 * @param {boolean} [opts.isParent]
 */
export async function trackPageview(path, opts = {}) {
  if (isOptedOut()) return;
  if (typeof window === "undefined") return;
  if (!path) return;
  if (path === lastPath && currentPageviewId) return; // dedupe identical fires
  lastPath = path;

  // Beacon out the previous page's final duration before starting a new view
  if (currentPageviewId) {
    const finalMs = Date.now() - pageStart;
    fetch(`${API_URL}/api/analytics/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageviewId: currentPageviewId, durationMs: finalMs }),
      keepalive: true,
    }).catch(() => {});
  }

  pageStart = Date.now();
  currentPageviewId = null;

  // Make sure we have geo + UA before sending (geo is cached after the first call)
  const [geo] = await Promise.all([fetchGeo()]);
  const ua = parseUA();

  try {
    const res = await fetch(`${API_URL}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        path,
        referrer: document.referrer || null,
        isParent: !!opts.isParent,
        geo,
        ua,
      }),
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    if (data?.id) {
      currentPageviewId = data.id;
      startHeartbeat();
      attachUnloadBeacon();
    }
  } catch {
    // Silent — analytics must never affect the UI
  }
}

/* ────────────────────────── opt-out controls ─────────────────────────── */

export function disableAnalytics() {
  try { localStorage.setItem(OPTOUT_KEY, "1"); } catch {}
  stopHeartbeat();
  currentPageviewId = null;
}
export function enableAnalytics() {
  try { localStorage.removeItem(OPTOUT_KEY); } catch {}
}
export function isAnalyticsEnabled() { return !isOptedOut(); }
