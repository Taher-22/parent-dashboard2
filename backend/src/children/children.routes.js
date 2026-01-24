import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../auth/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// helper to generate unique code
function generateChildCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * POST /api/children/add
 * Parent creates a child and gets a code
 */
router.post("/add", authenticate, async (req, res) => {
  try {
    const { displayName, birthdate } = req.body;

    if (!displayName) {
      return res.status(400).json({ message: "displayName is required" });
    }

    let code;
    let exists = true;

    // ensure uniqueness
    while (exists) {
      code = generateChildCode();
      exists = await prisma.child.findUnique({
        where: { childCode: code },
      });
    }

    const child = await prisma.child.create({
      data: {
        displayName,
        birthdate: birthdate ? new Date(birthdate) : null,
        childCode: code,
        parentId: req.user.id,
      },
    });

    res.json(child);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create child" });
  }
});

/**
 * GET /api/children/my
 * Get children for logged-in parent
 */
router.get("/my", authenticate, async (req, res) => {
  const children = await prisma.child.findMany({
    where: { parentId: req.user.id },
  });

  res.json(children);
});

/**
 * POST /api/children/redeem
 * Game redeems childCode
 */
router.post("/redeem", async (req, res) => {
  const { childCode } = req.body;

  if (!childCode) {
    return res.status(400).json({ message: "childCode required" });
  }

  const child = await prisma.child.findUnique({
    where: { childCode },
  });

  if (!child) {
    return res.status(404).json({ message: "Invalid code" });
  }

  res.json({
    childId: child.id,
    displayName: child.displayName,
    parentId: child.parentId,
  });
});

export default router;
