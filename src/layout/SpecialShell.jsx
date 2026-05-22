import { useState } from "react";
import { Routes, Route, Navigate, useLocation, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Clock, BarChart3, Bot, Layers, MessageSquare,
  Sun, Moon, Sparkles, OctagonX, Play, LogOut, Download, Settings,
  ChevronDown, Check, Plus, X, Copy, UserPlus,
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
  "https://drive.google.com/uc?export=download&id=1-zN-VFrfzwfPAtmuXPRCWCol1VzS450s";

const THEMES = [
  { id: "light",   icon: Sun      },
  { id: "dark",    icon: Moon     },
  { id: "special", icon: Sparkles },
];

export default function SpecialShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { kids, activeChild, setActiveChildId, createChild } = useChildren();

  const [sheetOpen, setSheetOpen] = useState(false);   // mobile bottom sheet
  const [kidsOpen, setKidsOpen] = useState(false);     // desktop child dropdown
  const [pendingStop, setPendingStop] = useState(null);

  // Add Child modal state
  const [addOpen, setAddOpen] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildBirthdate, setNewChildBirthdate] = useState("");
  const [creating, setCreating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  function openAddChild() {
    setSheetOpen(false);
    setKidsOpen(false);
    setAddOpen(true);
  }
  function closeAddChild() {
    setAddOpen(false);
    setNewChildName("");
    setNewChildBirthdate("");
    setGeneratedCode(null);
    setCodeCopied(false);
  }
  async function handleCreateChild() {
    if (!newChildName.trim()) return;
    try {
      setCreating(true);
      const child = await createChild(newChildName.trim(), newChildBirthdate);
      setGeneratedCode(child.childCode);
      setNewChildName("");
      setNewChildBirthdate("");
    } catch {
      alert("Failed to create child");
    } finally {
      setCreating(false);
    }
  }
  function copyGeneratedCode() {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1800);
  }

  // Copy the active child's code from anywhere (sheet, dropdown).
  const [childCodeCopied, setChildCodeCopied] = useState(false);
  function copyActiveChildCode() {
    if (!activeChild?.childCode) return;
    navigator.clipboard.writeText(activeChild.childCode);
    setChildCodeCopied(true);
    setTimeout(() => setChildCodeCopied(false), 1800);
  }

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

          {/* No child yet — surface Add Child prominently */}
          {!activeChild && kids.length === 0 && (
            <button
              onClick={openAddChild}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold text-sm transition-colors shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Child</span>
            </button>
          )}

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
                  {kidsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 top-full mt-2 w-64 panel stroke rounded-xl p-2 z-50"
                    >
                      {/* Active child code — tap to copy */}
                      {activeChild?.childCode && (
                        <button
                          onClick={copyActiveChildCode}
                          className="w-full flex items-center gap-2 px-2 py-2 mb-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors"
                        >
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-[9px] uppercase tracking-widest opacity-60 text-emerald-200">Code</div>
                            <div className="font-mono font-black text-sm tracking-[0.22em] text-emerald-100 truncate">
                              {activeChild.childCode}
                            </div>
                          </div>
                          {childCodeCopied
                            ? <Check className="h-3.5 w-3.5 text-emerald-300" />
                            : <Copy  className="h-3.5 w-3.5 text-emerald-300/70" />}
                        </button>
                      )}

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
                      <div className="my-1 border-t border-white/10" />
                      <button
                        onClick={openAddChild}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-semibold text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add Child
                      </button>
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

      {/* ───────── ADD CHILD MODAL ───────── */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAddChild}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit   ={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] panel stroke rounded-2xl p-5 w-[92vw] max-w-md"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg tracking-tight flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-emerald-300" />
                  {generatedCode ? "Child Added" : "Add Child"}
                </h3>
                <button
                  onClick={closeAddChild}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {generatedCode ? (
                <div className="space-y-3">
                  <p className="text-sm opacity-70">
                    Share this code with your child. They'll type it in the game once to link their account.
                  </p>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
                    <span className="flex-1 font-mono font-black text-2xl tracking-[0.3em] text-emerald-200">
                      {generatedCode}
                    </span>
                    <button
                      onClick={copyGeneratedCode}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      title="Copy code"
                    >
                      {codeCopied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4 opacity-70" />}
                    </button>
                  </div>
                  <button
                    onClick={closeAddChild}
                    className="w-full py-2.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/30 text-fuchsia-100 font-semibold text-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest opacity-55 mb-1.5 block">Name</span>
                    <input
                      type="text"
                      autoFocus
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateChild()}
                      placeholder="Child's name"
                      className="w-full rounded-xl px-3 py-2.5 bg-black/30 border border-white/15 text-sm text-white placeholder:text-white/30 outline-none focus:border-fuchsia-400/60 transition-colors"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest opacity-55 mb-1.5 block">Birthdate (optional)</span>
                    <input
                      type="date"
                      value={newChildBirthdate}
                      onChange={(e) => setNewChildBirthdate(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 bg-black/30 border border-white/15 text-sm text-white/85 outline-none focus:border-fuchsia-400/60 transition-colors"
                    />
                  </label>
                  <button
                    onClick={handleCreateChild}
                    disabled={creating || !newChildName.trim()}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-black font-bold text-sm transition-colors"
                  >
                    {creating ? "Creating…" : "Create"}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
            {/* Flex-centered wrapper. pointer-events-none so backdrop clicks
                still reach the dim layer; the modal itself re-enables them. */}
            <div className="fixed inset-0 z-50 md:hidden flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit   ={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto panel stroke rounded-2xl w-full max-w-sm flex flex-col"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
                <h3 className="font-extrabold text-lg tracking-tight">Settings</h3>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Dense body — child code, 3-tile action row, inline theme, child switcher chips, logout. */}
              <div className="px-4 pb-4 pt-1 space-y-3">

                {/* Active child code — visible & tap-to-copy */}
                {activeChild?.childCode && (
                  <button
                    onClick={copyActiveChildCode}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors"
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-[9px] uppercase tracking-widest opacity-60 text-emerald-200">
                        Game access code · {activeChild.displayName}
                      </div>
                      <div className="font-mono font-black text-lg tracking-[0.28em] text-emerald-100 truncate">
                        {activeChild.childCode}
                      </div>
                    </div>
                    <div className="shrink-0 p-2 rounded-lg bg-emerald-500/15">
                      {childCodeCopied
                        ? <Check className="h-4 w-4 text-emerald-300" />
                        : <Copy  className="h-4 w-4 text-emerald-300/80" />}
                    </div>
                  </button>
                )}

                {/* Action tiles (Add Child / Time / Download) */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={openAddChild}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-colors"
                  >
                    <UserPlus className="h-5 w-5 text-emerald-300" />
                    <span className="text-[11px] font-bold text-emerald-200">Add Child</span>
                  </button>

                  <NavLink
                    to="/time-control"
                    onClick={() => setSheetOpen(false)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-colors"
                  >
                    <Clock className="h-5 w-5 text-amber-300" />
                    <span className="text-[11px] font-bold text-amber-200">Time</span>
                  </NavLink>

                  <a
                    href={GAME_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSheetOpen(false)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 transition-colors"
                  >
                    <Download className="h-5 w-5 text-sky-300" />
                    <span className="text-[11px] font-bold text-sky-200">Download</span>
                  </a>
                </div>

                {/* Child switcher — horizontal chips, only when 2+ kids */}
                {kids.length > 1 && activeChild && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest opacity-50 shrink-0">Child</span>
                    <div className="flex-1 flex gap-1.5 overflow-x-auto">
                      {kids.map((k) => (
                        <button
                          key={k.id}
                          onClick={() => { setActiveChildId(k.id); setSheetOpen(false); }}
                          className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            k.id === activeChild.id
                              ? "bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-100"
                              : "border-white/15 opacity-70 hover:opacity-100"
                          }`}
                        >
                          {k.displayName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Theme switch — inline label + buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest opacity-50 shrink-0">Theme</span>
                  <div className="flex-1 flex items-center gap-1 rounded-xl border border-white/10 p-1">
                    {THEMES.map(({ id, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setTheme(id)}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold capitalize transition-colors ${
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-sm transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
