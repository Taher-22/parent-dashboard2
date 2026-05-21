import { useEffect, useState } from "react";
import { Moon, Sun, Sparkles, UserRound, LogOut, Copy, Check, OctagonX, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../state/ThemeContext.jsx";
import { useChildren } from "../state/ChildrenContext.jsx";
import Badge from "./Badge.jsx";
import { logout } from "../three/auth/auth";
import { setChildForceStop } from "../lib/api.js";

// "Online" if we saw a heartbeat in the last 60s.
const ONLINE_THRESHOLD_MS = 60_000;

// Map backend subject IDs to friendly names. Add to this when new subjects ship.
const SUBJECT_NAMES = {
  subj_math:        "Math",
  seed_s_english:   "English",
  seed_s_science:   "Science",
  seed_s_minigames: "Minigames",
  seed_s_mainmenu:  "Main Menu",
};

const MAIN_MENU_ID = "seed_s_mainmenu";

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const { kids, activeChild, setActiveChildId, loadingKids } = useChildren();

  const [copied, setCopied] = useState(false);
  function copyCode() {
    if (!activeChild?.childCode) return;
    navigator.clipboard.writeText(activeChild.childCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  // Optimistic force-stop toggle so the button reacts instantly; the next 20s context poll
  // brings the true state back from the server.
  const [pendingStop, setPendingStop] = useState(null); // null = use server value
  const isStopped = pendingStop !== null ? pendingStop : !!activeChild?.forceStopped;
  async function toggleStop() {
    if (!activeChild) return;
    const next = !isStopped;
    setPendingStop(next);
    try {
      await setChildForceStop(activeChild.id, next);
      // TEMPORARY: 2s while children poll is on 1s. Bump back to 20000 when polling slows down.
      setTimeout(() => setPendingStop(null), 2000);
    } catch {
      setPendingStop(!next); // revert
      alert("Couldn't update. Try again.");
    }
  }

  // Re-render every 5s so the "online" derived flag updates as time passes
  // even if no new data arrives (e.g., game disconnects → goes offline 60s later).
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const lastSeen = activeChild?.lastSeenAt ? new Date(activeChild.lastSeenAt).getTime() : 0;
  const isOnline = lastSeen > 0 && (Date.now() - lastSeen) < ONLINE_THRESHOLD_MS;
  const currentSubjectName = activeChild?.currentSubjectId
    ? (SUBJECT_NAMES[activeChild.currentSubjectId] || activeChild.currentSubjectId)
    : null;

  return (
    <div className="panel stroke rounded-2xl px-3 md:px-5 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4 flex-wrap sm:flex-nowrap">
      {/* LEFT — Child Info */}
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400/30 via-emerald-300/25 to-purple-400/30 border border-white/10 grid place-items-center">
          <UserRound className="h-5 w-5 opacity-80" />
          {/* Online indicator dot on the avatar */}
          {activeChild && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[color:var(--bg,#0c0d16)] ${
                isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
              title={isOnline ? "In game" : "Offline"}
            />
          )}
        </div>

        <div>
          <div className="text-xs opacity-70">Child</div>

          {loadingKids ? (
            <div className="font-semibold opacity-60">Loading...</div>
          ) : activeChild ? (
            <div className="font-semibold flex items-center gap-2">
              {activeChild.displayName}
              {isOnline && activeChild.currentSubjectId === MAIN_MENU_ID && (
                <span className="text-[10px] uppercase tracking-wider font-bold text-sky-400">
                  In Main Menu
                </span>
              )}
              {isOnline && currentSubjectName && activeChild.currentSubjectId !== MAIN_MENU_ID && (
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">
                  Playing {currentSubjectName}
                </span>
              )}
              {isOnline && !currentSubjectName && (
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">
                  In game
                </span>
              )}
            </div>
          ) : (
            <div className="font-semibold opacity-60">No child selected</div>
          )}

          {/* CHILD CODE + COPY */}
          {activeChild?.childCode && (
            <button
              onClick={copyCode}
              className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-500/25 px-2 py-0.5 text-[11px] font-mono font-bold tracking-widest text-emerald-300 transition-colors"
              title="Click to copy the game access code"
            >
              {activeChild.childCode}
              {copied
                ? <Check className="h-3 w-3 opacity-80" />
                : <Copy  className="h-3 w-3 opacity-60" />}
            </button>
          )}

          {/* CHILD SWITCHER */}
          {kids.length > 1 && (
            <select
              value={activeChild?.id || ""}
              onChange={(e) => setActiveChildId(e.target.value)}
              className="mt-1 ml-1 text-xs rounded-md bg-black/10 dark:bg-white/10 px-2 py-1"
            >
              {kids.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* RIGHT — Actions */}
      <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
        {activeChild && (
          isStopped
            ? <Badge tone="red">Stopped</Badge>
            : isOnline
              ? <Badge tone="green">Online</Badge>
              : <Badge tone="blue">Offline</Badge>
        )}

        {/* PARENT FORCE-STOP per child */}
        {activeChild && (
          <button
            onClick={toggleStop}
            title={isStopped
              ? `Resume ${activeChild.displayName} — let them play again`
              : `Force stop ${activeChild.displayName} — show the blocked screen in-game`}
            className={`rounded-xl px-3 md:px-4 py-2 border flex items-center gap-2 font-semibold transition-colors ${
              isStopped
                ? "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/15 hover:bg-red-500/25 border-red-500/30 text-red-300"
            }`}
          >
            {isStopped
              ? <><Play className="h-4 w-4" /> <span className="hidden md:inline">Resume</span></>
              : <><OctagonX className="h-4 w-4" /> <span className="hidden md:inline">Stop Play</span></>}
          </button>
        )}

        {/* THEME SWITCH — 3-way: Light / Dark / Special */}
        <div className="rounded-xl border border-white/15 bg-black/5 dark:bg-white/5 p-0.5 flex items-center gap-0.5">
          {[
            { id: "light",   label: "Light",   icon: Sun      },
            { id: "dark",    label: "Dark",    icon: Moon     },
            { id: "special", label: "Special", icon: Sparkles },
          ].map(({ id, label, icon: Icon }) => {
            const active = theme === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                title={label}
                className={`rounded-lg px-2.5 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                  active
                    ? id === "special"
                      ? "bg-gradient-to-r from-fuchsia-500/25 via-cyan-400/20 to-amber-400/25 text-fuchsia-100 border border-fuchsia-400/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "opacity-55 hover:opacity-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* LOGOUT */}
        <button
          onClick={() => logout(navigate)}
          className="rounded-xl px-3 md:px-4 py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-2 font-semibold"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}
