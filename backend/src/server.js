import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/authMiddleware.js";

const app = express(); // ✅ MUST COME FIRST

// ✅ CORS (safe for Railway + Hostinger)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ✅ Middlewares AFTER app initialization
app.use(express.json());
app.use(cookieParser());

// ✅ Health check
app.get("/", (req, res) => {
  res.send("EduGalaxy API running ✅");
});

// ✅ Routes
app.use("/api/auth", authRoutes);

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.auth);
});

app.get("/api/overview", requireAuth, (req, res) => {
  res.json({
    todayFocusMinutes: 42,
  });
});

// ✅ Railway port handling
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
