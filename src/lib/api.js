const API_URL = import.meta.env.VITE_API_URL;

/* =========================
   REGISTER
========================= */
export async function register(email, password) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    credentials: "include", // 🔴 REQUIRED
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Register failed");
  }

  return data;
}

/* =========================
   LOGIN
========================= */
export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include", // 🔴 REQUIRED
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
}

/* =========================
   GET CURRENT USER
========================= */
export async function getMe() {
  const res = await fetch(`${API_URL}/api/me`, {
    credentials: "include", // 🔴 REQUIRED
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
}
