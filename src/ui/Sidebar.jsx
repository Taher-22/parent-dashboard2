import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  Bot,
  Layers,
  MessageSquare,
  Plus,
  X,
  Copy,
  Check,
  Download,
} from "lucide-react";

// Direct Google Drive download URL for the game .exe
// (converted from drive.google.com/file/d/{id}/view → drive.google.com/uc?export=download&id={id})
const GAME_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=1-zN-VFrfzwfPAtmuXPRCWCol1VzS450s";
import { useState } from "react";
import { useChildren } from "../state/ChildrenContext.jsx";

const navGroups = [
  {
    label: "Monitor",
    items: [
      { label: "Overview",     path: "/overview",      icon: LayoutDashboard },
      { label: "Time Control", path: "/time-control",  icon: Clock           },
      { label: "Subjects",     path: "/subjects",      icon: Layers          },
      { label: "Reports",      path: "/reports",       icon: BarChart3       },
    ],
  },
  {
    label: "Communicate",
    items: [
      { label: "Messages",     path: "/messages",      icon: MessageSquare   },
      { label: "AI Assistant", path: "/ai",            icon: Bot             },
    ],
  },
];

export default function Sidebar({ onNavigate }) {
  const { createChild } = useChildren();
  const [showAddChild, setShowAddChild]     = useState(false);
  const [childName, setChildName]           = useState("");
  const [birthdate, setBirthdate]           = useState("");
  const [creating, setCreating]             = useState(false);
  const [generatedCode, setGeneratedCode]   = useState(null);
  const [copied, setCopied]                 = useState(false);

  async function handleAddChild() {
    if (!childName.trim()) return;
    try {
      setCreating(true);
      const child = await createChild(childName.trim(), birthdate);
      setGeneratedCode(child.childCode);
      setChildName("");
      setBirthdate("");
    } catch {
      alert("Failed to create child");
    } finally {
      setCreating(false);
    }
  }

  function handleCopy() {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setShowAddChild(false);
    setGeneratedCode(null);
    setChildName("");
    setBirthdate("");
  }

  return (
    <aside className="panel stroke rounded-2xl p-4 flex flex-col gap-1 h-full">

      {/* Brand */}
      <div className="px-2 pt-1 pb-4 border-b border-white/10">
        <div className="text-lg font-extrabold tracking-tight">NeuroQuest</div>
        <div className="text-xs opacity-50 mt-0.5">Parent Dashboard</div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-3 pt-3 flex-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest opacity-40 select-none">
              {group.label}
            </div>

            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} end onClick={onNavigate}>
                    {({ isActive }) => (
                      <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 320, damping: 22 }}
                        className={`
                          relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer overflow-hidden
                          ${isActive
                            ? "text-white"
                            : "opacity-60 hover:opacity-90 hover:bg-white/5"
                          }
                        `}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-xl"
                            style={{
                              background:
                                "linear-gradient(90deg, rgba(0,220,130,0.22), rgba(255,200,60,0.18), rgba(170,90,255,0.22))",
                            }}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-emerald-400 opacity-80" />
                        )}
                        <Icon className="relative h-4 w-4 flex-shrink-0" />
                        <span className="relative font-semibold text-sm tracking-tight">
                          {item.label}
                        </span>
                      </motion.div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Download Game */}
      <div className="pt-3 border-t border-white/10">
        <a
          href={GAME_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                     bg-sky-500/10 hover:bg-sky-500/18 border border-sky-500/25
                     text-sky-300 font-semibold text-sm transition-colors"
          title="Downloads the latest game .exe from Google Drive"
        >
          <Download className="h-4 w-4 flex-shrink-0" />
          Download Game
        </a>
      </div>

      {/* Add Child */}
      <div className="pt-3 border-t border-white/10">
        <AnimatePresence mode="wait">
          {!showAddChild && !generatedCode ? (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              onClick={() => setShowAddChild(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                         bg-emerald-500/10 hover:bg-emerald-500/18 border border-emerald-500/20
                         text-emerald-400 font-semibold text-sm transition-colors"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              Add Child
            </motion.button>

          ) : generatedCode ? (
            <motion.div
              key="code-display"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Game Access Code
                </span>
                <button onClick={handleClose} className="opacity-40 hover:opacity-70 transition-opacity">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono font-black text-lg tracking-widest text-white">
                  {generatedCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Copy code"
                >
                  {copied
                    ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                    : <Copy className="h-3.5 w-3.5 opacity-60" />
                  }
                </button>
              </div>
              <p className="text-[10px] opacity-50 mt-1.5">
                Give this code to your child to link their game account.
              </p>
            </motion.div>

          ) : (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold opacity-60 uppercase tracking-wider">New Child</span>
                <button onClick={handleClose} className="opacity-40 hover:opacity-70 transition-opacity">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                className="w-full rounded-lg px-2.5 py-2 bg-slate-700/60 border border-white/10
                           text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-500/60 transition-colors"
                placeholder="Child's name"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChild()}
              />
              <input
                type="date"
                className="w-full rounded-lg px-2.5 py-2 bg-slate-700/60 border border-white/10
                           text-sm text-white/80 outline-none focus:border-emerald-500/60 transition-colors"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
              <button
                onClick={handleAddChild}
                disabled={creating || !childName.trim()}
                className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40
                           text-black font-bold py-2 text-sm transition-colors"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="pt-2 text-[11px] opacity-30 px-1 select-none">
        NeuroQuest © 2025
      </div>

    </aside>
  );
}
