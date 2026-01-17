import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/authMiddleware.js";

const app = express();

/* =========================
   CORS CONFIG (PRODUCTION SAFE)
   ========================= */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CORS_ORIGIN,
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server, Postman, curl, etc.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* =========================
   MIDDLEWARE
   ========================= */
app.use(express.json());

/* Request logger (VERY IMPORTANT for Railway debugging) */
app.use((req, res, next) => {
  console.log("REQ:", req.method, req.path);
  next();
});

/* =========================
   ROUTES
   ========================= */

/* Health / root route */
app.get("/", (req, res) => {
  res.status(200).send("EduGalaxy API is running ✅");
});

/* Auth routes */
app.use("/api/auth", authRoutes);

/* Protected routes */
app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.auth);
});

app.get("/api/overview", requireAuth, (req, res) => {
  res.json({
    todayFocusMinutes: 42,
  });
});

/* =========================
   ERROR HANDLER (IMPORTANT)
   ========================= */
app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

/* =========================
   SERVER START
   ========================= */
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
