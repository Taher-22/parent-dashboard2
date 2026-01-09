import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../lib/api";

import PageTransition from "../ui/PageTransition.jsx";
import Card from "../ui/Card.jsx";
import AnimatedCounter from "../ui/AnimatedCounter.jsx";
import TimeTrendChart from "../ui/TimeTrendChart.jsx";
import Badge from "../ui/Badge.jsx";

import {
  childProfile,
  kpis,
  weeklyMinutes,
  weakAreas,
  recentSessions
} from "../data/mock.js";

import { motion } from "framer-motion";
import { Sparkles, Clock3, ListChecks } from "lucide-react";

export default function Overview() {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔐 AUTH CHECK
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("❌ No token found");
      navigate("/login");
      return;
    }

    getMe(token)
      .then((data) => {
        console.log("✅ Auth OK:", data);
        setAuth(data.auth);
      })
      .catch((err) => {
        console.error("❌ Auth failed:", err.message);
        localStorage.removeItem("token");
        navigate("/login");
      })
      .finally(() => {
        setLoading(false);
      });
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
          <h1 className="text-3xl font-extrabold tracking-tight">
            Parent Overview
          </h1>
          <p className="opacity-75 mt-1">
            Time, progress patterns, mastery, and support signals.
          </p>
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

        <Card
          title="Parent Insight"
          right={<Badge tone="blue">Mode: {childProfile.focusMode}</Badge>}
        >
          <p className="text-sm opacity-80">
            Predictable, short sessions improve regulation.
            Adjust routines in <b>Time Control</b>.
          </p>
        </Card>
      </div>

      {/* CHART + SUPPORT AREAS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Learning Time Trend (7 Days)">
          <div className="h-[260px]">
            <TimeTrendChart data={weeklyMinutes} />
          </div>
        </Card>

        <Card title="Support Areas">
          <div className="space-y-3">
            {weakAreas.map((w) => (
              <motion.div
                key={w.subject}
                whileHover={{ x: 4 }}
                className="rounded-xl p-3 bg-white/20 dark:bg-white/10"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">{w.subject}</span>
                  <span className="text-xs font-bold text-orange-400">
                    {w.severity}
                  </span>
                </div>
                <div className="text-sm opacity-75 mt-1">{w.note}</div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Recent Activity">
          <div className="space-y-3">
            {recentSessions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl p-3 bg-white/20 dark:bg-white/10"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">{s.game}</span>
                  <span className="text-xs opacity-70">{s.time}</span>
                </div>
                <div className="text-sm opacity-80 mt-1">
                  {s.outcome}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
