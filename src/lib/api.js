const API_URL = "https://parent-dashboard2-production.up.railway.app";

/* =========================
   AUTH
========================= */

export async function register(email, password) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Register failed");
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Login failed");

  const data = await res.json();
  localStorage.setItem("token", data.token);
  // Notify ChildrenContext to refresh with new user's data
  window.dispatchEvent(new Event("token-changed"));
  return data;
}

export async function getMe() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_URL}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

/* =========================
   CHILD MANAGEMENT
========================= */

export async function addChild(displayName, birthdate) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_URL}/api/children/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ displayName, birthdate }),
  });

  if (!res.ok) throw new Error("Failed to create child");
  return res.json();
}

export async function getMyChildren() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_URL}/api/children/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch children");
  return res.json();
}

export async function redeemChildCode(childCode) {
  const res = await fetch(`${API_URL}/api/children/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ childCode }),
  });

  if (!res.ok) throw new Error("Invalid child code");
  return res.json();
}
