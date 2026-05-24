import express from "express";
import cors from "cors";

import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/auth.middleware.js";
import childrenRoutes from "./children/children.routes.js";
import gameRoutes from "./game/game.routes.js";
import aiRoutes from "./ai/ai.routes.js";
import analyticsRoutes from "./analytics/analytics.routes.js";
import prisma from "./db/prisma.js";

const app = express();

// Railway puts an edge proxy in front of the app. Trusting the proxy means
// req.ip resolves to the real client IP (used only for hashed analytics —
// never stored raw).
app.set("trust proxy", true);

// ✅ CORS FIRST — THIS FIXES EVERYTHING
app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization", "DNT", "X-DNT"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("NeuroQuest API running ✅");
});

app.use("/api/auth",      authRoutes);
app.use("/api/children",  childrenRoutes);
app.use("/api/game",      gameRoutes);
app.use("/api/ai",        aiRoutes);
app.use("/api/analytics", analyticsRoutes);

// Auto-detect admin: allowlist via ADMIN_EMAILS env var, plus the
// first-ever-created parent (the owner), plus all-logged-in when no
// allowlist is configured. Mirrors analytics.routes.js.
async function isAdminUser({ parentId, email }) {
  const raw = (process.env.ADMIN_EMAILS || "").trim();
  if (raw && email) {
    const allow = raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allow.includes(email.toLowerCase())) return true;
  }
  if (parentId) {
    const firstParent = await prisma.parent.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (firstParent?.id === parentId) return true;
  }
  if (!raw) return true;
  return false;
}

app.get("/api/me", requireAuth, async (req, res) => {
  const parent = await prisma.parent.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, role: true, name: true, birthdate: true, createdAt: true },
  });
  if (!parent) return res.status(404).json({ error: "User not found" });
  const isAdmin = await isAdminUser({ parentId: parent.id, email: parent.email });
  res.json({ ...parent, isAdmin });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
