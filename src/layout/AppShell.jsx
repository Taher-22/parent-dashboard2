import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import Sidebar from "../ui/Sidebar.jsx";
import Topbar from "../ui/Topbar.jsx";

import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";  // Ensure Register is imported
import Overview from "../pages/Overview.jsx";
import TimeControl from "../pages/TimeControl.jsx";
import Reports from "../pages/Reports.jsx";
import AIChat from "../pages/AIChat.jsx";
import Subjects from "../pages/Subjects.jsx";
import SubjectDetails from "../pages/SubjectDetails.jsx";
import NotFound from "../pages/NotFound.jsx";
import ProtectedRoute from "../components/ProtectedRoute";  // Import ProtectedRoute


export default function AppShell() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  /* 🔒 NOT AUTHENTICATED → LOGIN or REGISTER */
  if (!token) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login-register"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            {/* Ensure both login and register routes are visible */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />  {/* Registration route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ✅ AUTHENTICATED → DASHBOARD */
  return (
    <div className="adapted-bg relative min-h-screen overflow-hidden">
      {/* Animated background blobs */}
      <div className="shape one" />
      <div className="shape two" />
      <div className="shape three" />

      {/* Grain overlay */}
      <div className="grain pointer-events-none absolute inset-0" />

      {/* REAL CONTENT */}
      <div className="relative z-10 max-w-[1400px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 md:gap-6">

          <aside className="no-print lg:sticky lg:top-6 self-start">
            <Sidebar />
          </aside>

          <div className="flex flex-col gap-4 md:gap-6">

            <header className="no-print lg:sticky lg:top-6 z-20">
              <Topbar />
            </header>

            <main className="panel stroke rounded-2xl p-4 md:p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
                  transition={{
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Routes location={location}>
                    <Route path="/" element={<Navigate to="/overview" replace />} />
                    <Route path="/overview" element={<Overview />} />
                    <Route path="/time-control" element={<TimeControl />} />
                    <Route path="/subjects" element={<Subjects />} />
                    <Route path="/subjects/:subjectId" element={<SubjectDetails />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/ai" element={<AIChat />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </main>

          </div>
        </div>
      </div>
    </div>
  );
}
