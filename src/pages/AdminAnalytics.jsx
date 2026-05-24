import { useEffect, useMemo, useState } from "react";
import {
  Globe, Users, Eye, Clock, Smartphone, Monitor, Tablet,
  Activity, AlertTriangle, ShieldCheck, RefreshCw, MapPin,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

import PageTransition from "../ui/PageTransition.jsx";
import { getMe, getAnalyticsSummary } from "../lib/api.js";

/* ─── helpers ─────────────────────────────────────────── */

function fmtMs(ms) {
  if (!ms || ms < 1000) return "<1s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function fmtAgo(d) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000)        return "just now";
  if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function flagEmoji(code) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

function deviceIcon(type) {
  if (type === "mobile") return Smartphone;
  if (type === "tablet") return Tablet;
  return Monitor;
}

/* ─── component ───────────────────────────────────────── */

export default function AdminAnalytics() {
  const [me,      setMe]      = useState(null);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const meResp = await getMe();
      setMe(meResp);
      if (!meResp?.isAdmin) {
        setError("Only the site owner can view analytics.");
        setLoading(false);
        return;
      }
      const sum = await getAnalyticsSummary();
      setData(sum);
    } catch (err) {
      setError(err?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const dailyChart = useMemo(() => {
    if (!data?.daily) return [];
    return data.daily.map((d) => ({
      label: new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      views: d.views,
    }));
  }, [data]);

  if (loading && !data) {
    return (
      <PageTransition>
        <div className="opacity-60 text-sm text-center py-20">Loading analytics…</div>
      </PageTransition>
    );
  }

  if (error || !me?.isAdmin) {
    return (
      <PageTransition>
        <div className="panel stroke rounded-2xl p-6 text-center max-w-md mx-auto mt-12">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
          <div className="font-bold mb-1">Restricted</div>
          <div className="text-sm opacity-70">{error || "Only the site owner can view analytics."}</div>
        </div>
      </PageTransition>
    );
  }

  const t = data?.totals || {};

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Site analytics</h1>
          <p className="opacity-75 mt-1 text-sm flex items-center gap-2 flex-wrap">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Anonymous · no cookies · DNT respected · IP hashed
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15
                     bg-white/8 hover:bg-white/15 text-sm font-semibold transition-colors"
        >
          <RefreshCw className="h-4 w-4 opacity-80" /> Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPI icon={Eye}      label="Pageviews today"    value={String(t.today ?? 0)} />
        <KPI icon={Activity} label="Pageviews 7d"       value={String(t.week ?? 0)} />
        <KPI icon={Users}    label="Sessions 7d"        value={String(t.uniqueSessions7d ?? 0)} />
        <KPI icon={Globe}    label="Visitors 7d"        value={String(t.uniqueVisitors7d ?? 0)}
                             sub="unique by IP hash" />
        <KPI icon={Clock}    label="Avg time on page"   value={fmtMs(t.avgDurationMs7d)} />
        <KPI icon={Eye}      label="Pageviews all-time" value={String(t.all ?? 0)} />
      </div>

      {/* 30-day chart */}
      <div className="panel stroke rounded-2xl p-5">
        <div className="text-sm font-bold text-main">Last 30 days</div>
        <div className="text-xs text-muted mt-0.5">Daily pageview volume</div>
        <div className="mt-4 h-44 -mx-2">
          {dailyChart.length === 0 ? (
            <div className="h-full flex items-center justify-center opacity-50 text-sm">
              No pageviews yet — once the site has visitors this fills in.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                <XAxis dataKey="label" stroke="currentColor" opacity={0.5} fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="currentColor" opacity={0.5} fontSize={11} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    background: "rgba(20,20,30,0.92)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="views" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Countries + paths */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <div className="panel stroke rounded-2xl p-5">
          <div className="text-sm font-bold text-main flex items-center gap-2">
            <MapPin className="h-4 w-4 opacity-70" /> Top countries (7d)
          </div>
          <div className="text-xs text-muted mt-0.5">Coarse geo from IP — never lat/lng</div>
          {data?.byCountry?.length ? (
            <ul className="mt-4 space-y-2">
              {data.byCountry.map((row) => (
                <li key={row.country} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-lg leading-none">{flagEmoji(row.country)}</span>
                    <span className="font-semibold">{row.country || "Unknown"}</span>
                  </span>
                  <span className="opacity-70 font-bold">{row.count}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm opacity-55">No data yet.</p>}
        </div>

        <div className="panel stroke rounded-2xl p-5">
          <div className="text-sm font-bold text-main flex items-center gap-2">
            <Activity className="h-4 w-4 opacity-70" /> Top pages (7d)
          </div>
          <div className="text-xs text-muted mt-0.5">Where visitors spend their attention</div>
          {data?.byPath?.length ? (
            <ul className="mt-4 space-y-2">
              {data.byPath.map((row) => (
                <li key={row.path} className="flex items-center justify-between text-sm gap-3">
                  <span className="font-mono opacity-80 truncate">{row.path}</span>
                  <span className="opacity-70 font-bold flex-shrink-0">{row.count}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm opacity-55">No data yet.</p>}
        </div>
      </div>

      {/* Device + browser */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <div className="panel stroke rounded-2xl p-5">
          <div className="text-sm font-bold text-main">Devices (7d)</div>
          <ul className="mt-4 space-y-2">
            {(data?.byDevice || []).map((row) => {
              const Icon = deviceIcon(row.device);
              return (
                <li key={row.device} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 capitalize">
                    <Icon className="h-3.5 w-3.5 opacity-70" />
                    {row.device || "desktop"}
                  </span>
                  <span className="opacity-70 font-bold">{row.count}</span>
                </li>
              );
            })}
            {(data?.byDevice?.length ?? 0) === 0 && <li className="opacity-55 text-sm">No data yet.</li>}
          </ul>
        </div>

        <div className="panel stroke rounded-2xl p-5">
          <div className="text-sm font-bold text-main">Browsers (7d)</div>
          <ul className="mt-4 space-y-2">
            {(data?.byBrowser || []).map((row) => (
              <li key={row.browser} className="flex items-center justify-between text-sm">
                <span>{row.browser || "Unknown"}</span>
                <span className="opacity-70 font-bold">{row.count}</span>
              </li>
            ))}
            {(data?.byBrowser?.length ?? 0) === 0 && <li className="opacity-55 text-sm">No data yet.</li>}
          </ul>
        </div>
      </div>

      {/* Recent visits */}
      <div className="panel stroke rounded-2xl p-5">
        <div className="text-sm font-bold text-main">Recent visits</div>
        <div className="text-xs text-muted mt-0.5">Most recent 40 pageviews</div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider opacity-50 border-b border-white/10">
                <th className="py-2 pr-3 font-semibold">When</th>
                <th className="py-2 pr-3 font-semibold">Page</th>
                <th className="py-2 pr-3 font-semibold">Where</th>
                <th className="py-2 pr-3 font-semibold">Network</th>
                <th className="py-2 pr-3 font-semibold">Device</th>
                <th className="py-2 pr-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent || []).map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap opacity-80">{fmtAgo(r.createdAt)}</td>
                  <td className="py-2 pr-3 font-mono text-xs">
                    {r.path}
                    {r.isParent && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                        parent
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {r.country && <span className="mr-1">{flagEmoji(r.country)}</span>}
                    {r.location}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap opacity-70 text-xs max-w-[200px] truncate">{r.org || "—"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap opacity-80">
                    {r.browser || "?"} · {r.os || "?"} · {r.device || "desktop"}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap font-bold">{fmtMs(r.durationMs)}</td>
                </tr>
              ))}
              {(!data?.recent?.length) && (
                <tr><td className="py-4 opacity-55 text-sm" colSpan={6}>No pageviews recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[11px] opacity-50 leading-relaxed">
        Privacy: no cookies, no third-party trackers. Raw IPs are never stored — only a one-way
        SHA-256 hash (with a server-side salt) used to count unique visitors. Geo is coarse
        country/region/city derived browser-side and forwarded here. Visitors with Do Not Track
        enabled aren't recorded.
      </div>
    </PageTransition>
  );
}

function KPI({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] opacity-55 uppercase tracking-wider font-bold">
        {Icon && <Icon className="h-3 w-3" />} <span>{label}</span>
      </div>
      <span className="text-lg font-extrabold truncate">{value}</span>
      {sub && <span className="text-[11px] opacity-50 truncate">{sub}</span>}
    </div>
  );
}
