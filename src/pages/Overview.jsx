import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../lib/api";

import PageTransition from "../ui/PageTransition.jsx";
import Card from "../ui/Card.jsx";
import AnimatedCounter from "../ui/AnimatedCounter.jsx";
import Badge from "../ui/Badge.jsx";

import { motion } from "framer-motion";
import { Sparkles, Clock3, ListChecks } from "lucide-react";

import { useChildren } from "../state/ChildrenContext.jsx";

export default function Overview() {
  const navigate = useNavigate();

  // shared children state
  const { kids, activeChild, reloadChildren, loadingKids } = useChildren();

  // auth (used only to validate token + redirect)
  const [loading, setLoading] = useState(true);

  // KPIs default 0 (real data later)
  const kpis = useMemo(
    () => ({
      todayFocusMinutes: 0,
      weeklyProgressPct: 0,
    }),
    []
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Validate token quickly
    getMe()
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
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
          <Badge tone="purple">
            <Sparkles className="h-3.5 w-3.5" /> ADHD-friendly
          </Badge>
          <Badge tone="green">
            <Clock3 className="h-3.5 w-3.5" /> Micro-sessions
          </Badge>
          <Badge tone="orange">
            <ListChecks className="h-3.5 w-3.5" /> Interventions
          </Badge>
        </div>
      </div>

      {/* ACTIVE CHILD */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="font-semibold text-lg">
            {loadingKids ? (
              "Loading child..."
            ) : activeChild ? (
              `Child: ${activeChild.displayName}`
            ) : (
              "No child added yet"
            )}
          </div>
          <Badge tone="blue">Mode: {activeChild ? "Active" : "Inactive"}</Badge>
        </div>
      </Card>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title="Today Focus Minutes">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-emerald-400">
              <AnimatedCounter value={kpis.todayFocusMinutes} />
            </span>
            <span className="pb-2 opacity-70">min</span>
          </div>
        </Card>

        <Card title="Weekly Progress">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-purple-400">
              <AnimatedCounter value={kpis.weeklyProgressPct} />
            </span>
            <span className="pb-2 opacity-70">%</span>
          </div>
        </Card>

        <Card title="Parent Insight" right={<Badge tone="blue">Mode: Active</Badge>}>
          <p className="text-sm opacity-80">
            Predictable, short sessions improve regulation. Adjust routines in <b>Time Control</b>.
          </p>
        </Card>
      </div>

      {/* CHART + SUPPORT AREAS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Learning Time Trend (7 Days)">
          <div className="h-[260px] flex items-center justify-center opacity-60">No data yet</div>
        </Card>

        <Card title="Support Areas">
          <div className="opacity-60 text-sm">No support signals yet</div>
        </Card>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Recent Activity">
          <div className="opacity-60 text-sm">No recent activity yet</div>
        </Card>
      </div>
    </PageTransition>
  );
}
