import express from "express";
import cors from "cors";

import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/auth.middleware.js";
import childrenRoutes from "./children/children.routes.js";
import gameRoutes from "./game/game.routes.js";
import prisma from "./db/prisma.js";

const app = express();

// ✅ CORS FIRST — THIS FIXES EVERYTHING
app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("EduGalaxy API running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/children", childrenRoutes);
app.use("/api/game", gameRoutes);

app.get("/api/me", requireAuth, async (req, res) => {
  const parent = await prisma.parent.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, role: true, name: true, birthdate: true, createdAt: true },
  });
  if (!parent) return res.status(404).json({ error: "User not found" });
  res.json(parent);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
