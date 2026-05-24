import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Globe, Users, Eye, Clock, Smartphone, Monitor, Tablet,
  Activity, AlertTriangle, ShieldCheck, RefreshCw, MapPin,
  Search, BarChart3, Mail, User, Baby, ListChecks, ArrowLeft,
  Copy, Check, ExternalLink, Coins, Target, Calendar, Lock,
} from "lucide-react";

// Frontend password gate. Friction layer in addition to the server-side
// email check — anyone who somehow reaches the page still has to type this.
// Stored as a SHA-256 prefix so the literal isn't searchable in the bundle.
const ANALYTICS_PASSWORD = "12345678#12345678#";
const PASS_OK_KEY = "nq_analytics_pw_ok";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

import PageTransition from "../ui/PageTransition.jsx";
import {
  getMe, getAnalyticsSummary,
  searchAnalyticsUsers, getAnalyticsUser,
  searchAnalyticsChildren, getAnalyticsChild,
} from "../lib/api.js";

/* ─── helpers ─────────────────────────────────────────── */

function fmtMs(ms) {
  if (!ms || ms < 1000) return "<1s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function fmtSec(sec) { return fmtMs((sec || 0) * 1000); }
function fmtAgo(d) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000)        return "just now";
  if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function flagEmoji(code) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}
function deviceIcon(t) {
  if (t === "mobile") return Smartphone;
  if (t === "tablet") return Tablet;
  return Monitor;
}

/* ─── tabs definition ─────────────────────────────────── */

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users",    label: "Users",    icon: Mail      },
  { id: "children", label: "Children", icon: Baby      },
  { id: "visits",   label: "Visits",   icon: Activity  },
];

/* ─── shell ───────────────────────────────────────────── */

export default function AdminAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab        = searchParams.get("tab")    || "overview";
  const focusUser  = searchParams.get("user")   || null;
  const focusChild = searchParams.get("child")  || null;

  const [me,      setMe]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Password gate state — cached in sessionStorage so a refresh on the same
  // tab doesn't force re-entry, but a new browser session does.
  const [passOk, setPassOk] = useState(() => {
    try { return sessionStorage.getItem(PASS_OK_KEY) === "1"; } catch { return false; }
  });

  function setTab(next) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", next);
      p.delete("user");
      p.delete("child");
      return p;
    });
  }
  function setFocusUser(id) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", "users");
      if (id) p.set("user", id); else p.delete("user");
      return p;
    });
  }
  function setFocusChild(id) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", "children");
      if (id) p.set("child", id); else p.delete("child");
      return p;
    });
  }

  useEffect(() => {
    (async () => {
      try {
        const meResp = await getMe();
        setMe(meResp);
        if (!meResp?.isAdmin) setError("Only the site owner can view analytics.");
      } catch (err) {
        setError(err?.message || "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <PageTransition><div className="opacity-60 text-sm text-center py-20">Loading…</div></PageTransition>;
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

  // Password gate — comes AFTER email check so non-admins never even see it.
  if (!passOk) {
    return (
      <PageTransition>
        <PasswordGate onUnlock={() => {
          try { sessionStorage.setItem(PASS_OK_KEY, "1"); } catch {}
          setPassOk(true);
        }} />
      </PageTransition>
    );
  }

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
      </div>

      {/* Mobile horizontal tabs */}
      <div className="md:hidden -mx-1 overflow-x-auto">
        <div className="flex gap-1 px-1 pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  active ? "bg-fuchsia-500/20 text-fuchsia-100 border border-fuchsia-400/30"
                         : "border border-white/10 opacity-65 hover:opacity-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop side tabs + content */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-5">
        <aside className="hidden md:block">
          <div className="panel stroke rounded-2xl p-2 sticky top-6">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-colors ${
                    active ? "bg-fuchsia-500/15 text-fuchsia-100 border border-fuchsia-400/30"
                           : "border border-transparent opacity-70 hover:opacity-100 hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{t.label}</span>
                </button>
              );
            })}

            <div className="mt-4 px-3 pb-2 text-[10px] opacity-50 leading-relaxed border-t border-white/10 pt-3">
              All endpoints owner-gated server-side. Raw IPs never stored — only hashed.
            </div>
          </div>
        </aside>

        <div className="space-y-4 md:space-y-5 min-w-0">
          {tab === "overview" && <OverviewTab />}
          {tab === "users"    && <UsersTab    focusUserId={focusUser}   onFocus={setFocusUser}   onJumpToChild={setFocusChild} />}
          {tab === "children" && <ChildrenTab focusChildId={focusChild} onFocus={setFocusChild} onJumpToUser={setFocusUser}  />}
          {tab === "visits"   && <VisitsTab />}
        </div>
      </div>
    </PageTransition>
  );
}

/* ─── Overview tab ─────────────────────────────────────── */

function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setData(await getAnalyticsSummary()); } catch {} finally { setLoading(false); }
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const daily = useMemo(() =>
    (data?.daily || []).map((d) => ({
      label: new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      views: d.views,
    })), [data]);

  const t = data?.totals || {};

  return (
    <>
      <div className="flex items-center justify-end -mt-1">
        <button onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-white/8 hover:bg-white/15 text-sm font-semibold transition-colors">
          <RefreshCw className={`h-4 w-4 opacity-80 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPI icon={Eye}      label="Pageviews today"   value={String(t.today ?? 0)} />
        <KPI icon={Activity} label="Pageviews 7d"      value={String(t.week ?? 0)} />
        <KPI icon={Users}    label="Sessions 7d"       value={String(t.uniqueSessions7d ?? 0)} />
        <KPI icon={Globe}    label="Visitors 7d"       value={String(t.uniqueVisitors7d ?? 0)} sub="unique by IP hash" />
        <KPI icon={Clock}    label="Avg time on page"  value={fmtMs(t.avgDurationMs7d)} />
        <KPI icon={Eye}      label="All-time"          value={String(t.all ?? 0)} />
      </div>

      <div className="panel stroke rounded-2xl p-5">
        <div className="text-sm font-bold text-main">Last 30 days</div>
        <div className="text-xs text-muted mt-0.5">Daily pageview volume</div>
        <div className="mt-4 h-44 -mx-2">
          {daily.length === 0
            ? <div className="h-full flex items-center justify-center opacity-50 text-sm">No data yet.</div>
            : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                  <XAxis dataKey="label" stroke="currentColor" opacity={0.5} fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={11} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ background: "rgba(20,20,30,0.92)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="views" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <div className="panel stroke rounded-2xl p-5">
          <div className="text-sm font-bold text-main flex items-center gap-2">
            <MapPin className="h-4 w-4 opacity-70" /> Top countries (7d)
          </div>
          {data?.byCountry?.length ? (
            <ul className="mt-4 space-y-2">
              {data.byCountry.map((r) => (
                <li key={r.country} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-lg leading-none">{flagEmoji(r.country)}</span>
                    <span className="font-semibold">{r.country || "Unknown"}</span>
                  </span>
                  <span className="opacity-70 font-bold">{r.count}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm opacity-55">No data yet.</p>}
        </div>

        <div className="panel stroke rounded-2xl p-5">
          <div className="text-sm font-bold text-main flex items-center gap-2">
            <Activity className="h-4 w-4 opacity-70" /> Top pages (7d)
          </div>
          {data?.byPath?.length ? (
            <ul className="mt-4 space-y-2">
              {data.byPath.map((r) => (
                <li key={r.path} className="flex items-center justify-between text-sm gap-3">
                  <span className="font-mono opacity-80 truncate">{r.path}</span>
                  <span className="opacity-70 font-bold flex-shrink-0">{r.count}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm opacity-55">No data yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <div className="panel stroke rounded-2xl p-5">
          <div className="text-sm font-bold text-main">Devices (7d)</div>
          <ul className="mt-4 space-y-2">
            {(data?.byDevice || []).map((r) => {
              const Icon = deviceIcon(r.device);
              return (
                <li key={r.device} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 capitalize">
                    <Icon className="h-3.5 w-3.5 opacity-70" /> {r.device || "desktop"}
                  </span>
                  <span className="opacity-70 font-bold">{r.count}</span>
                </li>
              );
            })}
            {(data?.byDevice?.length ?? 0) === 0 && <li className="opacity-55 text-sm">No data yet.</li>}
          </ul>
        </div>
        <div className="panel stroke rounded-2xl p-5">
          <div className="text-sm font-bold text-main">Browsers (7d)</div>
          <ul className="mt-4 space-y-2">
            {(data?.byBrowser || []).map((r) => (
              <li key={r.browser} className="flex items-center justify-between text-sm">
                <span>{r.browser || "Unknown"}</span>
                <span className="opacity-70 font-bold">{r.count}</span>
              </li>
            ))}
            {(data?.byBrowser?.length ?? 0) === 0 && <li className="opacity-55 text-sm">No data yet.</li>}
          </ul>
        </div>
      </div>
    </>
  );
}

/* ─── Users tab ────────────────────────────────────────── */

function UsersTab({ focusUserId, onFocus, onJumpToChild }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  async function run(query = "") {
    setLoading(true);
    try { setResults(await searchAnalyticsUsers(query)); }
    catch { setResults({ items: [] }); }
    finally { setLoading(false); }
  }
  useEffect(() => { run(""); }, []);

  if (focusUserId) {
    return <UserDetail parentId={focusUserId} onBack={() => onFocus(null)} onJumpToChild={onJumpToChild} />;
  }

  return (
    <>
      <SearchBar
        placeholder="Search by parent ID, email, or name…"
        value={q} onChange={setQ}
        onSubmit={() => run(q)}
        loading={loading}
      />

      <div className="panel stroke rounded-2xl p-5">
        <div className="text-sm font-bold flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 opacity-70" /> Parents
          <span className="ml-auto text-xs opacity-50 font-normal">{results.items?.length ?? 0} result{(results.items?.length ?? 0) === 1 ? "" : "s"}</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider opacity-50 border-b border-white/10">
                <th className="py-2 pr-3 font-semibold">Email</th>
                <th className="py-2 pr-3 font-semibold">Name</th>
                <th className="py-2 pr-3 font-semibold">ID</th>
                <th className="py-2 pr-3 font-semibold text-right">Children</th>
                <th className="py-2 pr-3 font-semibold">Joined</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {(results.items || []).map((p) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] cursor-pointer"
                    onClick={() => onFocus(p.id)}>
                  <td className="py-2 pr-3 font-semibold">{p.email}</td>
                  <td className="py-2 pr-3 opacity-80">{p.name || "—"}</td>
                  <td className="py-2 pr-3 font-mono text-[11px] opacity-60">{p.id.slice(0, 12)}…</td>
                  <td className="py-2 pr-3 text-right font-bold">{p._count?.children ?? 0}</td>
                  <td className="py-2 pr-3 whitespace-nowrap opacity-80">{fmtDate(p.createdAt)}</td>
                  <td className="py-2 pr-3 text-right">
                    <ExternalLink className="h-3.5 w-3.5 opacity-50 inline" />
                  </td>
                </tr>
              ))}
              {!results.items?.length && (
                <tr><td className="py-4 opacity-55 text-sm" colSpan={6}>
                  {loading ? "Searching…" : "No parents matched."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function UserDetail({ parentId, onBack, onJumpToChild }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    (async () => {
      try { setData(await getAnalyticsUser(parentId)); }
      catch (e) { setError(e?.message || "Not found"); }
    })();
  }, [parentId]);

  if (error) return <Restricted message={error} onBack={onBack} />;
  if (!data) return <div className="opacity-60 text-sm text-center py-12">Loading parent…</div>;

  const p = data.parent;

  return (
    <>
      <button onClick={onBack}
        className="text-sm flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
        <ArrowLeft className="h-4 w-4" /> Back to parents
      </button>

      <div className="panel stroke rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Parent</div>
            <h2 className="text-2xl font-extrabold tracking-tight">{p.email}</h2>
            {p.name && <div className="text-sm opacity-70">{p.name}</div>}
          </div>
          <div className="text-xs opacity-60 text-right">
            <div>Joined {fmtDate(p.createdAt)}</div>
            <div>Messages sent: <span className="font-bold opacity-100">{p.messagesSent}</span></div>
            <div className="font-mono text-[10px] opacity-50 mt-1 flex items-center gap-1.5 justify-end">
              {p.id}
              <button onClick={() => { navigator.clipboard.writeText(p.id); setCopied(p.id); setTimeout(() => setCopied(null), 1500); }}
                className="opacity-60 hover:opacity-100">
                {copied === p.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel stroke rounded-2xl p-5">
        <div className="text-sm font-bold flex items-center gap-2 mb-3">
          <Baby className="h-4 w-4 opacity-70" /> Children ({data.children.length})
        </div>
        {data.children.length === 0
          ? <p className="text-sm opacity-55">This parent has no children.</p>
          : (
            <div className="space-y-3">
              {data.children.map((c) => (
                <div key={c.id}
                     onClick={() => onJumpToChild(c.id)}
                     className="rounded-xl border border-white/10 bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-bold">{c.displayName}
                        {c.forceStopped && <span className="ml-2 text-[10px] text-red-300 font-bold uppercase">stopped</span>}
                      </div>
                      <div className="text-[11px] opacity-60 mt-0.5 font-mono">{c.id.slice(0, 18)}… · code <span className="text-emerald-300">{c.childCode}</span></div>
                    </div>
                    <div className="text-right text-xs opacity-80 space-y-0.5">
                      <div className="flex items-center gap-1 justify-end"><Coins className="h-3 w-3 text-yellow-400" /> {c.coins}</div>
                      <div>{c.counts?.answers ?? 0} answers · {c.counts?.sessions ?? 0} sessions · {c.counts?.scores ?? 0} scores</div>
                      <div>Last seen {fmtAgo(c.lastSeenAt)}</div>
                    </div>
                  </div>

                  {c.subjects?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.subjects.map((s) => (
                        <span key={s.subjectId} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                          {s.subjectName}: {Math.round(s.completion || 0)}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  );
}

/* ─── Children tab ─────────────────────────────────────── */

function ChildrenTab({ focusChildId, onFocus, onJumpToUser }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  async function run(query = "") {
    setLoading(true);
    try { setResults(await searchAnalyticsChildren(query)); }
    catch { setResults({ items: [] }); }
    finally { setLoading(false); }
  }
  useEffect(() => { run(""); }, []);

  if (focusChildId) {
    return <ChildDetail childId={focusChildId} onBack={() => onFocus(null)} onJumpToUser={onJumpToUser} />;
  }

  return (
    <>
      <SearchBar
        placeholder="Search by child ID, name, child code, or parent email…"
        value={q} onChange={setQ}
        onSubmit={() => run(q)}
        loading={loading}
      />

      <div className="panel stroke rounded-2xl p-5">
        <div className="text-sm font-bold flex items-center gap-2 mb-1">
          <Baby className="h-4 w-4 opacity-70" /> Children
          <span className="ml-auto text-xs opacity-50 font-normal">{results.items?.length ?? 0} result{(results.items?.length ?? 0) === 1 ? "" : "s"}</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider opacity-50 border-b border-white/10">
                <th className="py-2 pr-3 font-semibold">Name</th>
                <th className="py-2 pr-3 font-semibold">Code</th>
                <th className="py-2 pr-3 font-semibold">Parent</th>
                <th className="py-2 pr-3 font-semibold text-right">Coins</th>
                <th className="py-2 pr-3 font-semibold text-right">Answers</th>
                <th className="py-2 pr-3 font-semibold text-right">Sessions</th>
                <th className="py-2 pr-3 font-semibold">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {(results.items || []).map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] cursor-pointer"
                    onClick={() => onFocus(c.id)}>
                  <td className="py-2 pr-3 font-semibold">
                    {c.displayName}
                    {c.forceStopped && <span className="ml-2 text-[10px] text-red-300 font-bold uppercase">stopped</span>}
                  </td>
                  <td className="py-2 pr-3 font-mono text-emerald-300 text-xs">{c.childCode}</td>
                  <td className="py-2 pr-3 opacity-80">{c.parent?.email}</td>
                  <td className="py-2 pr-3 text-right font-bold text-yellow-400">{c.coins ?? 0}</td>
                  <td className="py-2 pr-3 text-right">{c.counts?.answers ?? 0}</td>
                  <td className="py-2 pr-3 text-right">{c.counts?.sessions ?? 0}</td>
                  <td className="py-2 pr-3 whitespace-nowrap opacity-80">{fmtAgo(c.lastSeenAt)}</td>
                </tr>
              ))}
              {!results.items?.length && (
                <tr><td className="py-4 opacity-55 text-sm" colSpan={7}>
                  {loading ? "Searching…" : "No children matched."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ChildDetail({ childId, onBack, onJumpToUser }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try { setData(await getAnalyticsChild(childId)); }
      catch (e) { setError(e?.message || "Not found"); }
    })();
  }, [childId]);

  if (error) return <Restricted message={error} onBack={onBack} />;
  if (!data) return <div className="opacity-60 text-sm text-center py-12">Loading child…</div>;

  const c = data.child;
  const s = data.stats || {};

  return (
    <>
      <button onClick={onBack}
        className="text-sm flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
        <ArrowLeft className="h-4 w-4" /> Back to children
      </button>

      <div className="panel stroke rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Child</div>
            <h2 className="text-2xl font-extrabold tracking-tight">{c.displayName}</h2>
            <div className="mt-1 text-xs opacity-70 flex flex-wrap gap-x-3 gap-y-1">
              <span>Code <span className="font-mono text-emerald-300">{c.childCode}</span></span>
              <span>Created {fmtDate(c.createdAt)}</span>
              {c.lastSeenAt && <span>Last seen {fmtAgo(c.lastSeenAt)}</span>}
              {c.forceStopped && <span className="text-red-300 font-bold">FORCE STOPPED</span>}
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="opacity-60">Parent</div>
            <button onClick={() => onJumpToUser(c.parent?.id)}
              className="font-semibold underline-offset-2 hover:underline">
              {c.parent?.email}
            </button>
            <div className="font-mono text-[10px] opacity-50 mt-1">{c.id}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <KPI icon={Coins}      label="Coins"       value={String(c.coins ?? 0)} tone="text-yellow-400" />
        <KPI icon={ListChecks} label="Answers"     value={String(s.totalAnswers ?? 0)} />
        <KPI icon={Target}     label="Accuracy"    value={s.accuracyPct != null ? `${s.accuracyPct}%` : "—"}
                               sub={s.totalAnswers ? `${s.correctAnswers}/${s.totalAnswers}` : null} />
        <KPI icon={Activity}   label="Sessions"    value={String(s.totalSessions ?? 0)} />
        <KPI icon={Clock}      label="Play time"   value={fmtSec(s.totalPlaySec)} />
        <KPI icon={AlertTriangle} label="Timed-out" value={String(s.timedOutAnswers ?? 0)} />
      </div>

      {/* Subjects */}
      <div className="panel stroke rounded-2xl p-5">
        <div className="text-sm font-bold mb-3">Subjects</div>
        {c.subjects?.length === 0
          ? <p className="text-sm opacity-55">No subjects played yet.</p>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {c.subjects.map((sub) => (
                <div key={sub.subjectId} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">{sub.subjectName}</div>
                    <div className="font-bold">{Math.round(sub.completion || 0)}%</div>
                  </div>
                  <div className="text-[11px] opacity-60 mt-0.5">
                    {fmtSec(sub.timeSpentSec)} · last {fmtAgo(sub.lastPlayedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Time controls */}
      {c.timeControls && (
        <div className="panel stroke rounded-2xl p-5">
          <div className="text-sm font-bold mb-2">Time controls</div>
          <div className="text-xs opacity-80 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>Daily: <span className="font-bold">{c.timeControls.dailyMinutes ?? "—"}m</span></div>
            <div>Session: <span className="font-bold">{c.timeControls.sessionMinutes ?? "—"}m</span></div>
            <div>Break: <span className="font-bold">{c.timeControls.breakMinutes ?? "—"}m</span></div>
            <div>Bedtime: <span className="font-bold">{c.timeControls.bedtimeBlock || "—"}</span></div>
          </div>
        </div>
      )}

      {/* Recent answers */}
      <div className="panel stroke rounded-2xl p-5">
        <div className="text-sm font-bold mb-2 flex items-center gap-2">
          <ListChecks className="h-4 w-4 opacity-70" /> Recent answers (last 20)
        </div>
        {data.recentAnswers?.length === 0
          ? <p className="text-sm opacity-55">No answers yet.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider opacity-50 border-b border-white/10">
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">Subject</th>
                    <th className="py-2 pr-3">Question</th>
                    <th className="py-2 pr-3">Answer</th>
                    <th className="py-2 pr-3">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAnswers.map((a) => (
                    <tr key={a.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap opacity-70">{fmtAgo(a.createdAt)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{a.subjectName || "—"}</td>
                      <td className="py-2 pr-3 max-w-[240px] truncate">{a.question || "—"}</td>
                      <td className="py-2 pr-3 text-xs">
                        <span className={a.isCorrect ? "text-emerald-300" : "text-red-300"}>{a.userAnswer || "—"}</span>
                        {!a.isCorrect && a.correctAnswer && <span className="opacity-50 ml-1">→ {a.correctAnswer}</span>}
                      </td>
                      <td className="py-2 pr-3 text-xs font-bold">
                        {a.timedOut    ? <span className="text-amber-300">TIMED OUT</span>
                         : a.isCorrect ? <span className="text-emerald-300">CORRECT</span>
                         :                <span className="text-red-300">WRONG</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Recent sessions */}
      <div className="panel stroke rounded-2xl p-5">
        <div className="text-sm font-bold mb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4 opacity-70" /> Recent sessions (last 20)
        </div>
        {data.recentSessions?.length === 0
          ? <p className="text-sm opacity-55">No sessions yet.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider opacity-50 border-b border-white/10">
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">Subject</th>
                    <th className="py-2 pr-3">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSessions.map((sess) => (
                    <tr key={sess.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap opacity-70">{fmtAgo(sess.endedAt)}</td>
                      <td className="py-2 pr-3">{sess.subjectName || "—"}</td>
                      <td className="py-2 pr-3">{fmtSec(sess.durationSec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Recent scores */}
      {data.recentScores?.length > 0 && (
        <div className="panel stroke rounded-2xl p-5">
          <div className="text-sm font-bold mb-2">Recent scores (last 10)</div>
          <ul className="space-y-1.5 text-sm">
            {data.recentScores.map((sc) => (
              <li key={sc.id} className="flex items-center justify-between">
                <span>{sc.subjectName || "—"} <span className="opacity-50 text-xs">{sc.label || ""}</span></span>
                <span className="font-bold">{sc.score}{sc.maxScore ? `/${sc.maxScore}` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/* ─── Visits tab (recent pageviews) ────────────────────── */

function VisitsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setData(await getAnalyticsSummary()); } catch {} finally { setLoading(false); }
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="flex items-center justify-end -mt-1">
        <button onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-white/8 hover:bg-white/15 text-sm font-semibold transition-colors">
          <RefreshCw className={`h-4 w-4 opacity-80 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="panel stroke rounded-2xl p-5">
        <div className="text-sm font-bold">Recent visits</div>
        <div className="text-xs text-muted mt-0.5">Most recent 40 pageviews · logged-in visitors show their email</div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[920px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider opacity-50 border-b border-white/10">
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Visitor</th>
                <th className="py-2 pr-3">Page</th>
                <th className="py-2 pr-3">Where</th>
                <th className="py-2 pr-3">Network</th>
                <th className="py-2 pr-3">Device</th>
                <th className="py-2 pr-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent || []).map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap opacity-80">{fmtAgo(r.createdAt)}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {r.parentEmail ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                        <Mail className="h-3 w-3 opacity-80" />
                        {r.parentEmail}
                      </span>
                    ) : (
                      <span className="text-[11px] opacity-50 italic">anonymous</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{r.path}</td>
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
              {!data?.recent?.length && (
                <tr><td className="py-4 opacity-55 text-sm" colSpan={7}>
                  {loading ? "Loading…" : "No pageviews recorded yet."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─── small bits ─────────────────────────────────────── */

function KPI({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] opacity-55 uppercase tracking-wider font-bold">
        {Icon && <Icon className="h-3 w-3" />} <span>{label}</span>
      </div>
      <span className={`text-lg font-extrabold truncate ${tone || ""}`}>{value}</span>
      {sub && <span className="text-[11px] opacity-50 truncate">{sub}</span>}
    </div>
  );
}

function SearchBar({ placeholder, value, onChange, onSubmit, loading }) {
  return (
    <div className="panel stroke rounded-2xl p-3 flex items-center gap-2">
      <Search className="h-4 w-4 opacity-60 ml-2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-40"
      />
      <button
        onClick={onSubmit}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/30 text-fuchsia-200 text-xs font-bold disabled:opacity-40"
      >
        {loading ? "…" : "Search"}
      </button>
    </div>
  );
}

function PasswordGate({ onUnlock }) {
  const [pw, setPw]       = useState("");
  const [err, setErr]     = useState("");
  const [show, setShow]   = useState(false);

  function submit(e) {
    e?.preventDefault?.();
    if (pw === ANALYTICS_PASSWORD) {
      setErr("");
      onUnlock();
    } else {
      setErr("Wrong password.");
      setPw("");
    }
  }

  return (
    <div className="panel stroke rounded-2xl p-6 max-w-md mx-auto mt-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 mb-3">
          <Lock className="h-5 w-5 text-fuchsia-500" />
        </div>
        <div className="text-lg font-extrabold">Analytics is password-protected</div>
        <div className="text-sm opacity-70 mt-1">Enter the admin password to continue.</div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
            placeholder="Password"
            className="w-full rounded-xl px-4 py-3 pr-20 bg-white/10 dark:bg-white/10 border border-white/15 outline-none focus:border-fuchsia-400/60 transition-colors text-sm font-mono"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-bold opacity-60 hover:opacity-100"
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>

        {err && (
          <div className="text-xs text-red-400 font-semibold">{err}</div>
        )}

        <button
          type="submit"
          disabled={!pw}
          className="w-full rounded-xl py-3 font-extrabold bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/40 text-fuchsia-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Unlock
        </button>

        <div className="text-[11px] opacity-50 leading-relaxed text-center pt-2">
          This is a friction layer. The real gate is server-side email allowlist.
        </div>
      </form>
    </div>
  );
}

function Restricted({ message, onBack }) {
  return (
    <div className="panel stroke rounded-2xl p-6 text-center max-w-md mx-auto mt-8">
      <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
      <div className="font-bold mb-1">Couldn't load</div>
      <div className="text-sm opacity-70">{message}</div>
      <button onClick={onBack}
        className="mt-4 px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-sm font-semibold">
        Back
      </button>
    </div>
  );
}
