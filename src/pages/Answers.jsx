import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Filter, ListChecks, ChevronDown } from "lucide-react";

import { useChildren } from "../state/ChildrenContext.jsx";
import { getChildAnswers } from "../lib/api.js";

const FILTERS = [
  { id: "all",     label: "All",     value: undefined },
  { id: "wrong",   label: "Wrong",   value: false     },
  { id: "correct", label: "Correct", value: true      },
];

const PAGE_SIZE = 50;

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7)   return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function Answers() {
  const { activeChild } = useChildren();

  const [filter, setFilter] = useState("all");
  const [subjectId, setSubjectId] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);   // { items, total, stats }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset offset when filters change
  useEffect(() => { setOffset(0); }, [filter, subjectId, activeChild?.id]);

  // Fetch
  useEffect(() => {
    if (!activeChild?.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const isCorrect = FILTERS.find((f) => f.id === filter)?.value;
    getChildAnswers(activeChild.id, {
      limit: PAGE_SIZE,
      offset,
      isCorrect,
      subjectId: subjectId || undefined,
    })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(e?.message || "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeChild?.id, filter, subjectId, offset]);

  // Build subject options from the returned items (cheap heuristic — full
  // subject list comes from /reports if we ever need it everywhere).
  const subjectOptions = useMemo(() => {
    const seen = new Map();
    (data?.items || []).forEach((a) => {
      if (a.subjectId && !seen.has(a.subjectId)) {
        seen.set(a.subjectId, a.subjectName || a.subjectId);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const stats = data?.stats;
  const items = data?.items || [];
  const total = data?.total || 0;
  const hasPrev = offset > 0;
  const hasNext = offset + items.length < total;

  if (!activeChild) {
    return (
      <div className="p-6 text-center opacity-70">
        Select a child to review answers.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ListChecks className="h-7 w-7 text-emerald-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Answer Review</h1>
          </div>
          <p className="opacity-65 text-sm mt-1">
            Every question {activeChild.displayName} has answered, newest first.
          </p>
        </div>

        {/* Stats summary */}
        {stats && (
          <div className="flex items-center gap-2 md:gap-3">
            <StatChip
              label="Accuracy"
              value={stats.accuracyPct != null ? `${stats.accuracyPct}%` : "—"}
              tone="emerald"
            />
            <StatChip
              label="Correct"
              value={stats.correctAnswers}
              tone="emerald"
              icon={CheckCircle2}
            />
            <StatChip
              label="Wrong"
              value={stats.wrongAnswers}
              tone="red"
              icon={XCircle}
            />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
              filter === f.id
                ? f.id === "wrong"
                  ? "bg-red-500/15 border-red-500/40 text-red-300"
                  : f.id === "correct"
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-white/15 border-white/30 text-white"
                : "border-white/15 opacity-65 hover:opacity-100"
            }`}
          >
            {f.label}
          </button>
        ))}

        {subjectOptions.length > 0 && (
          <div className="relative">
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="appearance-none pl-8 pr-8 py-1.5 rounded-xl text-sm font-semibold border border-white/15 bg-transparent hover:bg-white/5 cursor-pointer"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-60 pointer-events-none" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-60 pointer-events-none" />
          </div>
        )}

        <div className="ml-auto text-xs opacity-60">
          {loading ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* List */}
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : items.length === 0 && !loading ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center">
          <div className="text-sm opacity-65">No answers recorded yet.</div>
          <div className="text-xs opacity-50 mt-1">
            They'll show up here as soon as {activeChild.displayName} plays a quiz.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((a, i) => <AnswerRow key={a.id} a={a} index={i} />)}
        </div>
      )}

      {/* Pagination */}
      {(hasPrev || hasNext) && (
        <div className="flex items-center justify-between pt-2">
          <button
            disabled={!hasPrev}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
          >
            ← Previous
          </button>
          <div className="text-xs opacity-55">
            {offset + 1}–{offset + items.length} of {total}
          </div>
          <button
            disabled={!hasNext}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, tone, icon: Icon }) {
  const colors = {
    emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    red:     "bg-red-500/15 border-red-500/30 text-red-300",
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${colors[tone]}`}>
      {Icon && <Icon className="h-4 w-4" />}
      <div className="leading-tight">
        <div className="text-[9px] uppercase tracking-widest opacity-70">{label}</div>
        <div className="font-extrabold text-sm">{value}</div>
      </div>
    </div>
  );
}

function AnswerRow({ a, index }) {
  const Icon = a.isCorrect ? CheckCircle2 : XCircle;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.015, 0.25) }}
      className={`rounded-xl border p-3 md:p-4 flex items-start gap-3 ${
        a.isCorrect
          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
          : "border-red-500/25 bg-red-500/[0.06]"
      }`}
    >
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${a.isCorrect ? "text-emerald-400" : "text-red-400"}`} />

      <div className="flex-1 min-w-0">
        {/* Top row: subject + time */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-[10px] uppercase tracking-widest opacity-60 truncate">
            {a.subjectName || a.subjectId || "—"}
          </div>
          <div className="text-[11px] opacity-55 shrink-0">{formatWhen(a.createdAt)}</div>
        </div>

        {/* Question */}
        {a.question && (
          <div className="font-semibold text-sm md:text-base leading-snug">
            {a.question}
          </div>
        )}

        {/* Answers */}
        <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-3 text-xs md:text-sm">
          {a.userAnswer != null && (
            <div className="truncate">
              <span className="opacity-55">Said: </span>
              <span className={`font-mono font-bold ${a.isCorrect ? "text-emerald-300" : "text-red-300"}`}>
                {a.userAnswer}
              </span>
            </div>
          )}
          {!a.isCorrect && a.correctAnswer != null && (
            <div className="truncate">
              <span className="opacity-55">Correct: </span>
              <span className="font-mono font-bold text-emerald-300">{a.correctAnswer}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
