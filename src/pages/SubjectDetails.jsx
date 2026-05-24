import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Coins as CoinsIcon, Trophy, TrendingUp } from "lucide-react";

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
        <Card title="Performance Summary">
          <p className="opacity-80 text-sm">
            Progress trends, engagement level, and strengths will appear here.
          </p>
        </Card>

        <Card title="Common Difficulties">
          <p className="opacity-80 text-sm">
            Detected weak points and suggested focus areas.
          </p>
        </Card>

        <Card title="Recent Sessions">
          <p className="opacity-80 text-sm">
            Game activity and outcomes.
          </p>
        </Card>

        <Card title="AI Insights">
          <p className="opacity-80 text-sm">
            Personalized recommendations based on learning behavior
            and engagement patterns.
          </p>
          <button
            onClick={() => navigate(`/ai?subject=${slug}`)}
            className="mt-4 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition"
          >
            Ask AI about {slug}
          </button>
        </Card>
      </div>
    </PageTransition>
  );
}
