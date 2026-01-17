import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/authMiddleware.js";
import cookieParser from "cookie-parser";

app.use(cookieParser());


const app = express();

/* ================================
   CORS — SAFE FOR NODE 22
================================ */
app.use(
  cors({
    origin: true,        // let browser send Origin
    credentials: true,   // allow cookies
  })
);

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
