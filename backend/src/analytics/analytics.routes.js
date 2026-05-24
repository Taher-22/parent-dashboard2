// Anonymous, privacy-respecting site analytics — stored in our own DB
// so the data is queryable and historical, not just a Discord channel.
//
// Privacy design:
//   - No cookies. Client session id comes from sessionStorage.
//   - Raw IPs are never stored. We compute SHA-256(IP + server salt) and
//     keep only the truncated digest, used to count unique visitors.
//   - Geo (country/region/city/ISP) is fetched by the visitor's browser
//     from a public lookup API and forwarded here. Our backend never
//     resolves IPs to locations directly.
//   - UA family parsing (Chrome/Safari/iOS) — no exact versions, so we
//     can't fingerprint.
//   - Honors Do Not Track via a header check; clients with DNT:1 are
//     silently dropped.
//   - Uses only built-in node modules + prisma. No new npm deps — the
//     last attempt broke Railway's `npm ci` step.

import express from "express";
import crypto from "crypto";

import prisma from "../db/prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = express.Router();

const IP_SALT = process.env.IP_HASH_SALT || "neuroquest-default-salt-please-change";

function hashIP(ip) {
  return crypto
    .createHash("sha256")
    .update(String(ip || "") + IP_SALT)
    .digest("hex")
    .slice(0, 32);
}

function clientIp(req) {
  // Express's req.ip respects "trust proxy", set in server.js.
  // Railway puts an edge proxy in front so we need that for the real IP.
  return (
    req.ip ||
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.connection?.remoteAddress ||
    "0.0.0.0"
  );
}

function isAdminEmail(email) {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || "nasrrtm@gmail.com";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

function clip(value, max) {
  if (value == null) return null;
  const s = String(value);
  return s.length > max ? s.slice(0, max) : s;
}

/* ─────────── POST /api/analytics/pageview ───────────
 * Anyone (logged-in or anonymous) can call. The client provides
 * its own geo (already fetched browser-side); server stores it
 * along with a hashed IP. Returns the row id so the client can
 * heartbeat into it.
 *
 * Body: {
 *   sessionId, path, referrer?, isParent?,
 *   geo?: { country, region, city, org },
 *   ua?:  { browser, os, device }
 * }
 */
router.post("/pageview", async (req, res) => {
  // Honor Do Not Track
  if (req.get("DNT") === "1" || req.get("X-DNT") === "1") {
    return res.json({ tracked: false, reason: "DNT" });
  }

  const { sessionId, path, referrer, isParent, geo, ua } = req.body ?? {};
  if (!sessionId || !path) {
    return res.status(400).json({ error: "sessionId + path required" });
  }

  const ipHash = hashIP(clientIp(req));

  try {
    const pv = await prisma.pageView.create({
      data: {
        sessionId: clip(sessionId, 64),
        path:      clip(path, 500),
        referrer:  clip(referrer, 500),
        country:   clip(geo?.country, 8),
        region:    clip(geo?.region,  96),
        city:      clip(geo?.city,    96),
        org:       clip(geo?.org,     128),
        browser:   clip(ua?.browser,  32),
        os:        clip(ua?.os,       32),
        device:    clip(ua?.device,   16),
        ipHash,
        isParent:  Boolean(isParent),
      },
      select: { id: true },
    });
    res.json({ id: pv.id, tracked: true });
  } catch (err) {
    console.error("analytics pageview error:", err);
    res.status(500).json({ error: "failed" });
  }
});

/* ─────────── POST /api/analytics/heartbeat ───────────
 * Update durationMs for a known pageview. Pinged every 30s + on
 * pagehide via sendBeacon.
 *
 * Body: { pageviewId, durationMs }
 */
router.post("/heartbeat", async (req, res) => {
  const { pageviewId, durationMs } = req.body ?? {};
  if (!pageviewId || typeof durationMs !== "number") {
    return res.status(400).json({ error: "pageviewId + durationMs required" });
  }

  // Cap at 4h so a runaway tab can't poison stats.
  const clamped = Math.max(0, Math.min(4 * 60 * 60 * 1000, Math.round(durationMs)));

  try {
    await prisma.pageView.update({
      where: { id: String(pageviewId) },
      data:  { durationMs: clamped },
    });
    res.json({ ok: true });
  } catch {
    // Don't 500 for a stale id — tracker is fire-and-forget.
    res.json({ ok: false });
  }
});

/* ─────────── GET /api/analytics/summary ───────────
 * Admin-only aggregate. 7-day totals, daily chart, breakdowns,
 * recent visits.
 */
router.get("/summary", requireAuth, async (req, res) => {
  const parent = await prisma.parent.findUnique({
    where:  { id: req.user.id },
    select: { email: true },
  });
  if (!isAdminEmail(parent?.email)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const now      = new Date();
  const dayAgo   = new Date(now.getTime() -      24 * 60 * 60 * 1000);
  const weekAgo  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const [
      countToday,
      count7d,
      countAll,
      uniqSessions7d,
      uniqIpHash7d,
      durStats7d,
      byCountry,
      byPath,
      byDevice,
      byBrowser,
      recent,
      dailyRows,
    ] = await Promise.all([
      prisma.pageView.count({ where: { createdAt: { gte: dayAgo  } } }),
      prisma.pageView.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.pageView.count(),

      prisma.pageView.findMany({
        where:    { createdAt: { gte: weekAgo } },
        select:   { sessionId: true },
        distinct: ["sessionId"],
      }),
      prisma.pageView.findMany({
        where:    { createdAt: { gte: weekAgo } },
        select:   { ipHash: true },
        distinct: ["ipHash"],
      }),

      prisma.pageView.aggregate({
        where: { createdAt: { gte: weekAgo }, durationMs: { gt: 0 } },
        _avg:  { durationMs: true },
        _max:  { durationMs: true },
      }),

      prisma.pageView.groupBy({
        by:       ["country"],
        where:    { createdAt: { gte: weekAgo } },
        _count:   { _all: true },
        orderBy:  { _count: { country: "desc" } },
        take:     10,
      }),
      prisma.pageView.groupBy({
        by:       ["path"],
        where:    { createdAt: { gte: weekAgo } },
        _count:   { _all: true },
        orderBy:  { _count: { path: "desc" } },
        take:     10,
      }),
      prisma.pageView.groupBy({
        by:     ["device"],
        where:  { createdAt: { gte: weekAgo } },
        _count: { _all: true },
      }),
      prisma.pageView.groupBy({
        by:       ["browser"],
        where:    { createdAt: { gte: weekAgo } },
        _count:   { _all: true },
        orderBy:  { _count: { browser: "desc" } },
        take:     8,
      }),

      prisma.pageView.findMany({
        orderBy: { createdAt: "desc" },
        take:    40,
        select: {
          id: true, path: true, country: true, city: true, region: true,
          org: true, browser: true, os: true, device: true,
          durationMs: true, isParent: true, sessionId: true,
          createdAt: true, referrer: true,
        },
      }),

      prisma.$queryRaw`
        SELECT DATE(createdAt) AS day, COUNT(*) AS views
        FROM PageView
        WHERE createdAt >= ${monthAgo}
        GROUP BY DATE(createdAt)
        ORDER BY day ASC
      `,
    ]);

    res.json({
      totals: {
        today:             countToday,
        week:              count7d,
        all:               countAll,
        uniqueSessions7d:  uniqSessions7d.length,
        uniqueVisitors7d:  uniqIpHash7d.length,
        avgDurationMs7d:   Math.round(durStats7d._avg.durationMs || 0),
        maxDurationMs7d:   durStats7d._max.durationMs || 0,
      },
      byCountry: byCountry.map((r) => ({ country: r.country || "—", count: r._count._all })),
      byPath:    byPath.map((r)    => ({ path:    r.path    || "—", count: r._count._all })),
      byDevice:  byDevice.map((r)  => ({ device:  r.device  || "desktop", count: r._count._all })),
      byBrowser: byBrowser.map((r) => ({ browser: r.browser || "—", count: r._count._all })),
      daily:     (dailyRows || []).map((r) => ({
        day:   r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10),
        views: Number(r.views),
      })),
      recent: recent.map((r) => ({
        id:         r.id,
        path:       r.path,
        location:   [r.city, r.region, r.country].filter(Boolean).join(", ") || "—",
        country:    r.country,
        org:        r.org,
        device:     r.device || "desktop",
        browser:    r.browser,
        os:         r.os,
        durationMs: r.durationMs,
        isParent:   r.isParent,
        sessionId:  r.sessionId,
        referrer:   r.referrer,
        createdAt:  r.createdAt,
      })),
    });
  } catch (err) {
    console.error("analytics summary error:", err);
    res.status(500).json({ error: "failed" });
  }
});

export default router;
