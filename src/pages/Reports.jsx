import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Printer, AlertTriangle, Trophy, Clock, Star } from "lucide-react";

import PageTransition from "../ui/PageTransition.jsx";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import { useChildren } from "../state/ChildrenContext.jsx";
import { getChildReport } from "../lib/api.js";

/* ── helpers ───────────────────────────────────────────── */

function formatTime(seconds) {
  if (!seconds) return "0 min";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function scoreColor(pct) {
  if (pct >= 70) return { bar: "from-emerald-400 to-emerald-500", text: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" };
  if (pct >= 40) return { bar: "from-yellow-400 to-amber-400",   text: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/20"  };
  return           { bar: "from-red-400 to-rose-500",            text: "text-red-400",     bg: "bg-red-400/10 border-red-400/20"         };
}

/* ── component ─────────────────────────────────────────── */

export default function Reports() {
  const { kids, activeChild, activeChildId, setActiveChildId } = useChildren();

  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!activeChildId) return;
    setLoading(true);
    setError(null);
    setReport(null);
    getChildReport(activeChildId)
      .then(setReport)
      .catch(() => setError("Failed to load report. Please check your connection."))
      .finally(() => setLoading(false));
  }, [activeChildId]);

  const child    = report?.child ?? activeChild;
  const subjects = report?.subjects ?? [];
  const summary  = report?.summary  ?? {};
  const weakAreas = subjects.filter((s) => s.completion < 50);

  function handlePrint() {
    window.print();
  }

  return (
    <PageTransition>

      {/* ── PRINT STYLES injected inline so they travel with the component ── */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-report { display: block !important; }
        }
        #print-report { display: none; }
      `}</style>

      {/* ── PRINTABLE AREA (hidden on screen, visible on print) ── */}
      <div id="print-report" style={{ fontFamily: "sans-serif", padding: 32, color: "#111" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1e3a8a", textAlign: "center" }}>
          NeuroQuest Guardian Report
        </h1>
        <hr style={{ margin: "16px 0", borderColor: "#ccc" }} />
        <p style={{ fontSize: 18, fontWeight: 700 }}>Child: {child?.displayName ?? "—"}</p>
        <p style={{ fontSize: 13, color: "#666" }}>Date: {new Date().toLocaleDateString()}</p>
        <hr style={{ margin: "16px 0", borderColor: "#eee" }} />

        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1d4ed8", marginBottom: 10 }}>Subject Mastery</h2>
        {subjects.map((s) => (
          <div key={s.subjectId} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
            <span>{s.subjectName}</span>
            <strong>{Math.round(s.completion)}%</strong>
          </div>
        ))}

        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#dc2626", margin: "24px 0 10px" }}>Weak Areas</h2>
        {weakAreas.length === 0
          ? <p style={{ color: "#16a34a", fontSize: 13 }}>Everything looks great! No weak areas identified.</p>
          : weakAreas.map((s) => (
            <div key={s.subjectId} style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: 14 }}>{s.subjectName}</strong>
              <p style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                Needs more practice — only {Math.round(s.completion)}% mastery achieved.
                {s.completion < 20 && " Strongly recommend additional support sessions."}
              </p>
            </div>
          ))
        }
      </div>

      {/* ── SCREEN CONTENT ── */}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reports</h1>
          <p className="opacity-75 mt-1">Parent summary report for printing and exporting.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Badge tone="blue">Printable</Badge>
        </div>
      </div>

      {/* Child selector */}
      {kids.length > 1 && (
        <Card>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold opacity-60">Viewing report for:</span>
            <select
              value={activeChildId ?? ""}
              onChange={(e) => setActiveChildId(e.target.value)}
              className="rounded-lg px-3 py-2 bg-black/5 dark:bg-white/10 font-semibold text-sm outline-none
                         border border-white/10 focus:border-purple-400/50 transition-colors"
            >
              {kids.map((k) => (
                <option key={k.id} value={k.id}>{k.displayName}</option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* No child */}
      {!activeChildId && !loading && (
        <div className="opacity-60 text-sm text-center py-16">
          Please add a child first to view their report.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 animate-pulse">
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="h-3 w-48 rounded bg-white/8" />
              <div className="space-y-2 pt-2">
                <div className="h-3 rounded bg-white/8" />
                <div className="h-3 rounded bg-white/8 w-4/5" />
                <div className="h-3 rounded bg-white/8 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Main report */}
      {!loading && report && (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Sessions",    value: summary.totalSessions     ?? 0,                          icon: Star  },
              { label: "Total Play Time",   value: formatTime(summary.totalPlayTimeSec),                    icon: Clock },
              { label: "Avg Completion",    value: `${Math.round(summary.averageCompletion ?? 0)}%`,        icon: Trophy },
              { label: "Most Played",       value: summary.mostPlayedSubject ?? "—",                       icon: Trophy },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex flex-col gap-1">
                <span className="text-[11px] opacity-50 uppercase tracking-wider font-semibold">{label}</span>
                <span className="text-lg font-extrabold truncate">{value}</span>
              </div>
            ))}
          </div>

          {/* Two-column layout (matches Flutter Row + Expanded) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">

            {/* Left column */}
            <div className="flex flex-col gap-4">

              {/* Quick Actions */}
              <Card title="Quick Actions" subtitle="Print or export this report">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handlePrint}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                               border border-white/10 bg-white/5 hover:bg-white/10
                               font-semibold text-sm transition-colors"
                  >
                    <Printer className="h-4 w-4 opacity-70" />
                    Print Detailed PDF Report
                  </button>
                </div>
              </Card>

              {/* Subject Mastery */}
              <Card title="Subject Mastery" subtitle="Completion % per subject">
                {subjects.length === 0 ? (
                  <p className="text-sm opacity-60">No data yet — will populate once your child starts playing in the game.</p>
                ) : (
                  <div className="space-y-5">
                    {subjects.map((s) => {
                      const pct = Math.round(s.completion);
                      const { bar, text } = scoreColor(pct);
                      return (
                        <div key={s.subjectId}>
                          <div className="flex items-center justify-between mb-2 text-sm">
                            <div>
                              <span className="font-semibold">{s.subjectName}</span>
                              <span className="opacity-40 text-xs ml-2">
                                {formatTime(s.totalTimeSpentSec)}
                              </span>
                            </div>
                            <span className={`font-extrabold text-base ${text}`}>{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full bg-gradient-to-r ${bar}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

            </div>

            {/* Right column — Weak Areas */}
            <Card title="Weak Areas Summary" subtitle="Subjects that need attention">
              {weakAreas.length === 0 ? (
                <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm py-2">
                  <Trophy className="h-4 w-4 flex-shrink-0" />
                  Everything looks great! No weak areas identified.
                </div>
              ) : (
                <div>
                  {weakAreas.map((s, i) => {
                    const pct = Math.round(s.completion);
                    const { bg, text } = scoreColor(pct);
                    return (
                      <div key={s.subjectId}>
                        <div className="py-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
                            <span className="font-bold text-sm">{s.subjectName}</span>
                            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${bg} ${text}`}>
                              {pct}%
                            </span>
                          </div>
                          <p className="text-sm opacity-55 pl-5 leading-relaxed">
                            Needs more practice — only {pct}% mastery achieved.
                            {pct < 20 && " Strongly recommend additional support sessions."}
                          </p>
                          {s.lastPlayedAt && (
                            <p className="text-xs opacity-35 pl-5 mt-1">
                              Last played: {new Date(s.lastPlayedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {i < weakAreas.length - 1 && (
                          <div className="border-t border-white/5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

          </div>
        </>
      )}

    </PageTransition>
  );
}
