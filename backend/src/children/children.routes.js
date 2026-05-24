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
 * POST /api/children/:childId/force-stop
 * Parent toggles a force-stop on the child. When true, the game's blocked overlay shows
 * and overrides any local dev "force allow play" override.
 * Body: { stopped: boolean }
 */
router.post("/:childId/force-stop", requireAuth, async (req, res) => {
  const { childId } = req.params;
  const { stopped } = req.body ?? {};

  if (typeof stopped !== "boolean") {
    return res.status(400).json({ message: "stopped (boolean) is required" });
  }

  const existing = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });
  if (!existing) {
    return res.status(404).json({ message: "Child not found" });
  }

  const updated = await prisma.child.update({
    where: { id: childId },
    data: {
      forceStopped: stopped,
      forceStoppedAt: stopped ? new Date() : null,
    },
  });

  res.json({
    id: updated.id,
    forceStopped: updated.forceStopped,
    forceStoppedAt: updated.forceStoppedAt,
  });
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

  // If no time controls exist, create with defaults
  if (!child.timeControls) {
    const newTimeControls = await prisma.timeControls.create({
      data: {
        dailyMinutes: 60,
        sessionMinutes: 25,
        breakMinutes: 7,
        allowedFrom: "16:00",
        allowedTo: "18:00",
        bedtimeBlock: "20:30",
        blockAfterBedtime: true,
        maxSessionsAllowed: 3,
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
  const {
    dailyMinutes, sessionMinutes, breakMinutes,
    allowedFrom, allowedTo,
    bedtimeBlock, blockAfterBedtime,
    maxSessionsAllowed,
  } = req.body;

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });

  if (!child) {
    return res.status(404).json({ message: "Child not found" });
  }

  const timeControls = await prisma.timeControls.upsert({
    where: { childId },
    update: {
      ...(dailyMinutes        !== undefined && { dailyMinutes }),
      ...(sessionMinutes      !== undefined && { sessionMinutes }),
      ...(breakMinutes        !== undefined && { breakMinutes }),
      ...(allowedFrom         !== undefined && { allowedFrom }),
      ...(allowedTo           !== undefined && { allowedTo }),
      ...(bedtimeBlock        !== undefined && { bedtimeBlock }),
      ...(blockAfterBedtime   !== undefined && { blockAfterBedtime }),
      ...(maxSessionsAllowed  !== undefined && { maxSessionsAllowed }),
    },
    create: {
      dailyMinutes:       dailyMinutes       ?? 60,
      sessionMinutes:     sessionMinutes     ?? 25,
      breakMinutes:       breakMinutes       ?? 7,
      allowedFrom:        allowedFrom        ?? "16:00",
      allowedTo:          allowedTo          ?? "18:00",
      bedtimeBlock:       bedtimeBlock       ?? "20:30",
      blockAfterBedtime:  blockAfterBedtime  ?? true,
      maxSessionsAllowed: maxSessionsAllowed ?? 3,
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

  // Subjects we don't want surfaced as learning progress (main menu, navigation, etc.)
  const NON_LEARNING_SUBJECT_IDS = ["seed_s_mainmenu"];

  // Get subject progress (excluding non-learning subjects)
  const subjectProgress = (await prisma.subjectProgress.findMany({
    where: { childId },
    include: { subject: true },
  })).filter((sp) => !NON_LEARNING_SUBJECT_IDS.includes(sp.subjectId));

  // Get rewards
  const rewards = await prisma.reward.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
  });

  // Get time controls
  const timeControls = await prisma.timeControls.findUnique({
    where: { childId },
  });

  // Per-subject session counts from the Session table.
  const sessionGroups = await prisma.session.groupBy({
    by: ["subjectId"],
    where: { childId },
    _count: { _all: true },
  });
  const perSubjectSessionCount = {};
  for (const g of sessionGroups) {
    if (g.subjectId) perSubjectSessionCount[g.subjectId] = g._count._all;
  }

  // Per-subject answer stats (correct / total).
  const answerGroups = await prisma.answerRecord.groupBy({
    by: ["subjectId", "isCorrect"],
    where: { childId },
    _count: { _all: true },
  });
  const perSubjectAnswers = {};
  for (const g of answerGroups) {
    if (!g.subjectId) continue;
    const slot = perSubjectAnswers[g.subjectId] || (perSubjectAnswers[g.subjectId] = { correct: 0, total: 0 });
    slot.total += g._count._all;
    if (g.isCorrect) slot.correct += g._count._all;
  }

  // Recent wrong answers for the dashboard "needs practice" panel.
  const recentWrong = await prisma.answerRecord.findMany({
    where: { childId, isCorrect: false },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, subjectId: true, question: true, options: true, userAnswer: true, correctAnswer: true, createdAt: true },
  });

  // Recent score events (newest first, up to 20) + best score per subject.
  const recentScores = await prisma.scoreRecord.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { subject: { select: { id: true, name: true } } },
  });
  const bestScoresRaw = await prisma.scoreRecord.groupBy({
    by: ["subjectId"],
    where: { childId },
    _max: { score: true },
  });
  const bestScoreBySubject = {};
  for (const row of bestScoresRaw) {
    if (row.subjectId) bestScoreBySubject[row.subjectId] = row._max.score ?? 0;
  }

  // Calculate summary
  const totalSessions = await prisma.session.count({ where: { childId } });
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
    subjects: subjectProgress.map((sp) => {
      const a = perSubjectAnswers[sp.subjectId] || { correct: 0, total: 0 };
      return {
        subjectId: sp.subjectId,
        subjectName: sp.subject?.name || sp.subjectId,
        totalTimeSpentSec: sp.timeSpentSec,
        completion: sp.completion,
        sessionsCount: perSubjectSessionCount[sp.subjectId] || 0,
        lastPlayedAt: sp.lastPlayedAt,
        answersCorrect: a.correct,
        answersTotal: a.total,
        accuracyPct: a.total > 0 ? Math.round((a.correct / a.total) * 100) : null,
        bestScore: bestScoreBySubject[sp.subjectId] ?? null,
      };
    }),
    recentWrongAnswers: recentWrong,
    recentScores: recentScores.map((s) => ({
      id: s.id,
      subjectId: s.subjectId,
      subjectName: s.subject?.name || null,
      score: s.score,
      maxScore: s.maxScore,
      label: s.label,
      createdAt: s.createdAt,
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
 * PUT /api/children/:childId/coins
 * Parent edits a child's coin balance (absolute set OR delta adjustment).
 *
 * Body:
 *   { coins: number }   → set the balance to this exact value (clamped >= 0)
 * OR
 *   { delta: number }   → add this amount (can be negative; result clamped >= 0)
 */
router.put("/:childId/coins", requireAuth, async (req, res) => {
  const { childId } = req.params;
  const { coins, delta } = req.body ?? {};

  if (typeof coins !== "number" && typeof delta !== "number") {
    return res.status(400).json({ message: "Provide coins (absolute) or delta (relative)." });
  }

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });
  if (!child) return res.status(404).json({ message: "Child not found" });

  const nextBalance = Math.max(
    0,
    Math.round(typeof coins === "number" ? coins : (child.coins || 0) + delta)
  );

  const updated = await prisma.child.update({
    where: { id: childId },
    data: { coins: nextBalance },
    select: { id: true, coins: true },
  });

  res.json({ id: updated.id, coins: updated.coins });
});

/**
 * GET /api/children/:childId/answers
 * Paginated list of answer records for review (right/wrong with metadata).
 *
 * Query params:
 *   limit      max items returned (default 50, max 200)
 *   offset     pagination offset (default 0)
 *   isCorrect  "true" | "false" → filter by correctness
 *   subjectId  filter to a single subject
 *
 * Response: { items, total, limit, offset, stats }
 */
router.get("/:childId/answers", requireAuth, async (req, res) => {
  const { childId } = req.params;

  // Ownership check
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });
  if (!child) return res.status(404).json({ message: "Child not found" });

  const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);

  const where = { childId };
  if (req.query.isCorrect === "true")  where.isCorrect = true;
  if (req.query.isCorrect === "false") where.isCorrect = false;
  if (req.query.subjectId) where.subjectId = req.query.subjectId;

  const [items, filteredTotal, totalAnswers, correctAnswers] = await Promise.all([
    prisma.answerRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: { subject: { select: { id: true, name: true } } },
    }),
    prisma.answerRecord.count({ where }),
    prisma.answerRecord.count({ where: { childId } }),
    prisma.answerRecord.count({ where: { childId, isCorrect: true } }),
  ]);

  res.json({
    items: items.map((a) => ({
      id: a.id,
      subjectId: a.subjectId,
      subjectName: a.subject?.name || null,
      question: a.question,
      options: Array.isArray(a.options) ? a.options : null,
      userAnswer: a.userAnswer,
      correctAnswer: a.correctAnswer,
      isCorrect: a.isCorrect,
      createdAt: a.createdAt,
    })),
    total: filteredTotal,
    limit,
    offset,
    stats: {
      totalAnswers,
      correctAnswers,
      wrongAnswers: totalAnswers - correctAnswers,
      accuracyPct: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : null,
    },
  });
});

/**
 * GET /api/children/:childId/reports/time-trend
 * Get daily play time for the last 7 days
 * MUST be declared before /:childId/reports/:subjectId to avoid being shadowed
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

/**
 * GET /api/children/:childId/reports/:subjectId
 * Get subject-specific report
 */
router.get("/:childId/reports/:subjectId", requireAuth, async (req, res) => {
  const { childId, subjectId } = req.params;

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

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });

  const totalTimeSpentSec = progress.reduce((sum, sp) => sum + sp.timeSpentSec, 0);
  const averageCompletion =
    progress.length > 0
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
 * POST /api/children/:childId/messages
 * Parent sends a message to child
 */
router.post("/:childId/messages", requireAuth, async (req, res) => {
  const { childId } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ message: "Message content is required" });
  }

  // Verify child belongs to this parent
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });

  if (!child) {
    return res.status(404).json({ message: "Child not found" });
  }

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      parentId: req.user.id,
      childId,
    },
  });

  res.json(message);
});

/**
 * GET /api/children/:childId/messages
 * Parent gets messages for a child
 */
router.get("/:childId/messages", requireAuth, async (req, res) => {
  const { childId } = req.params;

  // Verify child belongs to this parent
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: req.user.id },
  });

  if (!child) {
    return res.status(404).json({ message: "Child not found" });
  }

  const messages = await prisma.message.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
    take: 50, // Last 50 messages
  });

  res.json(messages);
});

export default router;
