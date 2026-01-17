import express from "express";
import prisma from "../db/prisma.js";
import { hashPassword, verifyPassword, generateToken } from "./utils.js";
import { authMiddleware } from "./auth.middleware.js";

const router = express.Router();

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const exists = await prisma.parent.findUnique({
      where: { email },
    });

    if (exists) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const parent = await prisma.parent.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
      },
    });

    const token = generateToken(parent);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,        // REQUIRED on HTTPS
      sameSite: "none",    // REQUIRED for cross-site
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const parent = await prisma.parent.findUnique({
      where: { email },
    });

    if (!parent) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await verifyPassword(password, parent.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(parent);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,        // REQUIRED on HTTPS
      sameSite: "none",    // REQUIRED for cross-site
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   ME (PROTECTED)
========================= */
router.get("/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

export default router;
