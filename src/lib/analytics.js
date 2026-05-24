// Anonymous, privacy-respecting client-side analytics.
//
// - Session id lives in sessionStorage (cleared when the tab closes) so we
//   never persist anything cross-session. No cookies.
// - Honors browser Do Not Track. If the user opts out, we never call the API.
// - Tracker is fire-and-forget. Failures are swallowed so analytics outages
//   can't degrade the actual app UX.

const API_URL = "https://parent-dashboard2-production.up.railway.app";

const SESSION_KEY = "nq_sid";
const OPTOUT_KEY  = "nq_no_track";   // user-level opt-out via localStorage
const HEARTBEAT_MS = 30_000;
const MAX_HEARTBEAT_TOTAL_MS = 30 * 60 * 1000; // stop pinging after 30 min idle

let currentPageviewId = null;
let pageStart         = 0;
let lastPath          = null;
let heartbeatTimer    = null;

function isOptedOut() {
  if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return true;
  try {
    return localStorage.getItem(OPTOUT_KEY) === "1";
  } catch {
    return false;
  }
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 64);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `mem-${Date.now()}`;
  }
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (!currentPageviewId) return;
    const elapsed = Date.now() - pageStart;
    if (elapsed > MAX_HEARTBEAT_TOTAL_MS) {
      stopHeartbeat();
      return;
    }
    fetch(`${API_URL}/api/analytics/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageviewId: currentPageviewId, durationMs: elapsed }),
      keepalive: true,
    }).catch(() => {});
  }, HEARTBEAT_MS);
}

// Best-effort beacon at page unload so we capture final time-on-page even
// for a quick navigate-away.
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

  window.addEventListener("pagehide",     beacon);
  window.addEventListener("beforeunload", beacon);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") beacon();
  });
}

/**
 * Record one pageview for the given route path. Safe to call repeatedly —
 * no-ops if the path hasn't actually changed.
 *
 * @param {string} path                 — pathname (eg "/overview")
 * @param {object} [opts]
 * @param {boolean} [opts.isParent]     — true if a logged-in parent triggered this
 */
export async function trackPageview(path, opts = {}) {
  if (isOptedOut()) return;
  if (typeof window === "undefined") return;
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

  try {
    const res = await fetch(`${API_URL}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        path,
        referrer: document.referrer || null,
        isParent: !!opts.isParent,
      }),
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    currentPageviewId = data?.id || null;
    if (currentPageviewId) {
      startHeartbeat();
      attachUnloadBeacon();
    }
  } catch {
    // Silent — analytics must never break the UI
  }
}

/** Opt this user out for good (until they clear browser storage). */
export function disableAnalytics() {
  try { localStorage.setItem(OPTOUT_KEY, "1"); } catch {}
  stopHeartbeat();
  currentPageviewId = null;
}

/** Re-enable analytics after a previous opt-out. */
export function enableAnalytics() {
  try { localStorage.removeItem(OPTOUT_KEY); } catch {}
}

export function isAnalyticsEnabled() {
  return !isOptedOut();
}
