import { Moon, Sun, UserRound, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../state/ThemeContext.jsx";
import { useChildren } from "../state/ChildrenContext.jsx";
import Badge from "./Badge.jsx";
import { logout } from "../three/auth/auth";

export default function Topbar() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { kids, activeChild, setActiveChildId, loadingKids } = useChildren();

  return (
    <div className="panel stroke rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
      {/* LEFT — Child Info */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400/30 via-emerald-300/25 to-purple-400/30 border border-white/10 grid place-items-center">
          <UserRound className="h-5 w-5 opacity-80" />
        </div>

        <div>
          <div className="text-xs opacity-70">Child</div>

          {loadingKids ? (
            <div className="font-semibold opacity-60">Loading...</div>
          ) : activeChild ? (
            <div className="font-semibold">{activeChild.displayName}</div>
          ) : (
            <div className="font-semibold opacity-60">No child selected</div>
          )}

          {/* CHILD SWITCHER */}
          {kids.length > 1 && (
            <select
              value={activeChild?.id || ""}
              onChange={(e) => setActiveChildId(e.target.value)}
              className="mt-1 text-xs rounded-md bg-black/10 dark:bg-white/10 px-2 py-1"
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
        {activeChild && <Badge tone="blue">Active</Badge>}

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
