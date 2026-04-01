// Frontend auth helpers (NO backend calls here)

/**
 * Log the user out
 * - removes JWT token
 * - clears all active child selections to ensure clean state for next login
 * - redirects to /login
 */
export function logout(navigate) {
  localStorage.removeItem("token");
  // Clear all localStorage keys for active children to ensure fresh state on next login
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('activeChildId:')) {
      localStorage.removeItem(key);
    }
  });
  // Notify ChildrenContext to clear state
  window.dispatchEvent(new Event("token-changed"));
  navigate("/login");
}

/**
 * Optional helper: check if user is logged in
 */
export function isAuthenticated() {
  return !!localStorage.getItem("token");
}
