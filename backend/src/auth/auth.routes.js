import express from "express";
import prisma from "../db/prisma.js";
import { hashPassword, verifyPassword, generateToken } from "./utils.js";

const router = express.Router();

/* REGISTER */
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const exists = await prisma.parent.findUnique({ where: { email } });
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
  res.json({ token });
});

/* LOGIN */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const parent = await prisma.parent.findUnique({ where: { email } });
  if (!parent) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await verifyPassword(password, parent.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(parent);
  res.json({ token });
});

export default router;
