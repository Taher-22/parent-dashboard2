import express from "express";
import prisma from "../db/prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = express.Router();

// helper to generate unique code
function generateChildCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * POST /api/children/add
 * Parent creates a child and gets a code
 */
router.post("/add", requireAuth, async (req, res) => {
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
router.get("/my", requireAuth, async (req, res) => {
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

/**
 * PUT /api/children/:childId
 * Update a child (edit name, birthdate)
 */
router.put("/:childId", requireAuth, async (req, res) => {
  const { childId } = req.params;
  const { displayName, birthdate } = req.body;

  // Verify child belongs to this parent
  const existingChild = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });

  if (!existingChild) {
    return res.status(404).json({ message: "Child not found" });
  }

  const updatedChild = await prisma.child.update({
    where: { id: childId },
    data: {
      ...(displayName && { displayName }),
      ...(birthdate && { birthdate: new Date(birthdate) }),
    },
  });

  res.json(updatedChild);
});

/**
 * DELETE /api/children/:childId
 * Delete a child
 */
router.delete("/:childId", requireAuth, async (req, res) => {
  const { childId } = req.params;

  // Verify child belongs to this parent
  const existingChild = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });

  if (!existingChild) {
    return res.status(404).json({ message: "Child not found" });
  }

  await prisma.child.delete({
    where: { id: childId },
  });

  res.json({ message: "Child deleted successfully" });
});

/**
 * GET /api/children/:childId/time-controls
 * Get time controls for a child
 */
router.get("/:childId/time-controls", requireAuth, async (req, res) => {
  const { childId } = req.params;

  // Verify child belongs to this parent
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
    include: { timeControls: true },
  });

  if (!child) {
    return res.status(404).json({ message: "Child not found" });
  }

  // If no time controls exist, create default
  if (!child.timeControls) {
    const newTimeControls = await prisma.timeControls.create({
      data: {
        dailyMinutes: 45,
        allowedFrom: "16:00",
        allowedTo: "18:00",
        childId,
      },
    });
    return res.json(newTimeControls);
  }

  res.json(child.timeControls);
});

/**
 * PUT /api/children/:childId/time-controls
 * Update time controls for a child
 */
router.put("/:childId/time-controls", requireAuth, async (req, res) => {
  const { childId } = req.params;
  const { dailyMinutes, allowedFrom, allowedTo } = req.body;

  // Verify child belongs to this parent
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });

  if (!child) {
    return res.status(404).json({ message: "Child not found" });
  }

  // Upsert time controls
  const timeControls = await prisma.timeControls.upsert({
    where: { childId },
    update: {
      ...(dailyMinutes !== undefined && { dailyMinutes }),
      ...(allowedFrom !== undefined && { allowedFrom }),
      ...(allowedTo !== undefined && { allowedTo }),
    },
    create: {
      dailyMinutes: dailyMinutes ?? 45,
      allowedFrom: allowedFrom ?? "16:00",
      allowedTo: allowedTo ?? "18:00",
      childId,
    },
  });

  res.json(timeControls);
});

/**
 * GET /api/children/:childId/reports
 * Get full statistics for a child
 */
router.get("/:childId/reports", requireAuth, async (req, res) => {
  const { childId } = req.params;

  // Verify child belongs to this parent
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });

  if (!child) {
    return res.status(404).json({ message: "Child not found" });
  }

  // Get subject progress
  const subjectProgress = await prisma.subjectProgress.findMany({
    where: { childId },
    include: { subject: true },
  });

  // Get rewards
  const rewards = await prisma.reward.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
  });

  // Get time controls
  const timeControls = await prisma.timeControls.findUnique({
    where: { childId },
  });

  // Calculate summary
  const totalSessions = subjectProgress.length;
  const totalPlayTimeSec = subjectProgress.reduce((sum, sp) => sum + sp.timeSpentSec, 0);
  const totalCoinsEarned = child.coins;
  const averageCompletion = subjectProgress.length > 0
    ? subjectProgress.reduce((sum, sp) => sum + sp.completion, 0) / subjectProgress.length
    : 0;

  // Find most played subject
  let mostPlayedSubject = null;
  let maxTime = 0;
  for (const sp of subjectProgress) {
    if (sp.timeSpentSec > maxTime) {
      maxTime = sp.timeSpentSec;
      mostPlayedSubject = sp.subject?.name || sp.subjectId;
    }
  }

  const lastActivity = subjectProgress.length > 0
    ? subjectProgress.reduce((latest, sp) => {
        if (!latest || (sp.lastPlayedAt && new Date(sp.lastPlayedAt) > new Date(latest))) {
          return sp.lastPlayedAt;
        }
        return latest;
      }, null)
    : null;

  res.json({
    child: {
      id: child.id,
      displayName: child.displayName,
      coins: child.coins,
      createdAt: child.createdAt,
    },
    subjects: subjectProgress.map((sp) => ({
      subjectId: sp.subjectId,
      subjectName: sp.subject?.name || sp.subjectId,
      totalTimeSpentSec: sp.timeSpentSec,
      completion: sp.completion,
      sessionsCount: 1, // Each record is one session
      lastPlayedAt: sp.lastPlayedAt,
    })),
    rewards: rewards.slice(0, 20), // Last 20 rewards
    timeControls,
    summary: {
      totalSessions,
      totalPlayTimeSec,
      totalCoinsEarned,
      averageCompletion: Math.round(averageCompletion * 10) / 10,
      mostPlayedSubject,
      lastActivityAt: lastActivity,
    },
  });
});

/**
 * GET /api/children/:childId/reports/:subjectId
 * Get subject-specific report
 */
router.get("/:childId/reports/:subjectId", requireAuth, async (req, res) => {
  const { childId, subjectId } = req.params;

  // Verify child belongs to this parent
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });

  if (!child) {
    return res.status(404).json({ message: "Child not found" });
  }

  const progress = await prisma.subjectProgress.findMany({
    where: { childId, subjectId },
    orderBy: { lastPlayedAt: "desc" },
  });

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });

  const totalTimeSpentSec = progress.reduce((sum, sp) => sum + sp.timeSpentSec, 0);
  const averageCompletion = progress.length > 0
    ? progress.reduce((sum, sp) => sum + sp.completion, 0) / progress.length
    : 0;

  res.json({
    subjectId,
    subjectName: subject?.name || subjectId,
    totalTimeSpentSec,
    completion: Math.round(averageCompletion * 10) / 10,
    sessionsCount: progress.length,
    lastPlayedAt: progress[0]?.lastPlayedAt || null,
    sessions: progress.map((sp) => ({
      date: sp.lastPlayedAt ? new Date(sp.lastPlayedAt).toISOString().split("T")[0] : null,
      timeSpentSec: sp.timeSpentSec,
      completion: sp.completion,
    })),
  });
});

/**
 * GET /api/children/:childId/reports/time-trend
 * Get daily play time for the last 7 days
 */
router.get("/:childId/reports/time-trend", requireAuth, async (req, res) => {
  const { childId } = req.params;

  // Verify child belongs to this parent
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });

  if (!child) {
    return res.status(404).json({ message: "Child not found" });
  }

  // Get progress records from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const progressRecords = await prisma.subjectProgress.findMany({
    where: {
      childId,
      lastPlayedAt: { gte: sevenDaysAgo },
    },
    orderBy: { lastPlayedAt: "desc" },
  });

  // Group by day
  const daysMap = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    daysMap[dateStr] = 0;
  }

  for (const record of progressRecords) {
    if (record.lastPlayedAt) {
      const dateStr = new Date(record.lastPlayedAt).toISOString().split("T")[0];
      if (daysMap[dateStr] !== undefined) {
        daysMap[dateStr] += record.timeSpentSec;
      }
    }
  }

  const days = Object.entries(daysMap).map(([date, totalTimeSec]) => ({
    date,
    totalTimeSec,
  }));

  res.json({ days });
});

export default router;
