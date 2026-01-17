import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/authMiddleware.js";

const app = express();

app.set("trust proxy", 1); // 🔥 THIS FIXES EVERYTHING

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

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
