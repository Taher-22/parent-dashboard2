import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/authMiddleware.js";

const app = express();

/* ================================
   CORS (Railway + Local Safe)
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CORS_ORIGIN, // frontend domain later
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server, Postman, browser without origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

/* ================================
   Middlewares
================================ */
app.use(express.json());

/* ================================
   Health & Root
================================ */
app.get("/", (req, res) => {
  res.status(200).send("EduGalaxy API running ✅");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================================
   Routes
================================ */
app.use("/api/auth", authRoutes);

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.auth);
});

app.get("/api/overview", requireAuth, (req, res) => {
  res.json({
    todayFocusMinutes: 42,
  });
});

/* ================================
   START SERVER (RAILWAY SAFE)
================================ */
const PORT = 8080;

app.listen(PORT, () => {
  console.log("API running on port", PORT);
});
