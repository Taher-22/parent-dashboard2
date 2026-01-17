const API_URL = "https://parent-dashboard2-production.up.railway.app";

/* REGISTER */
export async function register(email, password) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Register failed");
  return res.json();
}

/* LOGIN */
export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Login failed");

  const data = await res.json();

  // 🔥 STORE TOKEN
  localStorage.setItem("token", data.token);

  return data;
}

/* GET ME (PROTECTED) */
export async function getMe() {
  const token = localStorage.getItem("token");

  if (!token) throw new Error("No token");

  const res = await fetch(`${API_URL}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Unauthorized");

  return res.json();
}
