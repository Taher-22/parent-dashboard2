import express from "express";
import cors from "cors";

import authRoutes from "./auth/auth.routes.js";
import { requireAuth } from "./auth/auth.middleware.js";
import childrenRoutes from "./children/children.routes.js";

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

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.user);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
