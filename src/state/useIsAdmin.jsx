import { useEffect, useState } from "react";
import { getMe } from "../lib/api.js";

// Tiny hook that fetches /api/me once and returns whether this user is an admin.
// Cached in memory + sessionStorage so it doesn't re-fetch on every page change.
//
// The backend decides admin status (ADMIN_EMAILS env var OR first-ever parent OR
// any logged-in parent when no allowlist is set). The FE only mirrors that flag.

const CACHE_KEY = "nq_is_admin";

let inflight = null;

export default function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(() => {
    try { return sessionStorage.getItem(CACHE_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAdmin(false);
      try { sessionStorage.removeItem(CACHE_KEY); } catch {}
      return;
    }

    // Share a single in-flight request across all components mounted at once
    inflight = inflight || getMe().catch(() => null);
    inflight.then((me) => {
      const flag = !!me?.isAdmin;
      setIsAdmin(flag);
      try { sessionStorage.setItem(CACHE_KEY, flag ? "1" : "0"); } catch {}
    });

    return () => { inflight = null; };
    // Re-run when token changes (login/logout)
  }, []);

  return isAdmin;
}
