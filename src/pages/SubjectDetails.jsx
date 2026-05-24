import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Coins as CoinsIcon, Trophy, TrendingUp,
  Clock, Target, Activity, AlertTriangle, CheckCircle2, XCircle, TimerOff,
} from "lucide-react";

import PageTransition from "../ui/PageTransition.jsx";
import Card from "../ui/Card.jsx";
import { useChildren } from "../state/ChildrenContext.jsx";
import { getChildReport } from "../lib/api.js";

// Friendly URL slug → backend subjectId. Add new subjects here as they ship.
// Whether the Coins/Scores panel actually renders is decided at runtime by
// checking if any scores have been recorded for that subject — not by a
// hardcoded allowlist.
const SLUG_TO_SUBJECT_ID = {
  math:      "subj_math",
  english:   "seed_s_english",
  reading:   "seed_s_english",
  science:   "seed_s_science",
  astronomy: "seed_s_science",
  minigames: "seed_s_minigames",
};

// Friendly display name for the subject section, by backend id.
const SUBJECT_LABEL = {
  subj_math:        "Math",
  seed_s_english:   "English",
  seed_s_science:   "Science",
  seed_s_minigames: "Minigames",
};

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0m";
  const totalMin = Math.floor(seconds / 60);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const TONE_CLASSES = {
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  sky:     "text-sky-400     bg-sky-500/10     border-sky-500/25",
  amber:   "text-amber-400   bg-amber-500/10   border-amber-500/25",
  fuchsia: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/25",
};

function StatLine({ icon: Icon, label, value, sub, tone = "emerald" }) {
  const cls = TONE_CLASSES[tone] || TONE_CLASSES.emerald;
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${cls}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest opacity-70">{label}</div>
        <div className="font-extrabold text-lg leading-tight truncate">{value}</div>
        {sub && <div className="text-[10px] opacity-60 truncate">{sub}</div>}
      </div>
    </div>
  );
}

function EmptyHint({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="h-4 w-4 mt-0.5 opacity-50 shrink-0" />
      <p className="text-sm opacity-70">{children}</p>
    </div>
  );
}

export default function SubjectDetails() {
  const { subjectId: slug } = useParams();
  const navigate = useNavigate();
  const { activeChild, activeChildId } = useChildren();

  const backendSubjectId = SLUG_TO_SUBJECT_ID[slug] || null;
  const subjectLabel = SUBJECT_LABEL[backendSubjectId] || slug;

  const [report, setReport] = useState(null);

  // Pull the report whenever this subject view is open — even unmapped slugs
  // get a fetch, since the report is also what decides if we have data to show.
  useEffect(() => {
    if (!activeChildId) { setReport(null); return; }
    let cancelled = false;
    async function fetchOnce() {
      try {
        const r = await getChildReport(activeChildId);
        if (!cancelled) setReport(r);
      } catch { /* ignore */ }
    }
    fetchOnce();
    const id = setInterval(() => {
      if (document.hidden) return;
      fetchOnce();
    }, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, [activeChildId]);

  // Filter scores to just this subject's
  const subjectScores = (report?.recentScores || []).filter(
    (s) => s.subjectId === backendSubjectId
  );
  const subjectRow = (report?.subjects || []).find(
    (s) => s.subjectId === backendSubjectId
  );
  const bestScore = subjectRow?.bestScore ?? null;
  const totalSubjectScore = subjectScores.reduce((sum, s) => sum + (s.score || 0), 0);

  // Data-driven gate: only render the Coins/Scores panels if we actually have
  // score records for this subject. Hide for subjects that have never had any.
  const hasScoreData = bestScore != null || subjectScores.length > 0;

  // Wrong answers for THIS subject (drives Common Difficulties)
  const subjectWrongs = (report?.recentWrongAnswers || []).filter(
    (a) => a.subjectId === backendSubjectId
  );

  // Sessions for THIS subject (drives Recent Sessions)
  const subjectSessions = (report?.recentSessions || []).filter(
    (s) => s.subjectId === backendSubjectId
  );

  // Detect the most-missed questions for the difficulty panel
  const repeatedWrongs = useMemo(() => {
    const counts = new Map();
    for (const w of subjectWrongs) {
      const key = w.question || "(no question text)";
      const entry = counts.get(key) || { question: key, times: 0, sampleCorrect: w.correctAnswer };
      entry.times += 1;
      counts.set(key, entry);
    }
    return Array.from(counts.values())
      .sort((a, b) => b.times - a.times)
      .slice(0, 4);
  }, [subjectWrongs]);

  // Has this subject been touched at all? — drives Performance Summary content vs empty state
  const hasAnyActivity =
    !!subjectRow && (
      (subjectRow.timeSpentSec || 0) > 0 ||
      (subjectRow.sessionsCount || 0) > 0 ||
      (subjectRow.answersTotal || 0) > 0 ||
      hasScoreData
    );

  return (
    <PageTransition>
      <div>
        <h1 className="text-3xl font-extrabold capitalize">
          {slug} Overview
        </h1>
        <p className="opacity-75 mt-1">
          Detailed insights and learning patterns.
        </p>
      </div>

      {/* ───────── COINS + SCORES — shown only if this subject has score records ───────── */}
      {hasScoreData && (
        <>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Coins">
              <div className="flex items-end gap-2">
                <CoinsIcon className="h-7 w-7 text-amber-400 mb-1.5" />
                <span className="text-5xl font-black text-amber-400">
                  {activeChild?.coins ?? 0}
                </span>
                <span className="pb-2 opacity-70">coins</span>
              </div>
              <div className="text-[11px] opacity-55 mt-1">
                Total balance — editable on Overview.
              </div>
            </Card>

            <Card title={`Best ${subjectLabel} Score`}>
              <div className="flex items-end gap-2">
                <Trophy className="h-7 w-7 text-yellow-300 mb-1.5" />
                <span className="text-5xl font-black text-yellow-300">
                  {bestScore ?? "—"}
                </span>
              </div>
              <div className="text-[11px] opacity-55 mt-1">
                Highest single score recorded.
              </div>
            </Card>

            <Card title={`Total ${subjectLabel} Score`}>
              <div className="flex items-end gap-2">
                <TrendingUp className="h-7 w-7 text-emerald-400 mb-1.5" />
                <span className="text-5xl font-black text-emerald-400">
                  {totalSubjectScore}
                </span>
              </div>
              <div className="text-[11px] opacity-55 mt-1">
                Sum of the {subjectScores.length} most recent score{subjectScores.length === 1 ? "" : "s"}.
              </div>
            </Card>
          </div>

          <Card title={`Recent ${subjectLabel} Scores`} className="mt-4">
            <div className="divide-y divide-white/5">
              {subjectScores.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.2) }}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-yellow-300/15 border border-yellow-300/30 grid place-items-center font-extrabold text-yellow-200">
                      {s.score >= 1000 ? `${Math.round(s.score / 100) / 10}k` : s.score}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {s.label || `Run`}
                      </div>
                      <div className="text-[11px] opacity-55">{formatWhen(s.createdAt)}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm font-mono">
                    <span className="text-yellow-200 font-bold">{s.score}</span>
                    {s.maxScore != null && s.maxScore > 0 && (
                      <span className="opacity-50"> / {s.maxScore}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ───────── GENERIC PANELS (every subject) ───────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">

        {/* PERFORMANCE SUMMARY — completion %, accuracy, time, sessions */}
        <Card title="Performance Summary">
          {!hasAnyActivity ? (
            <EmptyHint icon={Activity}>
              No activity yet. Stats will appear as soon as {activeChild?.displayName || "the child"} plays.
            </EmptyHint>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatLine icon={Target}      label="Mastery"
                value={`${Math.round(subjectRow.completion || 0)}%`}        tone="emerald" />
              <StatLine icon={CheckCircle2} label="Accuracy"
                value={subjectRow.accuracyPct != null ? `${subjectRow.accuracyPct}%` : "—"}
                sub={subjectRow.answersTotal ? `${subjectRow.answersCorrect}/${subjectRow.answersTotal} answers` : null}
                tone="sky" />
              <StatLine icon={Clock}       label="Time"
                value={formatDuration(subjectRow.timeSpentSec || 0)}        tone="amber" />
              <StatLine icon={Activity}    label="Sessions"
                value={subjectRow.sessionsCount || 0}                       tone="fuchsia" />
            </div>
          )}
        </Card>

        {/* COMMON DIFFICULTIES — questions the kid keeps missing */}
        <Card title="Common Difficulties">
          {repeatedWrongs.length === 0 ? (
            <EmptyHint icon={AlertTriangle}>
              No wrong answers yet. Once they get something wrong, the most-missed questions will surface here.
            </EmptyHint>
          ) : (
            <div className="space-y-2">
              {repeatedWrongs.map((w, i) => (
                <div key={i} className="flex items-start gap-3 px-2.5 py-2 rounded-lg bg-white/5">
                  <div className="h-7 w-7 shrink-0 rounded-md bg-red-500/15 border border-red-500/30 grid place-items-center font-extrabold text-xs text-red-300">
                    {w.times > 1 ? `×${w.times}` : "✗"}
                  </div>
                  <div className="min-w-0 text-sm">
                    <div className="font-semibold truncate">{w.question}</div>
                    {w.sampleCorrect != null && (
                      <div className="text-xs opacity-60 mt-0.5">
                        Correct: <span className="font-mono text-emerald-300">{w.sampleCorrect}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* RECENT SESSIONS — last few plays of this subject */}
        <Card title="Recent Sessions">
          {subjectSessions.length === 0 ? (
            <EmptyHint icon={Activity}>
              No sessions recorded yet. Each time {activeChild?.displayName || "the child"} finishes a run, it'll show up here.
            </EmptyHint>
          ) : (
            <div className="divide-y divide-white/5">
              {subjectSessions.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Clock className="h-4 w-4 opacity-55 shrink-0" />
                    <span className="font-semibold">{formatDuration(s.durationSec || 0)}</span>
                    {s.completion != null && (
                      <span className="text-xs opacity-60">· {Math.round(s.completion)}% done</span>
                    )}
                  </div>
                  <div className="text-xs opacity-55 shrink-0">{formatWhen(s.endedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AI INSIGHTS — link to the AI chat preloaded with this subject */}
        <Card title="AI Insights">
          <p className="opacity-80 text-sm">
            Ask the AI helper for personalized notes — what to practice next,
            why a question keeps tripping them up, or how to motivate them.
          </p>
          <button
            onClick={() => navigate(`/ai?subject=${slug}`)}
            className="mt-4 px-4 py-2 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-400/30 text-fuchsia-200 font-semibold text-sm transition"
          >
            Ask AI about {subjectLabel}
          </button>
        </Card>
      </div>
    </PageTransition>
  );
}
