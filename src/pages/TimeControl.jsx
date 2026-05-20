import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock3, ShieldCheck, BedDouble, Save, RotateCcw } from "lucide-react";

import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import PageTransition from "../ui/PageTransition.jsx";
import { useChildren } from "../state/ChildrenContext.jsx";
import { getTimeControls, updateTimeControls } from "../lib/api.js";
import { clamp } from "../utils/format.js";

const DEFAULTS = {
  dailyMinutes:       60,
  sessionMinutes:     25,
  breakMinutes:       7,
  maxSessionsAllowed: 3,
  bedtimeBlock:       "20:30",
  blockAfterBedtime:  true,
};

function Slider({ label, value, min, max, step = 1, unit = "min", onChange, accent = "var(--blob1)" }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-3">
        <span className="font-semibold">{label}</span>
        <span className="font-extrabold opacity-80">{value} {unit}</span>
      </div>
      <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, rgb(${accent}), rgba(var(--blob3),.55))` }}
        />
      </div>
      <input
        className="mt-2 w-full accent-emerald-400"
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function TimeControl() {
  const { activeChildId } = useChildren();

  const [state,   setState]   = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState(null);

  // parse "HH:MM" → { hour, minute }
  function parseBedtime(str) {
    const [h, m] = (str ?? "20:30").split(":").map(Number);
    return { hour: h ?? 20, minute: m ?? 30 };
  }

  const bedtime = parseBedtime(state.bedtimeBlock);

  function setBedtimeHour(delta) {
    setState((s) => {
      const { hour, minute } = parseBedtime(s.bedtimeBlock);
      const next = clamp(hour + delta, 0, 23);
      return { ...s, bedtimeBlock: `${String(next).padStart(2,"0")}:${String(minute).padStart(2,"0")}` };
    });
  }

  function set(key, value) {
    setState((s) => ({ ...s, [key]: value }));
  }

  // Load from API when child changes
  useEffect(() => {
    if (!activeChildId) return;
    setLoading(true);
    setError(null);
    getTimeControls(activeChildId)
      .then((data) => {
        setState({
          dailyMinutes:       data.dailyMinutes       ?? DEFAULTS.dailyMinutes,
          sessionMinutes:     data.sessionMinutes     ?? DEFAULTS.sessionMinutes,
          breakMinutes:       data.breakMinutes       ?? DEFAULTS.breakMinutes,
          maxSessionsAllowed: data.maxSessionsAllowed ?? DEFAULTS.maxSessionsAllowed,
          bedtimeBlock:       data.bedtimeBlock       ?? DEFAULTS.bedtimeBlock,
          blockAfterBedtime:  data.blockAfterBedtime  ?? DEFAULTS.blockAfterBedtime,
        });
      })
      .catch(() => setError("Failed to load time controls."))
      .finally(() => setLoading(false));
  }, [activeChildId]);

  const handleSave = useCallback(async () => {
    if (!activeChildId || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateTimeControls(activeChildId, state);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [activeChildId, state, saving]);

  const bedtimeLabel = `${String(bedtime.hour).padStart(2,"0")}:${String(bedtime.minute).padStart(2,"0")}`;

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Time Control</h1>
          <p className="opacity-75 mt-1">Set playtime limits, breaks, and bedtime rules.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Badge tone="green"><ShieldCheck className="h-3.5 w-3.5" /> Safety</Badge>
          <Badge tone="orange"><Clock3 className="h-3.5 w-3.5" /> Routine</Badge>
          <Badge tone="purple"><BedDouble className="h-3.5 w-3.5" /> Sleep</Badge>
        </div>
      </div>

      {!activeChildId && (
        <div className="opacity-60 text-sm text-center py-16">
          Add a child first to configure time controls.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
          {[0,1].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 animate-pulse">
              <div className="h-4 w-24 rounded bg-white/10" />
              {[0,1,2].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-36 rounded bg-white/8" />
                  <div className="h-2 rounded-full bg-white/8" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!loading && activeChildId && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">

            {/* Limits */}
            <Card title="Limits" subtitle="Set consistent boundaries">
              <div className="space-y-6">
                <Slider
                  label="Daily minutes limit"
                  min={30} max={180}
                  value={state.dailyMinutes}
                  onChange={(v) => set("dailyMinutes", clamp(v, 30, 180))}
                  accent="var(--blob1)"
                />
                <Slider
                  label="Session limit"
                  min={10} max={60}
                  value={state.sessionMinutes}
                  onChange={(v) => set("sessionMinutes", clamp(v, 10, 60))}
                  accent="var(--blob4)"
                />
                <Slider
                  label="Break length"
                  min={3} max={20}
                  value={state.breakMinutes}
                  onChange={(v) => set("breakMinutes", clamp(v, 3, 20))}
                  accent="var(--blob3)"
                />
                <Slider
                  label="Max sessions per day"
                  min={1} max={10}
                  unit="sessions"
                  value={state.maxSessionsAllowed}
                  onChange={(v) => set("maxSessionsAllowed", clamp(v, 1, 10))}
                  accent="var(--blob2)"
                />
              </div>
            </Card>

            {/* Bedtime */}
            <Card title="Bedtime Rule" subtitle="Block access after bedtime">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm opacity-70">Bedtime</div>
                  <div className="text-4xl font-black mt-1">{bedtimeLabel}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-xl px-4 py-2 border border-white/15 bg-white/10 hover:bg-white/20 font-semibold transition-colors"
                    onClick={() => setBedtimeHour(-1)}
                  >-1h</button>
                  <button
                    className="rounded-xl px-4 py-2 border border-white/15 bg-white/10 hover:bg-white/20 font-semibold transition-colors"
                    onClick={() => setBedtimeHour(+1)}
                  >+1h</button>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Block after bedtime</div>
                <button
                  onClick={() => set("blockAfterBedtime", !state.blockAfterBedtime)}
                  className={`rounded-full px-4 py-2 border font-extrabold transition-colors ${
                    state.blockAfterBedtime
                      ? "bg-emerald-400/25 border-emerald-400/30 text-emerald-100"
                      : "bg-white/10 border-white/15"
                  }`}
                >
                  {state.blockAfterBedtime ? "ON" : "OFF"}
                </button>
              </div>

              <div className="mt-6 rounded-2xl p-4 border border-white/10 bg-white/10 dark:bg-white/5 text-sm">
                <div className="font-semibold mb-1">Preview</div>
                <div className="opacity-75">
                  Sessions starting after <span className="font-semibold">{bedtimeLabel}</span> will be{" "}
                  <span className="font-semibold">{state.blockAfterBedtime ? "blocked" : "allowed"}</span>.
                  Daily limit: <span className="font-semibold">{state.dailyMinutes} min</span> ·{" "}
                  Max <span className="font-semibold">{state.sessionMinutes} min</span> per session ·{" "}
                  <span className="font-semibold">{state.breakMinutes} min</span> break between sessions.
                </div>
              </div>
            </Card>
          </div>

          {/* Save bar */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
            <p className="text-sm opacity-60">Changes are not saved automatically.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setState(DEFAULTS)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 border border-white/15 bg-white/8 hover:bg-white/15 text-sm font-semibold transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <motion.button
                onClick={handleSave}
                disabled={saving || !activeChildId}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 font-bold text-sm transition-all ${
                  saved
                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                    : "bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-40"
                }`}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
              </motion.button>
            </div>
          </div>
        </>
      )}
    </PageTransition>
  );
}
