import express from "express";
import cors from "cors";

import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/auth.middleware.js";

const app = express();

// ✅ SIMPLE, SAFE CORS (ENOUGH FOR JSON + AUTH HEADER)
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

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.user);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
