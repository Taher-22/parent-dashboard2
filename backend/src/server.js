import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/authMiddleware.js";

const app = express();

/* ================================
   CORS (FIXED FOR PRODUCTION)
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "https://neuroquest.tech",          // ✅ YOUR FRONTEND DOMAIN
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ✅ THIS IS THE CRITICAL LINE */
app.options("*", cors());

/* ================================
   Middlewares
================================ */
app.use(express.json());

/* ================================
   Routes
================================ */
app.get("/", (req, res) => {
  res.send("EduGalaxy API running ✅");
});

app.use("/api/auth", authRoutes);

app.get("/api/overview", requireAuth, (req, res) => {
  res.json({ todayFocusMinutes: 42 });
});

/* ================================
   Start Server
================================ */
const PORT = 8080;
app.listen(PORT, () => {
  console.log("API running on port", PORT);
});
