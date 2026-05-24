import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import SpecialShell from "./SpecialShell.jsx";
import { trackPageview } from "../lib/analytics.js";

import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";

export default function AppShell() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Anonymous pageview tracking → posts to a Discord webhook.
  // Honors Do Not Track + localStorage opt-out. Fire-and-forget.
  useEffect(() => {
    trackPageview(location.pathname, { isParent: !!token });
  }, [location.pathname, token]);

  /* 🔒 NOT AUTHENTICATED — login / register only */
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

  /* Dark mode removed. Light + Special are the only themes, both rendered
     by SpecialShell (aurora layout with cog menu, top nav, bottom tabs on mobile).
     Theme palette is selected via [data-theme="..."] on <html>. */
  return <SpecialShell />;
}
