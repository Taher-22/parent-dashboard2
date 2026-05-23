import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, getChildReport, getTimeTrend, setChildCoins } from "../lib/api";

import PageTransition from "../ui/PageTransition.jsx";
import Card from "../ui/Card.jsx";
import AnimatedCounter from "../ui/AnimatedCounter.jsx";
import Badge from "../ui/Badge.jsx";

import { motion } from "framer-motion";
import { Sparkles, Clock3, ListChecks, Coins as CoinsIcon, Pencil, Check, X } from "lucide-react";

import { useChildren } from "../state/ChildrenContext.jsx";

function CoinsCard({ child, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(child?.coins ?? 0));
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(String(child?.coins ?? 0)); }, [child?.id, child?.coins]);

  async function save() {
    const n = Number(draft);
    if (!Number.isFinite(n) || n < 0) {
      setDraft(String(child.coins ?? 0));
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await setChildCoins(child.id, { coins: Math.round(n) });
      onUpdated?.();
      setEditing(false);
    } catch {
      alert("Couldn't update coins. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!child) return null;
  return (
    <Card title="Coins">
      <div className="flex items-end gap-2">
        {editing ? (
          <>
            <input
              type="number"
              min={0}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") { setDraft(String(child.coins ?? 0)); setEditing(false); }
              }}
              autoFocus
              className="w-24 text-5xl font-black text-amber-400 bg-transparent border-b-2 border-amber-400/40 outline-none focus:border-amber-300"
            />
            <span className="pb-2 opacity-70">coins</span>
            <button
              onClick={save}
              disabled={saving}
              className="ml-auto p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 disabled:opacity-50"
              title="Save"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setDraft(String(child.coins ?? 0)); setEditing(false); }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <span className="text-5xl font-black text-amber-400">
              <AnimatedCounter value={child.coins ?? 0} />
            </span>
            <span className="pb-2 opacity-70">coins</span>
            <button
              onClick={() => setEditing(true)}
              className="ml-auto p-2 rounded-lg bg-white/10 hover:bg-white/20"
              title="Edit coins"
            >
              <Pencil className="h-4 w-4 opacity-70" />
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

function formatTime(seconds) {
  if (!seconds) return "0 min";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatDateRelative(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

export default function Overview() {
  const navigate = useNavigate();
  const { kids, activeChild, activeChildId, loadingKids, reloadChildren } = useChildren();

  const [authLoading, setAuthLoading] = useState(true);
  const [report,      setReport]      = useState(null);
  const [trend,       setTrend]       = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  // Auth gate
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    getMe()
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      })
      .finally(() => setAuthLoading(false));
  }, [navigate]);

  // Load report + 7-day trend whenever the active child changes,
  // then keep them fresh on a 15s poll while the page is visible so new
  // progress / coins / scores show up without needing to navigate away.
  useEffect(() => {
    if (!activeChildId) {
      setReport(null);
      setTrend(null);
      return;
    }

    let cancelled = false;
    async function fetchOnce(showLoader) {
      if (showLoader) setLoadingData(true);
      try {
        const [r, t] = await Promise.all([
          getChildReport(activeChildId).catch(() => null),
          getTimeTrend(activeChildId).catch(() => null),
        ]);
        if (cancelled) return;
        setReport(r);
        setTrend(t);
      } finally {
        if (!cancelled && showLoader) setLoadingData(false);
      }
    }

    fetchOnce(true);
    const id = setInterval(() => {
      if (document.hidden) return;
      fetchOnce(false);
    }, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, [activeChildId]);

  // Derived KPIs
  const kpis = useMemo(() => {
    const summary = report?.summary ?? {};
    const todaySec = trend?.days?.slice(-1)?.[0]?.totalTimeSec ?? 0;
    const weekSec  = (trend?.days ?? []).reduce((s, d) => s + (d.totalTimeSec || 0), 0);
    return {
      todayFocusMinutes: Math.round(todaySec / 60),
      weeklyMinutes:     Math.round(weekSec / 60),
      avgCompletion:     Math.round(summary.averageCompletion ?? 0),
      totalSessions:     summary.totalSessions ?? 0,
      totalPlayTimeSec:  summary.totalPlayTimeSec ?? 0,
      mostPlayed:        summary.mostPlayedSubject ?? "—",
      lastActivity:      summary.lastActivityAt ?? null,
    };
  }, [report, trend]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full text-lg opacity-70">
        Loading overview…
      </div>
    );
  }

  return (
    <PageTransition>
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Parent Overview</h1>
          <p className="opacity-75 mt-1">Time, progress patterns, mastery, and support signals.</p>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Badge tone="purple"><Sparkles className="h-3.5 w-3.5" /> ADHD-friendly</Badge>
          <Badge tone="green"> <Clock3   className="h-3.5 w-3.5" /> Micro-sessions</Badge>
          <Badge tone="orange"><ListChecks className="h-3.5 w-3.5" /> Interventions</Badge>
        </div>
      </div>

      {/* ACTIVE CHILD + PRESENCE */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="font-semibold text-lg flex items-center gap-3">
            {activeChild && (() => {
              const last = activeChild.lastSeenAt ? new Date(activeChild.lastSeenAt).getTime() : 0;
              const online = last > 0 && (Date.now() - last) < 60_000;
              return (
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
                  title={online ? "In game" : "Offline"}
                />
              );
            })()}
            {loadingKids ? "Loading child..." :
             activeChild ? `Child: ${activeChild.displayName}` :
                           "No child added yet"}
          </div>
          {activeChild && (() => {
            const last = activeChild.lastSeenAt ? new Date(activeChild.lastSeenAt).getTime() : 0;
            const online = last > 0 && (Date.now() - last) < 60_000;
            const subjectNames = {
              subj_math: "Math", seed_s_english: "English", seed_s_science: "Science",
              seed_s_minigames: "Minigames", seed_s_mainmenu: "Main Menu",
            };
            const subj = activeChild.currentSubjectId ? (subjectNames[activeChild.currentSubjectId] || activeChild.currentSubjectId) : null;
            const inMenu = activeChild.currentSubjectId === "seed_s_mainmenu";
            if (online && inMenu)  return <Badge tone="blue">In Main Menu</Badge>;
            if (online && subj)    return <Badge tone="green">Playing {subj}</Badge>;
            if (online)            return <Badge tone="green">In game</Badge>;
            if (last > 0)          return <Badge tone="blue">Offline — last seen {formatDateRelative(activeChild.lastSeenAt)}</Badge>;
            return <Badge tone="blue">Never connected</Badge>;
          })()}
        </div>
      </Card>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card title="Today Focus Minutes">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-emerald-400">
              <AnimatedCounter value={kpis.todayFocusMinutes} />
            </span>
            <span className="pb-2 opacity-70">min</span>
          </div>
        </Card>

        <Card title="This Week">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-sky-400">
              <AnimatedCounter value={kpis.weeklyMinutes} />
            </span>
            <span className="pb-2 opacity-70">min</span>
          </div>
        </Card>

        <Card title="Avg Completion">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-purple-400">
              <AnimatedCounter value={kpis.avgCompletion} />
            </span>
            <span className="pb-2 opacity-70">%</span>
          </div>
        </Card>

        <Card title="Total Sessions">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-orange-400">
              <AnimatedCounter value={kpis.totalSessions} />
            </span>
            <span className="pb-2 opacity-70">sessions</span>
          </div>
        </Card>

        {/* Editable coin balance */}
        <CoinsCard child={activeChild} onUpdated={reloadChildren} />
      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Learning Time (7 Days)">
          {loadingData && <div className="h-[200px] flex items-center justify-center opacity-60">Loading…</div>}
          {!loadingData && trend?.days?.length ? (
            <div className="flex items-end gap-1.5 h-[200px] pt-3">
              {trend.days.map((d) => {
                const maxSec = Math.max(...trend.days.map((x) => x.totalTimeSec || 0), 60);
                const pct = ((d.totalTimeSec || 0) / maxSec) * 100;
                const dayLabel = new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[10px] opacity-60 font-bold">{Math.round((d.totalTimeSec||0)/60)}m</div>
                    <motion.div
                      className="w-full rounded-md bg-gradient-to-t from-emerald-500 to-purple-500"
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ minHeight: 4 }}
                    />
                    <div className="text-[10px] opacity-50">{dayLabel}</div>
                  </div>
                );
              })}
            </div>
          ) : !loadingData && (
            <div className="h-[200px] flex items-center justify-center opacity-60">No data yet</div>
          )}
        </Card>

        <Card title="Headline Stats">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="opacity-60">Lifetime play time</span>
              <span className="font-bold">{formatTime(kpis.totalPlayTimeSec)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-60">Most played subject</span>
              <span className="font-bold">{kpis.mostPlayed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-60">Last activity</span>
              <span className="font-bold">{formatDateRelative(kpis.lastActivity)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* RECENT SUBJECTS */}
      <div className="grid grid-cols-1 gap-4">
        <Card title="Recent Subject Activity">
          {loadingData && <div className="opacity-60 text-sm">Loading…</div>}
          {!loadingData && (report?.subjects?.length ? (
            <div className="space-y-2">
              {report.subjects.slice(0, 6).map((s) => (
                <div key={s.subjectId} className="flex items-center justify-between rounded-lg px-3 py-2 border border-white/5 bg-white/3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{s.subjectName}</span>
                    <span className="text-xs opacity-50">{formatTime(s.totalTimeSpentSec)}</span>
                  </div>
                  <span className="text-sm font-bold">{Math.round(s.completion)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="opacity-60 text-sm">No subjects played yet.</div>
          ))}
        </Card>
      </div>
    </PageTransition>
  );
}
