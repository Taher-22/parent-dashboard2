import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/authMiddleware.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("EduGalaxy API is running ✅");
});

app.use("/api/auth", authRoutes);

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.auth);
});

app.get("/api/overview", requireAuth, (req, res) => {
  res.json({
    todayFocusMinutes: 42,
  });
});

app.listen(5050, () => {
  console.log("✅ API running on http://localhost:5050");
});
