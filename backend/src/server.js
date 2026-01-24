import express from "express";
import cors from "cors";

import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/auth.middleware.js";
import childrenRoutes from "./children/children.routes.js";

const app = express();

/* =========================
   CORS — MUST BE FIRST
========================= */
app.use(
  cors({
    origin: [
      "https://neuroquest.tech",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("EduGalaxy API running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/children", childrenRoutes);

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.user);
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
