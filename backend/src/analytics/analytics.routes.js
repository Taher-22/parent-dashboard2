// Anonymous, privacy-respecting site analytics.
//
// Design goals:
//  - No cookies. The session id comes from sessionStorage, generated client-side.
//  - Never store the raw IP. We hash (IP + server salt) one-way, truncate to 32
//    chars, and use it ONLY to roughly count unique visitors. We can't reverse
//    it to a person.
//  - Geo is country/region/city only (never lat/lng), derived offline from
//    geoip-lite — no external API calls, no per-visitor disclosure.
//  - Respect Do Not Track. Clients sending DNT:1 are silently not recorded.
//  - User agent parsed to family-level only (Chrome / Safari / Windows / iOS)
//    so we can't fingerprint exact versions.

import express from "express";
import crypto from "crypto";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";

import prisma from "../db/prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = express.Router();

// CHANGE-ME-IN-ENV: set IP_HASH_SALT on Railway to prevent rainbow-table attacks.
// If you ever rotate it, all "unique visitor" counts reset (which is fine).
const IP_SALT = process.env.IP_HASH_SALT || "neuroquest-default-salt-please-change";

function hashIP(ip) {
  return crypto
    .createHash("sha256")
    .update(String(ip || "") + IP_SALT)
    .digest("hex")
    .slice(0, 32);
}

function parseUA(uaString) {
  if (!uaString) return { browser: null, os: null, device: "desktop" };
  try {
    const parsed = new UAParser(uaString);
    const device = parsed.getDevice().type;
    return {
      browser: parsed.getBrowser().name || null,
      os:      parsed.getOS().name      || null,
      // UA parser returns undefined type for desktops — normalise.
      device:  device || "desktop",
    };
  } catch {
    return { browser: null, os: null, device: "desktop" };
  }
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

function clientIp(req) {
  // Express's req.ip respects "trust proxy" (set in server.js) and pulls the
  // first hop from X-Forwarded-For when behind Railway's edge.
  return req.ip || req.connection?.remoteAddress || "0.0.0.0";
}

/* ─────────────── POST /api/analytics/pageview ───────────────
 * Record one page view. Anyone can call — no auth required.
 * Body: { sessionId, path, referrer?, isParent? }
 */
router.post("/pageview", async (req, res) => {
  // Honor Do Not Track
  if (req.get("DNT") === "1" || req.get("X-DNT") === "1") {
    return res.json({ tracked: false, reason: "DNT" });
  }

  const { sessionId, path, referrer, isParent } = req.body ?? {};
  if (!sessionId || !path) {
    return res.status(400).json({ error: "sessionId + path required" });
  }

  const ip     = clientIp(req);
  const ipHash = hashIP(ip);
  const geo    = geoip.lookup(ip) || null;
  const { browser, os, device } = parseUA(req.get("user-agent"));

  try {
    const pv = await prisma.pageView.create({
      data: {
        sessionId: String(sessionId).slice(0, 64),
        path:      String(path).slice(0, 500),
        referrer:  referrer ? String(referrer).slice(0, 500) : null,
        country:   geo?.country || null,
        region:    geo?.region  || null,
        city:      geo?.city    || null,
        browser,
        os,
        device,
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

/* ─────────────── POST /api/analytics/heartbeat ───────────────
 * Update durationMs for a known pageview. Called periodically + on page unload.
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
    // Don't 500 the client for a missing row; tracker is fire-and-forget.
    res.json({ ok: false });
  }
});

/* ─────────────── GET /api/analytics/summary ───────────────
 * Admin-only dashboard data. Returns recent visits + aggregates over 7 days.
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
      avgDuration7d,
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

      // Recent 40 visits
      prisma.pageView.findMany({
        orderBy: { createdAt: "desc" },
        take:    40,
        select: {
          id: true, path: true, country: true, city: true, region: true,
          browser: true, os: true, device: true,
          durationMs: true, isParent: true, sessionId: true,
          createdAt: true, referrer: true,
        },
      }),

      // Last 30 days for the chart — grouped by ymd
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
        today:                 countToday,
        week:                  count7d,
        all:                   countAll,
        uniqueSessions7d:      uniqSessions7d.length,
        uniqueVisitors7d:      uniqIpHash7d.length,
        avgDurationMs7d:       Math.round(avgDuration7d._avg.durationMs || 0),
        maxDurationMs7d:       avgDuration7d._max.durationMs || 0,
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
        id: r.id,
        path: r.path,
        location: [r.city, r.region, r.country].filter(Boolean).join(", ") || "—",
        country: r.country,
        device:  r.device || "desktop",
        browser: r.browser,
        os:      r.os,
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
