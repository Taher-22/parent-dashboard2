import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, getMyChildren } from "../lib/api";

// Context
const ChildrenContext = createContext(null);

export function ChildrenProvider({ children }) {
  const [me, setMe] = useState(null);

  const [kids, setKids] = useState([]);
  const [activeChildId, setActiveChildIdState] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingKids, setLoadingKids] = useState(false);

  // Storage key must be per-parent so switching accounts won’t keep old child selected
  const activeKey = useMemo(() => {
    return me?.id ? `activeChildId:${me.id}` : "activeChildId:anonymous";
  }, [me?.id]);

  function clearState() {
    setMe(null);
    setKids([]);
    setActiveChildIdState("");
    setLoading(false);
    setLoadingKids(false);
  }

  async function bootstrap() {
    const token = localStorage.getItem("token");
    if (!token) {
      clearState();
      return;
    }

    try {
      setLoading(true);

      const parent = await getMe();
      setMe(parent);

      // Load kids
      setLoadingKids(true);
      const list = await getMyChildren();
      setKids(Array.isArray(list) ? list : []);

      // Restore active child per parent
      const saved = localStorage.getItem(`activeChildId:${parent.id}`) || "";

      if (saved && list?.some((k) => k.id === saved)) {
        setActiveChildIdState(saved);
      } else {
        // default to first child if exists
        const first = list?.[0]?.id || "";
        setActiveChildIdState(first);
        if (first) localStorage.setItem(`activeChildId:${parent.id}`, first);
      }
    } catch (e) {
      // If token invalid → logout behavior
      localStorage.removeItem("token");
      clearState();
    } finally {
      setLoadingKids(false);
      setLoading(false);
    }
  }

  // Reload children only (no re-auth)
  async function reloadChildren() {
    const token = localStorage.getItem("token");
    if (!token) {
      clearState();
      return;
    }

    try {
      setLoadingKids(true);
      const list = await getMyChildren();
      const safe = Array.isArray(list) ? list : [];
      setKids(safe);

      // keep active child valid
      setActiveChildIdState((prev) => {
        if (prev && safe.some((k) => k.id === prev)) return prev;

        const next = safe[0]?.id || "";
        if (me?.id && next) localStorage.setItem(`activeChildId:${me.id}`, next);
        return next;
      });
    } catch (e) {
      // if API fails due to auth → logout
      localStorage.removeItem("token");
      clearState();
    } finally {
      setLoadingKids(false);
    }
  }

  // Public setter that also persists per-parent
  function setActiveChildId(id) {
    setActiveChildIdState(id);
    if (me?.id) {
      localStorage.setItem(`activeChildId:${me.id}`, id);
    }
  }

  const activeChild = useMemo(() => {
    if (!kids.length) return null;
    return kids.find((k) => k.id === activeChildId) || kids[0] || null;
  }, [kids, activeChildId]);

  useEffect(() => {
    bootstrap();
    // bootstrap runs on first mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for token changes (login/logout/register)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      // If token changed, re-bootstrap to get fresh data for new user
      bootstrap();
    };

    // Use a custom event to trigger re-bootstrap on token changes
    // (localStorage events only fire in OTHER tabs, so we dispatch custom event)
    window.addEventListener("token-changed", handleStorageChange);
    return () => window.removeEventListener("token-changed", handleStorageChange);
  }, []);

  const value = useMemo(
    () => ({
      me,
      kids,
      activeChild,
      activeChildId,
      setActiveChildId,
      reloadChildren,
      loading,
      loadingKids,
      clearState, // optional if you want to call it on logout
    }),
    [me, kids, activeChild, activeChildId, loading, loadingKids]
  );

  return <ChildrenContext.Provider value={value}>{children}</ChildrenContext.Provider>;
}

export function useChildren() {
  const ctx = useContext(ChildrenContext);
  if (!ctx) throw new Error("useChildren must be used inside <ChildrenProvider />");
  return ctx;
}
