const API_URL = "https://parent-dashboard2-production.up.railway.app";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

/* =========================
   AUTH
========================= */

export async function register(email, password) {
  return request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("token", data.token);
  window.dispatchEvent(new Event("token-changed"));
  return data;
}

export async function getMe() {
  return request("/api/me", { headers: authHeaders() });
}

/* =========================
   CHILD MANAGEMENT
========================= */

export async function addChild(displayName, birthdate) {
  return request("/api/children/add", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ displayName, birthdate }),
  });
}

export async function getMyChildren() {
  return request("/api/children/my", { headers: authHeaders() });
}

export async function updateChild(childId, data) {
  return request(`/api/children/${childId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function deleteChild(childId) {
  return request(`/api/children/${childId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function redeemChildCode(childCode) {
  return request("/api/children/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ childCode }),
  });
}

/* =========================
   TIME CONTROLS
========================= */

export async function getTimeControls(childId) {
  return request(`/api/children/${childId}/time-controls`, {
    headers: authHeaders(),
  });
}

export async function updateTimeControls(childId, data) {
  return request(`/api/children/${childId}/time-controls`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

/* =========================
   REPORTS
========================= */

export async function getChildReport(childId) {
  return request(`/api/children/${childId}/reports`, {
    headers: authHeaders(),
  });
}

export async function getSubjectReport(childId, subjectId) {
  return request(`/api/children/${childId}/reports/${subjectId}`, {
    headers: authHeaders(),
  });
}

export async function getTimeTrend(childId) {
  return request(`/api/children/${childId}/reports/time-trend`, {
    headers: authHeaders(),
  });
}

/* =========================
   MESSAGES
========================= */

export async function sendMessage(childId, content) {
  return request(`/api/children/${childId}/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
}

export async function getMessages(childId) {
  return request(`/api/children/${childId}/messages`, {
    headers: authHeaders(),
  });
}

/* =========================
   GAME INTEGRATION
========================= */

export async function getGameProgress(childId) {
  return request(`/api/game/child/${childId}/progress`);
}

export async function postGameProgress(childId, data) {
  return request(`/api/game/child/${childId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function postGameReward(childId, type, value) {
  return request(`/api/game/child/${childId}/reward`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, value }),
  });
}

export async function getGameMessages(childCode) {
  return request(`/api/game/messages?childCode=${encodeURIComponent(childCode)}`);
}
