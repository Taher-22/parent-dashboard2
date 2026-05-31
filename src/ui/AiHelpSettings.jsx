import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Save, History, AlertCircle } from "lucide-react";
import { useChildren } from "../state/ChildrenContext.jsx";
import { getAiHelpConfig, updateAiHelpConfig, getAiHelpHistory } from "../lib/api.js";
import Card from "./Card.jsx";

/**
 * Parent control for the in-game "AI help after X mistakes" feature.
 * Per child: enable/disable, threshold X, and whether mistakes are counted
 * "in a row" (streak) or "per session" (total). Also shows a log of the hints
 * the AI has sent the child.
 */
export default function AiHelpSettings() {
  const { kids, activeChildId, setActiveChildId } = useChildren();

  const [enabled, setEnabled]     = useState(true);
  const [threshold, setThreshold] = useState(3);
  const [mode, setMode]           = useState("streak");
  const [duration, setDuration]   = useState(15);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState(null);
  const [history, setHistory]     = useState([]);

  const selectedChild = kids.find((k) => k.id === activeChildId) ?? null;

  useEffect(() => {
    if (!activeChildId) return;
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const cfg = await getAiHelpConfig(activeChildId);
        if (!alive) return;
        setEnabled(cfg.aiHelpEnabled);
        setThreshold(cfg.aiHelpThreshold);
        setMode(cfg.aiHelpMode);
        if (cfg.aiHelpDurationSec != null) setDuration(cfg.aiHelpDurationSec);
      } catch (e) {
        if (alive) setError(e.message || "Failed to load settings");
      } finally {
        if (alive) setLoading(false);
      }
      try {
        const h = await getAiHelpHistory(activeChildId);
        if (alive) setHistory(h.items || []);
      } catch {
        /* history is best-effort */
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeChildId]);

  async function handleSave() {
    if (!activeChildId || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateAiHelpConfig(activeChildId, {
        aiHelpEnabled: enabled,
        aiHelpThreshold: Number(threshold),
        aiHelpMode: mode,
        aiHelpDurationSec: Number(duration),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="In-Game AI Help">
      <p className="text-sm opacity-75 mb-4">
        When your child gets several questions wrong, the game asks the AI for a friendly hint about
        the question they&apos;re stuck on and shows it to encourage them — without giving away the answer.
      </p>

      {kids.length === 0 ? (
        <p className="text-sm opacity-60">Add a child first to configure AI help.</p>
      ) : (
        <>
          {/* Child selector */}
          <div className="flex gap-2 flex-wrap mb-5">
            {kids.map((kid) => {
              const isActive = kid.id === activeChildId;
              return (
                <button
                  key={kid.id}
                  onClick={() => setActiveChildId(kid.id)}
                  className={`px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all
                    ${
                      isActive
                        ? "bg-emerald-500/20 border-emerald-400/40 text-white"
                        : "border-white/10 bg-white/5 hover:bg-white/10 opacity-70 hover:opacity-100"
                    }`}
                >
                  {kid.displayName}
                </button>
              );
            })}
          </div>

          {selectedChild && (
            <div className="space-y-4">
              {/* Enabled toggle */}
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="text-sm font-semibold">Enable AI help after mistakes</span>
                <button
                  onClick={() => setEnabled((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    enabled ? "bg-emerald-500" : "bg-white/20"
                  }`}
                  aria-pressed={enabled}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      enabled ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </label>

              {/* Threshold */}
              <div className={enabled ? "" : "opacity-40 pointer-events-none"}>
                <div className="text-sm font-semibold mb-1">Trigger after this many mistakes (X)</div>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-24 rounded-xl p-2 bg-black/5 dark:bg-white/8 border border-white/10 text-sm outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Mode */}
              <div className={enabled ? "" : "opacity-40 pointer-events-none"}>
                <div className="text-sm font-semibold mb-1">Count mistakes…</div>
                <div className="flex gap-2">
                  {[
                    { v: "streak", label: "In a row" },
                    { v: "total", label: "Per session" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setMode(opt.v)}
                      className={`px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all
                        ${
                          mode === opt.v
                            ? "bg-emerald-500/20 border-emerald-400/40 text-white"
                            : "border-white/10 bg-white/5 hover:bg-white/10 opacity-70 hover:opacity-100"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs opacity-60 mt-1.5">
                  {mode === "streak"
                    ? `The game offers a hint after ${threshold} wrong answer${threshold > 1 ? "s" : ""} in a row (the counter resets when they answer correctly).`
                    : `The game offers a hint after ${threshold} wrong answer${threshold > 1 ? "s" : ""} in a single play session.`}
                </p>
              </div>

              {/* Display duration */}
              <div className={enabled ? "" : "opacity-40 pointer-events-none"}>
                <div className="text-sm font-semibold mb-1">Keep the hint on screen for (seconds)</div>
                <input
                  type="number"
                  min={3}
                  max={120}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-24 rounded-xl p-2 bg-black/5 dark:bg-white/8 border border-white/10 text-sm outline-none focus:border-emerald-500/50"
                />
                <p className="text-xs opacity-60 mt-1.5">
                  How long the hint message stays visible in the game before it fades (3–120s).
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}

              <motion.button
                onClick={handleSave}
                disabled={saving || loading}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-2 rounded-xl font-bold py-2.5 px-5 text-sm transition-all
                  ${
                    saved
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                      : "bg-blue-500 hover:bg-blue-400 text-white disabled:opacity-40"
                  }`}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : saved ? "Saved!" : "Save settings"}
              </motion.button>

              {/* History */}
              {history.length > 0 && (
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3 opacity-80">
                    <History className="h-4 w-4" /> Recent hints sent to {selectedChild.displayName}
                  </div>
                  <div className="space-y-2 max-h-80 overflow-auto pr-1">
                    {history.map((ev) => (
                      <div key={ev.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                        {ev.question && (
                          <div className="opacity-70">
                            <span className="font-semibold">Q:</span> {ev.question}
                          </div>
                        )}
                        {ev.userAnswer && (
                          <div className="opacity-60 text-xs mt-0.5">Their answer: {ev.userAnswer}</div>
                        )}
                        <div className="mt-1.5 flex items-start gap-2">
                          <Brain className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                          <span>{ev.hint}</span>
                        </div>
                        <div className="text-[11px] opacity-40 mt-1">
                          {new Date(ev.createdAt).toLocaleString()}
                          {ev.mode ? ` · ${ev.mode === "streak" ? "in a row" : "per session"}` : ""}
                          {ev.triggerCount != null ? ` · after ${ev.triggerCount}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
