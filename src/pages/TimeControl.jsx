import { useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import { defaultLimits } from "../data/mock.js";
import { motion } from "framer-motion";
import { clamp } from "../utils/format.js";
import { Clock3, ShieldCheck, BedDouble } from "lucide-react";

function Slider({ label, value, min, max, step = 1, onChange, accent = "var(--blob1)" }) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <div className="font-semibold">{label}</div>
        <div className="opacity-80">{value} min</div>
      </div>

      <div className="mt-3">
        <div className="h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, rgb(${accent}), rgba(var(--blob3),.55))`,
            }}
          />
        </div>

        <input
          className="mt-3 w-full accent-emerald-400"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

export default function TimeControl() {
  const [state, setState] = useState(defaultLimits);
  const bedtimeLabel = useMemo(() => {
    const hh = String(state.bedtimeHour).padStart(2, "0");
    const mm = String(state.bedtimeMinute).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [state.bedtimeHour, state.bedtimeMinute]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-3xl font-extrabold tracking-tight">Time Control</div>
          <div className="opacity-75 mt-1">
            Use Case 04 — Set Playtime Limits (daily + session + breaks + bedtime rules).
          </div>
        </div>
        <div className="hidden md:flex gap-2">
          <Badge tone="green"><ShieldCheck className="h-3.5 w-3.5" /> Safety</Badge>
          <Badge tone="orange"><Clock3 className="h-3.5 w-3.5" /> Routine</Badge>
          <Badge tone="purple"><BedDouble className="h-3.5 w-3.5" /> Sleep</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <Card title="Limits" subtitle="Set consistent boundaries (ADHD-friendly)">
          <div className="space-y-6">
            <Slider
              label="Daily minutes limit"
              min={30}
              max={180}
              value={state.dailyMinutesLimit}
              onChange={(v) => setState((s) => ({ ...s, dailyMinutesLimit: clamp(v, 30, 180) }))}
              accent="var(--blob1)"
            />
            <Slider
              label="Session limit"
              min={10}
              max={60}
              value={state.sessionMinutesLimit}
              onChange={(v) => setState((s) => ({ ...s, sessionMinutesLimit: clamp(v, 10, 60) }))}
              accent="var(--blob4)"
            />
            <Slider
              label="Break length"
              min={3}
              max={20}
              value={state.breakMinutes}
              onChange={(v) => setState((s) => ({ ...s, breakMinutes: clamp(v, 3, 20) }))}
              accent="var(--blob3)"
            />
          </div>
        </Card>

        <Card title="Bedtime Rule" subtitle="Block access after bedtime">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm opacity-80">Bedtime</div>
              <div className="text-4xl font-black mt-1">{bedtimeLabel}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl px-4 py-2 border border-white/15 bg-white/10 hover:bg-white/20 font-semibold"
                onClick={() => setState((s) => ({ ...s, bedtimeHour: clamp(s.bedtimeHour - 1, 0, 23) }))}
              >
                -1h
              </button>
              <button
                className="rounded-xl px-4 py-2 border border-white/15 bg-white/10 hover:bg-white/20 font-semibold"
                onClick={() => setState((s) => ({ ...s, bedtimeHour: clamp(s.bedtimeHour + 1, 0, 23) }))}
              >
                +1h
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Block after bedtime</div>
            <button
              onClick={() => setState((s) => ({ ...s, blockAfterBedtime: !s.blockAfterBedtime }))}
              className={
                "rounded-full px-4 py-2 border font-extrabold " +
                (state.blockAfterBedtime
                  ? "bg-emerald-400/25 border-emerald-400/30 text-emerald-100"
                  : "bg-white/10 border-white/15")
              }
            >
              {state.blockAfterBedtime ? "ON" : "OFF"}
            </button>
          </div>

          <div className="mt-6 rounded-2xl p-4 border border-white/10 bg-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">Preview</div>
            <div className="text-sm opacity-80 mt-1">
              If a session starts after <span className="font-semibold">{bedtimeLabel}</span>, access will be{" "}
              <span className="font-semibold">{state.blockAfterBedtime ? "blocked" : "allowed"}</span>.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
