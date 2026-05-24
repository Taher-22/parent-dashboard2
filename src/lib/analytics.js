// Frontend-only site analytics. Posts pageview events as rich embeds
// directly to a Discord webhook — no backend changes required.
//
// Privacy guardrails:
//   - No cookies. Session id lives in sessionStorage (dies with the tab).
//   - Honors browser Do Not Track.
//   - Honors a localStorage opt-out (`nq_no_track` = "1").
//   - Geo comes from a public IP→country API (ipapi.co) called from
//     the visitor's own browser — server never sees their IP.
//   - User agent parsed to family-level only (Chrome / Safari / iOS).
//   - Fire-and-forget. Network failures never reach the UI.

const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1507945441021657189/8AuvwGAtIwM81Gsw5Ns5ce6AzunLdwNkesktt0niJUo93bgePsUfhjuhZCEKnomgJSWf";

const SESSION_KEY = "nq_sid";
const OPTOUT_KEY  = "nq_no_track";

let cachedGeo  = null;
let geoFetched = false;
let lastPath   = null;
let lastStart  = 0;
let sessionIdCache = null;

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
      sessionIdCache = uuid.slice(0, 12);
      sessionStorage.setItem(SESSION_KEY, sessionIdCache);
    }
  } catch {
    sessionIdCache = String(Date.now()).slice(-8);
  }
  return sessionIdCache;
}

/* ────────────────────────── geo lookup ──────────────────────────────── */

async function fetchGeo() {
  if (geoFetched) return cachedGeo;
  geoFetched = true;
  try {
    const r = await fetch("https://ipapi.co/json/", { mode: "cors" });
    if (!r.ok) return null;
    const j = await r.json();
    cachedGeo = {
      country: j.country_code || null,   // e.g. "GB"
      city:    j.city          || null,
      region:  j.region        || null,
      org:     j.org           || null,  // ISP / network
    };
    return cachedGeo;
  } catch { return null; }
}

/* ────────────────────────── UA parsing (light) ───────────────────────── */

function parseUA() {
  const ua = typeof navigator !== "undefined" ? (navigator.userAgent || "") : "";

  let browser = "?";
  if      (/Edg\//.test(ua))       browser = "Edge";
  else if (/OPR\/|Opera\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua))    browser = "Chrome";
  else if (/Firefox\//.test(ua))   browser = "Firefox";
  else if (/Safari\//.test(ua))    browser = "Safari";

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

/* ────────────────────────── formatting helpers ───────────────────────── */

function flagEmoji(code) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

function fmtMs(ms) {
  if (!ms || ms < 1000) return "<1s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function locString(geo) {
  if (!geo) return "—";
  const flag  = flagEmoji(geo.country);
  const place = [geo.city, geo.region].filter(Boolean).join(", ");
  const tail  = [place, geo.country].filter(Boolean).join(" · ");
  return [flag, tail].filter(Boolean).join(" ");
}

/* ────────────────────────── webhook delivery ─────────────────────────── */

async function postEmbed(embed, useBeacon = false) {
  const body = JSON.stringify({ embeds: [embed] });
  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    try {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(WEBHOOK_URL, blob);
      return;
    } catch { /* fall through to fetch */ }
  }
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch { /* silent */ }
}

/* ────────────────────────── public API ───────────────────────────────── */

/**
 * Record one pageview. Posts an embed to the Discord webhook.
 * Includes the previous page + dwell time when present.
 */
export async function trackPageview(path, opts = {}) {
  if (isOptedOut()) return;
  if (typeof window === "undefined") return;
  if (!path) return;
  if (path === lastPath) return; // dedupe identical fires (React StrictMode etc)

  const now = Date.now();
  const previousPath     = lastPath;
  const previousDuration = previousPath ? now - lastStart : null;

  lastPath  = path;
  lastStart = now;

  const geo = await fetchGeo();
  const ua  = parseUA();
  const sid = getSessionId();

  const fields = [
    { name: "Page",     value: "`" + path + "`",                                              inline: false },
    { name: "Location", value: locString(geo),                                                inline: true  },
    { name: "Device",   value: `${ua.browser} · ${ua.os} · ${ua.device}`,                     inline: true  },
    { name: "Session",  value: "`" + sid + "`",                                               inline: true  },
  ];

  if (previousPath) {
    fields.push({
      name:   "Came from",
      value:  `\`${previousPath}\` (spent ${fmtMs(previousDuration)})`,
      inline: false,
    });
  } else if (document.referrer) {
    fields.push({ name: "Came from", value: document.referrer.slice(0, 200), inline: false });
  }
  if (geo?.org) {
    fields.push({ name: "Network", value: geo.org.slice(0, 80), inline: false });
  }
  if (opts.isParent) {
    fields.push({ name: "Identity", value: "🔑 logged-in parent", inline: true });
  }

  postEmbed({
    title:     "👁️ Page view",
    color:     opts.isParent ? 0x10b981 : 0x60a5fa, // green for parents, blue for guests
    fields,
    timestamp: new Date().toISOString(),
    footer:    { text: "neuroquest.tech" },
  });
}

/* On tab close: capture the current page's dwell time via sendBeacon. */
if (typeof window !== "undefined" && !window.__nqUnloadAttached) {
  window.__nqUnloadAttached = true;

  const sendCloseBeacon = () => {
    if (isOptedOut() || !lastPath) return;
    const dwell = Date.now() - lastStart;
    if (dwell < 1500) return; // ignore micro-views

    postEmbed({
      title: "🚪 Tab closed",
      color: 0x94a3b8,
      fields: [
        { name: "Last page",  value: "`" + lastPath + "`",   inline: false },
        { name: "Time spent", value: fmtMs(dwell),           inline: true  },
        { name: "Location",   value: locString(cachedGeo),   inline: true  },
        { name: "Session",    value: "`" + getSessionId() + "`", inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer:    { text: "neuroquest.tech" },
    }, /* useBeacon */ true);
  };

  // pagehide fires on all close paths (tab close, navigate-away, mobile background)
  window.addEventListener("pagehide", sendCloseBeacon);
  // Fallback for the browsers that prefer beforeunload
  window.addEventListener("beforeunload", sendCloseBeacon);
}

/* ────────────────────────── opt-out controls ─────────────────────────── */

export function disableAnalytics() {
  try { localStorage.setItem(OPTOUT_KEY, "1"); } catch {}
}
export function enableAnalytics() {
  try { localStorage.removeItem(OPTOUT_KEY); } catch {}
}
export function isAnalyticsEnabled() {
  return !isOptedOut();
}
