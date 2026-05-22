import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import Sidebar from "../ui/Sidebar.jsx";
import Topbar from "../ui/Topbar.jsx";
import SpecialShell from "./SpecialShell.jsx";

import { useTheme } from "../state/ThemeContext.jsx";

import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Overview from "../pages/Overview.jsx";
import TimeControl from "../pages/TimeControl.jsx";
import Reports from "../pages/Reports.jsx";
import AIChat from "../pages/AIChat.jsx";
import Subjects from "../pages/Subjects.jsx";
import SubjectDetails from "../pages/SubjectDetails.jsx";
import Messages from "../pages/Messages.jsx";
import NotFound from "../pages/NotFound.jsx";

export default function AppShell() {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const { theme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /* 🔒 NOT AUTHENTICATED */
  if (!token) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ✨ SPECIAL theme → completely different layout */
  if (theme === "special") {
    return <SpecialShell />;
  }

  /* ✅ AUTHENTICATED — classic layout (Light / Dark) with mobile drawer for the sidebar */
  return (
    <div className="adapted-bg relative min-h-screen overflow-hidden">
      <div className="shape one" />
      <div className="shape two" />
      <div className="shape three" />
      <div className="grain pointer-events-none absolute inset-0" />

      <div className="relative z-10 max-w-[1400px] mx-auto p-3 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 md:gap-6">

          {/* Sidebar — inline on lg+, drawer on smaller.
              `lg:!block` + inline style for belt-and-braces hiding on phones in case
              Tailwind purge or some other override strips `hidden`. */}
          <aside
            className="hidden lg:!block lg:sticky lg:top-6 self-start"
            style={{ display: undefined }}
          >
            <Sidebar />
          </aside>

          <div className="flex flex-col gap-3 md:gap-6 min-w-0">
            {/* Sticky on every breakpoint so the hamburger stays in reach when scrolling. */}
            <header className="sticky top-3 md:top-6 z-30 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Topbar />
              </div>

              {/* Mobile hamburger — RHS, inside the top bar row */}
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden panel stroke rounded-2xl p-3 shrink-0"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </header>

            <main className="panel stroke rounded-2xl p-3 md:p-6 overflow-x-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Routes location={location}>
                    <Route path="/" element={<Navigate to="/overview" replace />} />
                    <Route path="/overview" element={<Overview />} />
                    <Route path="/time-control" element={<TimeControl />} />
                    <Route path="/subjects" element={<Subjects />} />
                    <Route path="/subjects/:subjectId" element={<SubjectDetails />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/ai" element={<AIChat />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      {/* MOBILE SIDEBAR DRAWER — slides in from the RIGHT */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 bottom-0 w-72 z-50 p-3 lg:hidden overflow-y-auto"
              onClick={() => setMobileNavOpen(false)}
            >
              <div onClick={(e) => e.stopPropagation()} className="h-full">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Sidebar onNavigate={() => setMobileNavOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
