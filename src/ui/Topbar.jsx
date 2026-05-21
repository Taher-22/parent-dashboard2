import { useEffect, useState } from "react";
import { Moon, Sun, UserRound, LogOut, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../state/ThemeContext.jsx";
import { useChildren } from "../state/ChildrenContext.jsx";
import Badge from "./Badge.jsx";
import { logout } from "../three/auth/auth";

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
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { kids, activeChild, setActiveChildId, loadingKids } = useChildren();

  const [copied, setCopied] = useState(false);
  function copyCode() {
    if (!activeChild?.childCode) return;
    navigator.clipboard.writeText(activeChild.childCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
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
    <div className="panel stroke rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
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
      <div className="flex items-center gap-3">
        {activeChild && (
          isOnline
            ? <Badge tone="green">Online</Badge>
            : <Badge tone="blue">Offline</Badge>
        )}

        {/* THEME TOGGLE */}
        <button
          onClick={toggleTheme}
          className="rounded-xl px-4 py-2 border border-white/15 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 flex items-center gap-2 font-semibold"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? "Light" : "Dark"}
        </button>

        {/* LOGOUT */}
        <button
          onClick={() => logout(navigate)}
          className="rounded-xl px-4 py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-2 font-semibold"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
