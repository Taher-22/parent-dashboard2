import { useState } from "react";
import { Routes, Route, Navigate, useLocation, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Clock, BarChart3, Bot, Layers, MessageSquare,
  Sun, Moon, Sparkles, OctagonX, Play, LogOut, Download, Settings,
  ChevronDown, Check,
} from "lucide-react";

import { useTheme } from "../state/ThemeContext.jsx";
import { useChildren } from "../state/ChildrenContext.jsx";
import { setChildForceStop } from "../lib/api.js";
import { logout } from "../three/auth/auth";

import Overview from "../pages/Overview.jsx";
import TimeControl from "../pages/TimeControl.jsx";
import Reports from "../pages/Reports.jsx";
import AIChat from "../pages/AIChat.jsx";
import Subjects from "../pages/Subjects.jsx";
import SubjectDetails from "../pages/SubjectDetails.jsx";
import Messages from "../pages/Messages.jsx";
import NotFound from "../pages/NotFound.jsx";

const NAV = [
  { label: "Overview", path: "/overview",     icon: LayoutDashboard },
  { label: "Time",     path: "/time-control", icon: Clock           },
  { label: "Subjects", path: "/subjects",     icon: Layers          },
  { label: "Reports",  path: "/reports",      icon: BarChart3       },
  { label: "Messages", path: "/messages",     icon: MessageSquare   },
  { label: "AI",       path: "/ai",           icon: Bot             },
];

// Mobile bottom tab bar — 5 primary destinations, no "More" button.
// AI sits next to Messages. Time / Download / Theme / Logout live in the settings sheet.
const MOBILE_TABS = ["/overview", "/subjects", "/reports", "/messages", "/ai"];

const GAME_DOWNLOAD_URL =
  "https://drive.google.com/uc?export=download&id=1g0mClaUBd0dk3ht5AaDVtKCN1ex8ZBxp";

const THEMES = [
  { id: "light",   icon: Sun      },
  { id: "dark",    icon: Moon     },
  { id: "special", icon: Sparkles },
];

export default function SpecialShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { kids, activeChild, setActiveChildId } = useChildren();

  const [sheetOpen, setSheetOpen] = useState(false);   // mobile bottom sheet
  const [kidsOpen, setKidsOpen] = useState(false);     // desktop child dropdown
  const [pendingStop, setPendingStop] = useState(null);

  const isStopped = pendingStop !== null ? pendingStop : !!activeChild?.forceStopped;
  async function toggleStop() {
    if (!activeChild) return;
    const next = !isStopped;
    setPendingStop(next);
    try {
      await setChildForceStop(activeChild.id, next);
      setTimeout(() => setPendingStop(null), 2000);
    } catch {
      setPendingStop(!next);
      alert("Couldn't update — try again.");
    }
  }

  const mobileNavItems = NAV.filter((n) => MOBILE_TABS.includes(n.path));

  return (
    <div className="adapted-bg relative min-h-screen overflow-hidden">
      <div className="shape one" />
      <div className="shape two" />
      <div className="shape three" />
      <div className="grain pointer-events-none absolute inset-0" />

      {/* ───────── FLOATING TOP NAVBAR ───────── */}
      <motion.nav
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-30 mx-auto max-w-[1800px] px-3 md:px-6 pt-3 md:pt-6"
      >
        <div className="panel stroke rounded-2xl px-3 md:px-4 py-2.5 flex items-center gap-2 md:gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <motion.div
              whileHover={{ rotate: -8, scale: 1.05 }}
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500 via-cyan-400 to-amber-400 grid place-items-center font-black text-black text-sm shadow-lg"
            >
              NQ
            </motion.div>
            <div className="hidden xl:block leading-tight">
              <div className="font-extrabold text-base tracking-tight">NeuroQuest</div>
              <div className="text-[10px] opacity-50 uppercase tracking-widest">Parent</div>
            </div>
          </div>

          {/* Desktop primary nav */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
            {NAV.map(({ label, path, icon: Icon }) => (
              <NavLink key={path} to={path}>
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`relative px-3 py-2 rounded-xl flex items-center gap-1.5 font-semibold text-sm whitespace-nowrap ${
                      isActive ? "text-white" : "opacity-55 hover:opacity-100"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-500/20 via-cyan-400/15 to-amber-400/20 border border-fuchsia-400/30"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="relative h-4 w-4" />
                    <span className="relative">{label}</span>
                  </motion.div>
                )}
              </NavLink>
            ))}

            <a
              href={GAME_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative px-3 py-2 rounded-xl flex items-center gap-1.5 font-semibold text-sm whitespace-nowrap text-sky-300/80 hover:text-sky-200 hover:bg-sky-500/10 transition-colors"
              title="Download the game .exe"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </a>
          </div>

          <div className="flex-1 md:hidden" />

          {/* Active child + Stop — inline */}
          {activeChild && (
            <div className="flex items-center gap-1 shrink-0">
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={toggleStop}
                title={isStopped ? `Resume ${activeChild.displayName}` : `Stop ${activeChild.displayName}`}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isStopped
                    ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/30"
                    : "bg-red-500/15  border-red-500/30   text-red-300     hover:bg-red-500/25"
                }`}
              >
                {isStopped ? <Play className="h-3.5 w-3.5" /> : <OctagonX className="h-3.5 w-3.5" />}
              </motion.button>

              <div className="relative">
                <button
                  onClick={() => setKidsOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 transition-colors max-w-[160px]"
                >
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-sky-400/40 via-emerald-300/30 to-purple-400/40 grid place-items-center text-[10px] font-black shrink-0">
                    {activeChild.displayName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="text-sm font-semibold truncate">{activeChild.displayName}</span>
                  {kids.length > 1 && <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />}
                </button>
                <AnimatePresence>
                  {kidsOpen && kids.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 top-full mt-2 w-56 panel stroke rounded-xl p-2 z-50"
                    >
                      {kids.map((k) => (
                        <button
                          key={k.id}
                          onClick={() => { setActiveChildId(k.id); setKidsOpen(false); }}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            k.id === activeChild.id
                              ? "bg-fuchsia-500/15 text-fuchsia-100"
                              : "opacity-70 hover:opacity-100 hover:bg-white/5"
                          }`}
                        >
                          <span className="truncate">{k.displayName}</span>
                          {k.id === activeChild.id && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Theme switch (desktop) */}
          <div className="hidden md:flex items-center gap-0.5 rounded-xl border border-white/15 p-0.5 shrink-0">
            {THEMES.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                title={id}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === id
                    ? id === "special"
                      ? "bg-gradient-to-r from-fuchsia-500/30 via-cyan-400/25 to-amber-400/30 text-fuchsia-100"
                      : "bg-fuchsia-500/20 text-fuchsia-100"
                    : "opacity-55 hover:opacity-100"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Logout (desktop) */}
          <button
            onClick={() => logout(navigate)}
            title="Logout"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline text-sm font-semibold">Logout</span>
          </button>

          {/* Mobile settings gear (replaces hamburger) */}
          <button
            onClick={() => setSheetOpen(true)}
            className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors shrink-0"
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </motion.nav>

      {/* ───────── CONTENT ───────── */}
      <main className="relative z-10 mx-auto max-w-[1800px] px-3 md:px-6 py-4 md:py-6 pb-24 md:pb-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 28, filter: "blur(10px)", scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  filter: "blur(0px)",  scale: 1    }}
            exit   ={{ opacity: 0, y: -18, filter: "blur(8px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="panel stroke rounded-2xl p-4 md:p-6"
          >
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview"             element={<Overview />} />
              <Route path="/time-control"         element={<TimeControl />} />
              <Route path="/subjects"             element={<Subjects />} />
              <Route path="/subjects/:subjectId"  element={<SubjectDetails />} />
              <Route path="/reports"              element={<Reports />} />
              <Route path="/messages"             element={<Messages />} />
              <Route path="/ai"                   element={<AIChat />} />
              <Route path="*"                     element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ───────── MOBILE BOTTOM TAB BAR — 5 primary destinations ───────── */}
      <motion.nav
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3"
      >
        <div className="panel stroke rounded-2xl p-1.5 flex items-center justify-around">
          {mobileNavItems.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} className="flex-1">
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`relative flex flex-col items-center gap-0.5 py-1.5 rounded-xl ${
                    isActive ? "text-fuchsia-200" : "opacity-55"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-tab-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-b from-fuchsia-500/20 to-cyan-400/15 border border-fuchsia-400/25"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative h-5 w-5" />
                  <span className="relative text-[10px] font-bold tracking-wide">{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </motion.nav>

      {/* ───────── MOBILE BOTTOM SHEET (settings / secondary actions) ───────── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 500) setSheetOpen(false);
              }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden panel stroke rounded-t-3xl px-4 pt-3 pb-6 max-h-[85vh] overflow-y-auto"
            >
              {/* Drag handle */}
              <div className="flex justify-center mb-3 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg tracking-tight">Settings</h3>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="text-xs font-semibold opacity-60 hover:opacity-100"
                >
                  Done
                </button>
              </div>

              {/* Time control */}
              <NavLink
                to="/time-control"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors mb-2"
              >
                <div className="h-9 w-9 rounded-lg bg-amber-500/15 border border-amber-500/25 grid place-items-center">
                  <Clock className="h-4 w-4 text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">Time Control</div>
                  <div className="text-[11px] opacity-55">Daily limits, bedtime, breaks</div>
                </div>
              </NavLink>

              {/* Download */}
              <a
                href={GAME_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors mb-2"
              >
                <div className="h-9 w-9 rounded-lg bg-sky-500/15 border border-sky-500/25 grid place-items-center">
                  <Download className="h-4 w-4 text-sky-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">Download Game</div>
                  <div className="text-[11px] opacity-55">Latest Windows .exe</div>
                </div>
              </a>

              {/* Child switcher (only when 2+ kids) */}
              {kids.length > 1 && activeChild && (
                <div className="px-3 py-3 rounded-xl bg-white/5 mb-2">
                  <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Switch child</div>
                  <div className="flex flex-col gap-1">
                    {kids.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => { setActiveChildId(k.id); setSheetOpen(false); }}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm font-semibold ${
                          k.id === activeChild.id
                            ? "bg-fuchsia-500/15 text-fuchsia-100"
                            : "opacity-70 hover:opacity-100 hover:bg-white/5"
                        }`}
                      >
                        <span className="truncate">{k.displayName}</span>
                        {k.id === activeChild.id && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Theme switch */}
              <div className="px-3 py-3 rounded-xl bg-white/5 mb-2">
                <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Theme</div>
                <div className="flex items-center gap-1 rounded-xl border border-white/10 p-1">
                  {THEMES.map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setTheme(id)}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold capitalize transition-colors ${
                        theme === id ? "bg-fuchsia-500/25 text-fuchsia-100" : "opacity-55"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => { setSheetOpen(false); logout(navigate); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-sm transition-colors mt-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
