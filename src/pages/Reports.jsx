import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Printer, AlertTriangle, Trophy, Clock, Star, TrendingUp, Target,
  BookOpen, Award, Activity, CheckCircle2, XCircle, Calendar, Sparkles,
  ListChecks, TimerOff,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell,
} from "recharts";

import PageTransition from "../ui/PageTransition.jsx";
import Badge from "../ui/Badge.jsx";
import { useChildren } from "../state/ChildrenContext.jsx";
import { getChildReport, getTimeTrend } from "../lib/api.js";

/* ─── helpers ───────────────────────────────────────────────────────── */

function formatTime(seconds) {
  if (!seconds || seconds < 0) return "0 min";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function shortDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtAgo(d) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 0) return "just now";
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 14 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return shortDate(d);
}

function statusFromMastery(pct) {
  if (pct >= 70) return { label: "Strong",      tone: "green",  bar: "from-emerald-400 to-emerald-500" };
  if (pct >= 40) return { label: "Progressing", tone: "orange", bar: "from-yellow-400 to-amber-400"    };
  return           { label: "Needs focus",      tone: "red",    bar: "from-red-400 to-rose-500"        };
}

function accColor(pct) {
  if (pct == null) return "text-zinc-400";
  if (pct >= 75)   return "text-emerald-400";
  if (pct >= 50)   return "text-yellow-400";
  return            "text-red-400";
}

function buildNarrative(report) {
  if (!report || !report.child) return null;
  const subjects = report.subjects || [];
  const summary  = report.summary || {};
  const child    = report.child;

  if (!subjects.length) {
    return `${child.displayName} hasn't started any subjects yet. Once they begin playing, this page will populate with mastery, accuracy, and time-on-task insights.`;
  }

  const playTime = formatTime(summary.totalPlayTimeSec);
  const sessions = summary.totalSessions || 0;

  const accSubs = subjects.filter((s) => (s.answersTotal || 0) > 0);
  const totalCorrect  = accSubs.reduce((a, s) => a + (s.answersCorrect || 0), 0);
  const totalAnswered = accSubs.reduce((a, s) => a + (s.answersTotal   || 0), 0);
  const accPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  const sorted = [...subjects].sort((a, b) => (b.completion || 0) - (a.completion || 0));
  const strongest = sorted[0];
  const weakest   = sorted[sorted.length - 1];

  const parts = [];
  parts.push(
    `${child.displayName} has played ${playTime} across ${subjects.length} subject${subjects.length === 1 ? "" : "s"}` +
    (sessions ? ` over ${sessions} session${sessions === 1 ? "" : "s"}` : "") +
    "."
  );
  if (accPct != null) {
    parts.push(`Overall accuracy is ${accPct}% across ${totalAnswered} answered question${totalAnswered === 1 ? "" : "s"}.`);
  }
  if (strongest && weakest && strongest.subjectId !== weakest.subjectId) {
    const sName = strongest.subjectName, sPct = Math.round(strongest.completion || 0);
    const wName = weakest.subjectName,   wPct = Math.round(weakest.completion   || 0);
    if (wPct < 50) {
      parts.push(`Strongest area is ${sName} (${sPct}% mastery); ${wName} is the biggest opportunity at ${wPct}%.`);
    } else {
      parts.push(`Mastery is fairly even — ${sName} leads at ${sPct}%, ${wName} trails at ${wPct}%.`);
    }
  } else if (strongest) {
    parts.push(`Mastery sits at ${Math.round(strongest.completion || 0)}% in ${strongest.subjectName}.`);
  }
  if (summary.lastActivityAt) {
    parts.push(`Last active ${fmtAgo(summary.lastActivityAt)}.`);
  }
  return parts.join(" ");
}

function buildHotspots(recentWrongs) {
  const map = new Map();
  for (const w of recentWrongs || []) {
    if (!w.question) continue;
    const key = w.question.trim();
    if (!map.has(key)) {
      map.set(key, {
        question: key,
        count: 0,
        correctAnswer: w.correctAnswer,
        subjectId: w.subjectId,
        anyTimedOut: false,
      });
    }
    const entry = map.get(key);
    entry.count += 1;
    if (w.timedOut) entry.anyTimedOut = true;
  }
  return [...map.values()]
    .filter((h) => h.count >= 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/* ─── component ─────────────────────────────────────────────────────── */

export default function Reports() {
  const { kids, activeChild, activeChildId, setActiveChildId } = useChildren();

  const [report,  setReport]  = useState(null);
  const [trend,   setTrend]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!activeChildId) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setTrend(null);

    Promise.all([
      getChildReport(activeChildId),
      getTimeTrend(activeChildId).catch(() => ({ days: [] })),
    ])
      .then(([r, t]) => { setReport(r); setTrend(t); })
      .catch(() => setError("Failed to load report. Please check your connection."))
      .finally(() => setLoading(false));
  }, [activeChildId]);

  const child      = report?.child ?? activeChild;
  const subjects   = report?.subjects ?? [];
  const summary    = report?.summary  ?? {};
  const sessions   = report?.recentSessions ?? [];
  const wrongs     = report?.recentWrongAnswers ?? [];
  const scores     = report?.recentScores ?? [];
  const timeCtl    = report?.timeControls;

  const narrative  = useMemo(() => buildNarrative(report), [report]);
  const hotspots   = useMemo(() => buildHotspots(wrongs), [wrongs]);

  // Sorted views
  const masteryRank = useMemo(
    () => [...subjects].sort((a, b) => (b.completion || 0) - (a.completion || 0)),
    [subjects],
  );

  // Aggregate accuracy
  const aggAcc = useMemo(() => {
    const ts = subjects.reduce((a, s) => a + (s.answersTotal || 0), 0);
    const cs = subjects.reduce((a, s) => a + (s.answersCorrect || 0), 0);
    return ts > 0 ? { pct: Math.round((cs / ts) * 100), correct: cs, total: ts } : null;
  }, [subjects]);

  const bestRun = useMemo(() => {
    if (!scores.length) return null;
    return [...scores].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  }, [scores]);

  const trendData = useMemo(() => {
    if (!trend?.days) return [];
    return trend.days.map((d) => ({
      date:    d.date,
      label:   new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
      minutes: Math.round((d.totalTimeSec || 0) / 60),
    }));
  }, [trend]);

  const strongest = masteryRank[0];
  const focusArea = masteryRank.length > 1 ? masteryRank[masteryRank.length - 1] : null;

  function handlePrint() {
    window.print();
  }

  return (
    <PageTransition>
      {/* ── Print stylesheet ──────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { margin: 14mm 12mm; size: A4; }
          html, body {
            background: #fff !important;
            color: #111 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all chrome and unrelated content */
          .no-print, nav, aside, header,
          [data-print="hide"] { display: none !important; }
          /* Strip layout wrappers and force content full width */
          body * { visibility: hidden; }
          #report-printable, #report-printable * { visibility: visible; }
          #report-printable {
            position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0;
            color: #111 !important; background: #fff !important;
          }
          #report-printable .panel,
          #report-printable .stroke {
            background: #fff !important;
            border: 1px solid #d4d4d8 !important;
            box-shadow: none !important;
            color: #111 !important;
          }
          #report-printable .print-break-before { break-before: page; page-break-before: always; }
          #report-printable .print-avoid-break   { break-inside: avoid; page-break-inside: avoid; }
          #report-printable .text-emerald-400,
          #report-printable .text-emerald-500 { color: #047857 !important; }
          #report-printable .text-yellow-400,
          #report-printable .text-amber-400  { color: #b45309 !important; }
          #report-printable .text-red-400,
          #report-printable .text-rose-400   { color: #b91c1c !important; }
          #report-printable .text-sky-400    { color: #075985 !important; }
          #report-printable .text-purple-400 { color: #6b21a8 !important; }
          /* Gradients flatten to solid */
          #report-printable .bg-gradient-to-r { background-image: none !important; }
        }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap" data-print="hide">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reports</h1>
          <p className="opacity-75 mt-1 text-sm">
            Progress report — print or save as PDF using your browser.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {kids.length > 1 && (
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
          )}
          <button
            onClick={handlePrint}
            disabled={!report}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       border border-white/15 bg-white/8 hover:bg-white/15 disabled:opacity-40
                       font-semibold text-sm transition-colors"
          >
            <Printer className="h-4 w-4 opacity-80" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── States ───────────────────────────────────────────────────── */}
      {!activeChildId && !loading && (
        <div className="opacity-60 text-sm text-center py-16">
          Please add a child first to view their report.
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
          {[...Array(4)].map((_, i) => (
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

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Printable report body ────────────────────────────────────── */}
      {!loading && report && (
        <div id="report-printable" className="space-y-4 md:space-y-5">

          {/* Cover header (printable) */}
          <div className="panel stroke rounded-2xl p-5 md:p-6 print-avoid-break">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60 font-bold">
                  <Sparkles className="h-3.5 w-3.5" />
                  NeuroQuest progress report
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {child?.displayName ?? "—"}
                </h2>
                <div className="text-xs opacity-60 flex flex-wrap gap-x-3 gap-y-1 pt-1">
                  <span>Generated {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
                  {child?.createdAt && <span>· Account since {shortDate(child.createdAt)}</span>}
                  {summary.lastActivityAt && <span>· Last active {fmtAgo(summary.lastActivityAt)}</span>}
                </div>
              </div>
              {aggAcc && (
                <div className="text-right">
                  <div className={`text-3xl font-black ${accColor(aggAcc.pct)}`}>{aggAcc.pct}%</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Overall accuracy</div>
                  <div className="text-[10px] opacity-50 mt-0.5">{aggAcc.correct} / {aggAcc.total} answered</div>
                </div>
              )}
            </div>

            {narrative && (
              <p className="mt-4 text-sm md:text-[15px] leading-relaxed text-secondary border-t border-white/10 pt-4">
                {narrative}
              </p>
            )}
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 print-avoid-break">
            <KPI icon={Clock}      label="Play time"      value={formatTime(summary.totalPlayTimeSec)} />
            <KPI icon={Activity}   label="Sessions"       value={String(summary.totalSessions ?? 0)} />
            <KPI icon={Target}     label="Accuracy"       value={aggAcc ? `${aggAcc.pct}%` : "—"} />
            <KPI icon={TrendingUp} label="Avg mastery"    value={`${Math.round(summary.averageCompletion ?? 0)}%`} />
            <KPI icon={Award}      label="Best score"     value={bestRun ? `${bestRun.score}${bestRun.maxScore ? "/" + bestRun.maxScore : ""}` : "—"}
                                   sub={bestRun?.subjectName || (bestRun ? "Game" : null)} />
            <KPI icon={Trophy}     label="Top subject"    value={summary.mostPlayedSubject ?? "—"} />
          </div>

          {/* 7-day activity */}
          <div className="panel stroke rounded-2xl p-5 print-avoid-break">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-bold text-main flex items-center gap-2">
                  <Calendar className="h-4 w-4 opacity-70" />
                  7-day activity
                </div>
                <div className="text-xs text-muted mt-0.5">Daily play time across all subjects</div>
              </div>
              <div className="text-xs opacity-60">
                {trendData.length
                  ? `${trendData.reduce((a, d) => a + d.minutes, 0)} min total`
                  : ""}
              </div>
            </div>

            <div className="mt-4 h-40 -mx-2">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center opacity-50 text-sm">
                  No play activity in the last 7 days.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                    <XAxis dataKey="label" stroke="currentColor" opacity={0.5} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" opacity={0.5} fontSize={11} tickLine={false} axisLine={false} width={28} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        background: "rgba(20,20,30,0.92)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                      formatter={(v) => [`${v} min`, "Play time"]}
                    />
                    <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                      {trendData.map((d, i) => (
                        <Cell key={i} fill={d.minutes > 0 ? "#10b981" : "rgba(255,255,255,0.15)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Subject scorecards */}
          <div className="panel stroke rounded-2xl p-5 print-avoid-break">
            <div className="text-sm font-bold text-main flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 opacity-70" />
              Subject scorecard
            </div>
            <div className="text-xs text-muted">Mastery, accuracy, time, and best score per subject</div>

            {subjects.length === 0 ? (
              <p className="mt-4 text-sm opacity-60">
                No subjects played yet — values appear here once {child?.displayName ?? "the child"} starts the game.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {masteryRank.map((s) => {
                  const pct = Math.round(s.completion || 0);
                  const status = statusFromMastery(pct);
                  return (
                    <div
                      key={s.subjectId}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 print-avoid-break"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-[15px]">{s.subjectName}</div>
                          <div className="text-[11px] opacity-50 mt-0.5">
                            {formatTime(s.totalTimeSpentSec)} · {s.sessionsCount} session{s.sessionsCount === 1 ? "" : "s"}
                            {s.lastPlayedAt && <> · last {fmtAgo(s.lastPlayedAt)}</>}
                          </div>
                        </div>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>

                      {/* Mastery bar */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] opacity-60 mb-1">
                          <span>Mastery</span>
                          <span className="font-extrabold opacity-90">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${status.bar}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* Stat row */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <Stat label="Accuracy"
                              value={s.accuracyPct != null ? `${s.accuracyPct}%` : "—"}
                              sub={s.answersTotal ? `${s.answersCorrect}/${s.answersTotal}` : null}
                              tone={accColor(s.accuracyPct)} />
                        <Stat label="Best score"
                              value={s.bestScore != null ? String(s.bestScore) : "—"} />
                        <Stat label="Time"
                              value={formatTime(s.totalTimeSpentSec)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Two-column: hotspots + strengths/focus */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">

            {/* Common mistakes hotspots */}
            <div className="panel stroke rounded-2xl p-5 print-avoid-break">
              <div className="text-sm font-bold text-main flex items-center gap-2 mb-1">
                <ListChecks className="h-4 w-4 opacity-70" />
                Common mistakes
              </div>
              <div className="text-xs text-muted">
                Questions that came up wrong more than once recently
              </div>

              {hotspots.length === 0 ? (
                <p className="mt-4 text-sm opacity-55">
                  {wrongs.length === 0
                    ? "No wrong answers recorded yet — looking good!"
                    : "No repeating mistakes — each wrong was a different question."}
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {hotspots.map((h, i) => (
                    <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold text-sm leading-snug">{h.question}</div>
                        <Badge tone="red">×{h.count}</Badge>
                      </div>
                      {h.correctAnswer && (
                        <div className="mt-1.5 text-xs opacity-70">
                          Correct answer: <span className="font-semibold opacity-100">{h.correctAnswer}</span>
                        </div>
                      )}
                      {h.anyTimedOut && (
                        <div className="mt-1 text-[11px] flex items-center gap-1 text-amber-400">
                          <TimerOff className="h-3 w-3" /> Sometimes ran out of time
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Strengths + focus */}
            <div className="panel stroke rounded-2xl p-5 print-avoid-break">
              <div className="text-sm font-bold text-main flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 opacity-70" />
                Strengths & focus
              </div>
              <div className="text-xs text-muted">
                Where to celebrate and where to put extra practice next week
              </div>

              <div className="mt-4 space-y-3">
                {/* Strength */}
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" /> Strength
                  </div>
                  {strongest ? (
                    <p className="text-sm mt-1 leading-relaxed">
                      <span className="font-bold">{strongest.subjectName}</span> — {Math.round(strongest.completion || 0)}% mastery
                      {strongest.accuracyPct != null && <> · {strongest.accuracyPct}% accuracy ({strongest.answersCorrect}/{strongest.answersTotal})</>}.
                      {" "}Keep encouraging — they have momentum here.
                    </p>
                  ) : (
                    <p className="text-sm opacity-55 mt-1">Not enough data yet.</p>
                  )}
                </div>

                {/* Focus */}
                <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/8 p-3">
                  <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                    <AlertTriangle className="h-4 w-4" /> Focus area
                  </div>
                  {focusArea && (focusArea.completion || 0) < 70 ? (
                    <p className="text-sm mt-1 leading-relaxed">
                      <span className="font-bold">{focusArea.subjectName}</span> sits at {Math.round(focusArea.completion || 0)}% mastery
                      {focusArea.accuracyPct != null && <> with {focusArea.accuracyPct}% accuracy</>}.
                      {" "}Aim for one extra short session this week
                      {timeCtl?.sessionMinutes ? <> (~{timeCtl.sessionMinutes} min)</> : null}.
                    </p>
                  ) : (
                    <p className="text-sm opacity-55 mt-1">
                      No clear weak spot — all subjects are tracking together.
                    </p>
                  )}
                </div>

                {/* Time / sessions guidance */}
                {timeCtl && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs opacity-80 leading-relaxed">
                    <div className="font-bold opacity-100 text-sm mb-1">Your current limits</div>
                    Daily {timeCtl.dailyMinutes ?? "—"} min · session {timeCtl.sessionMinutes ?? "—"} min · break {timeCtl.breakMinutes ?? "—"} min
                    {timeCtl.bedtimeBlock && <> · bedtime block {timeCtl.bedtimeBlock}{timeCtl.blockAfterBedtime ? "" : " (off)"}</>}.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="panel stroke rounded-2xl p-5 print-avoid-break print-break-before">
            <div className="text-sm font-bold text-main flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 opacity-70" />
              Recent sessions
            </div>
            <div className="text-xs text-muted">Last {Math.min(sessions.length, 10)} play sessions</div>

            {sessions.length === 0 ? (
              <p className="mt-4 text-sm opacity-55">No sessions recorded yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider opacity-50 border-b border-white/10">
                      <th className="py-2 pr-3 font-semibold">When</th>
                      <th className="py-2 pr-3 font-semibold">Subject</th>
                      <th className="py-2 pr-3 font-semibold">Duration</th>
                      <th className="py-2 pr-3 font-semibold">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 10).map((s) => (
                      <tr key={s.id} className="border-b border-white/5 last:border-0">
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtAgo(s.endedAt)}</td>
                        <td className="py-2 pr-3">{s.subjectName || "—"}</td>
                        <td className="py-2 pr-3">{formatTime(s.durationSec)}</td>
                        <td className="py-2 pr-3">
                          {s.completion != null ? `${Math.round(s.completion)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer (printed too) */}
          <div className="text-[11px] opacity-50 text-center py-2">
            NeuroQuest · Confidential parent report · {new Date().toLocaleDateString()}
          </div>

        </div>
      )}
    </PageTransition>
  );
}

/* ─── small bits ────────────────────────────────────────────────────── */

function KPI({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] opacity-55 uppercase tracking-wider font-bold">
        {Icon && <Icon className="h-3 w-3" />}
        <span>{label}</span>
      </div>
      <span className="text-lg font-extrabold truncate">{value}</span>
      {sub && <span className="text-[11px] opacity-50 truncate">{sub}</span>}
    </div>
  );
}

function Stat({ label, value, sub, tone }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
      <div className="text-[10px] opacity-50 uppercase tracking-wider font-bold">{label}</div>
      <div className={`text-sm font-extrabold ${tone || ""}`}>{value}</div>
      {sub && <div className="text-[10px] opacity-50">{sub}</div>}
    </div>
  );
}
