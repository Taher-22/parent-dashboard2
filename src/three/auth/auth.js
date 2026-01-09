// Frontend auth helpers (NO backend calls here)

/**
 * Log the user out
 * - removes JWT token
 * - redirects to /login
 */
export function logout(navigate) {
  localStorage.removeItem("token");
  navigate("/login");
}

/**
 * Optional helper: check if user is logged in
 */
export function isAuthenticated() {
  return !!localStorage.getItem("token");
}
