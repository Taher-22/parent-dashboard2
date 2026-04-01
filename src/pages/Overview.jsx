import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, addChild } from "../lib/api";

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

  // create child form
  const [childName, setChildName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [creating, setCreating] = useState(false);

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

  async function handleAddChild() {
    if (!childName.trim()) return;

    try {
      setCreating(true);

      const child = await addChild(childName.trim(), birthdate);
      setGeneratedCode(child.childCode);

      setChildName("");
      setBirthdate("");

      // 🔥 This updates Overview list + Topbar instantly
      await reloadChildren();
    } catch (err) {
      alert("Failed to create child");
    } finally {
      setCreating(false);
    }
  }

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

      {/* ADD CHILD */}
      <Card title="Add Child (Game Access Code)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="rounded-lg p-2 bg-black/5 dark:bg-white/10"
            placeholder="Child name"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
          />

          <input
            type="date"
            className="rounded-lg p-2 bg-black/5 dark:bg-white/10"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />

          <button
            onClick={handleAddChild}
            disabled={creating}
            className="rounded-lg bg-emerald-500 text-black font-bold py-2"
          >
            {creating ? "Creating..." : "Create Child"}
          </button>
        </div>

        {generatedCode && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10">
            <p className="text-sm opacity-80">Give this code to your child to enter in the game:</p>
            <p className="text-2xl font-black tracking-widest mt-1">{generatedCode}</p>
          </div>
        )}
      </Card>

      {/* CHILDREN LIST */}
      {kids.length > 0 && (
        <Card title="Your Children">
          <div className="space-y-2">
            {kids.map((c) => (
              <div
                key={c.id}
                className="flex justify-between rounded-lg p-3 bg-black/5 dark:bg-white/10"
              >
                <span className="font-semibold">{c.displayName}</span>
                <span className="font-mono text-sm opacity-80">{c.childCode}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

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
