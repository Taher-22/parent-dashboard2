import express from "express";
import prisma from "../db/prisma.js";

const router = express.Router();

router.get("/child/:childId/progress", async (req, res) => {
  const { childId } = req.params;

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: {
      id: true,
      displayName: true,
      coins: true,
      timeControls: true,
      lastSeenAt: true,
      currentSubjectId: true,
      forceStopped: true,
      subjects: {
        include: {
          subject: true,
        },
      },
      rewards: true,
    },
  });

  if (!child) {
    return res.status(404).json({ error: "Child not found" });
  }

  // Pull session counters
  const allSessions = await prisma.session.findMany({
    where: { childId },
    select: { subjectId: true, durationSec: true, endedAt: true },
    orderBy: { endedAt: "desc" },
  });
  const lifetimeSessions = allSessions.length;
  const perSubjectSessionCount = {};
  for (const s of allSessions) {
    if (s.subjectId) {
      perSubjectSessionCount[s.subjectId] = (perSubjectSessionCount[s.subjectId] || 0) + 1;
    }
  }

  const NON_LEARNING_SUBJECT_IDS = ["seed_s_mainmenu"];

  return res.json({
    childId: child.id,
    displayName: child.displayName,
    coins: child.coins,
    timeControls: child.timeControls,
    lastSeenAt: child.lastSeenAt,
    currentSubjectId: child.currentSubjectId,
    forceStopped: child.forceStopped,
    subjects: child.subjects
      .filter((progress) => !NON_LEARNING_SUBJECT_IDS.includes(progress.subjectId))
      .map((progress) => ({
        subjectId: progress.subjectId,
        subjectName: progress.subject?.name || "",
        timeSpentSec: progress.timeSpentSec,
        completion: progress.completion,
        lastPlayedAt: progress.lastPlayedAt,
        sessionCount: perSubjectSessionCount[progress.subjectId] || 0,
      })),
    rewards: child.rewards,
    lifetimeSessions,
    recentSessions: allSessions.slice(0, 20).map((s) => ({
      subjectId: s.subjectId,
      durationSec: s.durationSec,
      endedAt: s.endedAt,
    })),
  });
});

router.post("/child/:childId/progress", async (req, res) => {
  const { childId } = req.params;
  const { subjectId, timeSpentSec, completion, coinsEarned, reward } = req.body;

  if (!subjectId || typeof timeSpentSec !== "number") {
    return res.status(400).json({ error: "subjectId and timeSpentSec are required" });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return res.status(404).json({ error: "Child not found" });
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return res.status(404).json({ error: "Subject not found" });
  }

  const existingProgress = await prisma.subjectProgress.findUnique({
    where: {
      childId_subjectId: {
        childId,
        subjectId,
      },
    },
  });

  const normalizedCompletion = Math.max(0, Math.min(100, completion ?? 0));

  const progress = existingProgress
    ? await prisma.subjectProgress.update({
        where: {
          childId_subjectId: {
            childId,
            subjectId,
          },
        },
        data: {
          timeSpentSec: {
            increment: timeSpentSec,
          },
          completion: normalizedCompletion,
          lastPlayedAt: new Date(),
        },
      })
    : await prisma.subjectProgress.create({
        data: {
          childId,
          subjectId,
          timeSpentSec,
          completion: normalizedCompletion,
          lastPlayedAt: new Date(),
        },
      });

  let updatedChild = child;
  if (typeof coinsEarned === "number" && coinsEarned !== 0) {
    updatedChild = await prisma.child.update({
      where: { id: childId },
      data: {
        coins: {
          increment: coinsEarned,
        },
      },
    });
  }

  let createdReward = null;
  if (reward && reward.type && typeof reward.value === "number") {
    createdReward = await prisma.reward.create({
      data: {
        type: reward.type,
        value: reward.value,
        childId,
      },
    });
  }

  return res.json({
    progress,
    totalCoins: updatedChild.coins,
    reward: createdReward,
  });
});

router.post("/child/:childId/reward", async (req, res) => {
  const { childId } = req.params;
  const { type, value } = req.body;

  if (!type || typeof value !== "number") {
    return res.status(400).json({ error: "Reward type and value are required" });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return res.status(404).json({ error: "Child not found" });
  }

  const reward = await prisma.reward.create({
    data: {
      type,
      value,
      childId,
    },
  });

  return res.status(201).json(reward);
});

/**
 * GET /api/game/messages?childCode=XXX
 * Game fetches messages sent by the parent
 */
router.get("/messages", async (req, res) => {
  const { childCode } = req.query;

  if (!childCode) {
    return res.status(400).json({ error: "childCode is required" });
  }

  const child = await prisma.child.findUnique({
    where: { childCode },
  });

  if (!child) {
    return res.status(404).json({ error: "Invalid child code" });
  }

  const messages = await prisma.message.findMany({
    where: { childId: child.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  res.json({
    childId: child.id,
    displayName: child.displayName,
    messages,
  });
});

/**
 * PATCH /api/game/messages/read?childCode=XXX
 * Game marks all unread messages as read (call when child opens the inbox)
 * Optional body: { messageIds: ["id1","id2"] } to mark specific messages only
 */
router.patch("/messages/read", async (req, res) => {
  const { childCode } = req.query;

  if (!childCode) {
    return res.status(400).json({ error: "childCode is required" });
  }

  const child = await prisma.child.findUnique({
    where: { childCode },
  });

  if (!child) {
    return res.status(404).json({ error: "Invalid child code" });
  }

  const { messageIds } = req.body ?? {};

  const where = {
    childId: child.id,
    read: false,
    ...(Array.isArray(messageIds) && messageIds.length > 0 && { id: { in: messageIds } }),
  };

  const result = await prisma.message.updateMany({
    where,
    data: { read: true },
  });

  res.json({ markedRead: result.count });
});

/**
 * POST /api/game/child/:childId/answer
 * Game posts one answer event.
 * Body: { subjectId?, question?, options?: string[], userAnswer?, correctAnswer?, isCorrect }
 */
router.post("/child/:childId/answer", async (req, res) => {
  const { childId } = req.params;
  const { subjectId, question, options, userAnswer, correctAnswer, isCorrect, isTimedOut, timedOut } = req.body ?? {};

  if (typeof isCorrect !== "boolean") {
    return res.status(400).json({ error: "isCorrect (boolean) is required" });
  }

  const tOut = isTimedOut === true || timedOut === true;

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) return res.status(404).json({ error: "Child not found" });

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ error: "Subject not found" });
  }

  // Sanitize options into a string[] (or null when nothing useful was provided).
  let optionsJson = null;
  if (Array.isArray(options)) {
    const clean = options
      .filter((x) => x != null)
      .map((x) => String(x))
      .filter((x) => x.length > 0);
    if (clean.length > 0) optionsJson = clean;
  }

  const record = await prisma.answerRecord.create({
    data: {
      childId,
      subjectId: subjectId || null,
      question: question || null,
      options: optionsJson,
      userAnswer: userAnswer || null,
      correctAnswer: correctAnswer || null,
      isCorrect,
      timedOut: tOut,
    },
  });

  // Mastery adjustment:
  //  · correct answer  → +1% (cap 100)
  //  · wrong answer    → -1% (floor 0)
  //  · timed-out       → no change (running out of time isn't "got it wrong")
  //  · no subjectId    → no change
  let masteryDelta = 0;
  let newCompletion = null;
  const shouldAdjustMastery = subjectId && (isCorrect || (!isCorrect && !tOut));
  if (shouldAdjustMastery) {
    const existing = await prisma.subjectProgress.findUnique({
      where: { childId_subjectId: { childId, subjectId } },
    });
    const current = existing?.completion ?? 0;
    const raw = current + (isCorrect ? 1 : -1);
    newCompletion = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
    masteryDelta = Math.round((newCompletion - current) * 100) / 100;

    if (existing) {
      await prisma.subjectProgress.update({
        where: { childId_subjectId: { childId, subjectId } },
        data: {
          completion: newCompletion,
          lastPlayedAt: new Date(),
        },
      });
    } else {
      // First time this child has any data for this subject — create the row.
      // Note: for a brand-new subject the first wrong answer leaves completion at 0
      // (floored), so we still create the row to record lastPlayedAt.
      await prisma.subjectProgress.create({
        data: {
          childId,
          subjectId,
          completion: newCompletion,
          timeSpentSec: 0,
          lastPlayedAt: new Date(),
        },
      });
    }
  }

  res.status(201).json({ ...record, masteryDelta, newCompletion });
});

/**
 * POST /api/game/child/:childId/coins
 * Game-side coin adjustment. Always additive — body { delta: number },
 * positive to add, negative to subtract. Result clamped >= 0.
 */
router.post("/child/:childId/coins", async (req, res) => {
  const { childId } = req.params;
  const { delta } = req.body ?? {};

  if (typeof delta !== "number" || !Number.isFinite(delta)) {
    return res.status(400).json({ error: "delta (number) is required" });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) return res.status(404).json({ error: "Child not found" });

  const nextBalance = Math.max(0, Math.round((child.coins || 0) + delta));
  const updated = await prisma.child.update({
    where: { id: childId },
    data: { coins: nextBalance },
    select: { id: true, coins: true },
  });

  res.json(updated);
});

/**
 * POST /api/game/child/:childId/score
 * Game posts a score event (e.g. finished a level / quiz).
 * Body: { subjectId?, score, maxScore?, label? }
 */
router.post("/child/:childId/score", async (req, res) => {
  const { childId } = req.params;
  const { subjectId, score, maxScore, label } = req.body ?? {};

  if (typeof score !== "number" || !Number.isFinite(score)) {
    return res.status(400).json({ error: "score (number) is required" });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) return res.status(404).json({ error: "Child not found" });

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ error: "Subject not found" });
  }

  const record = await prisma.scoreRecord.create({
    data: {
      childId,
      subjectId: subjectId || null,
      score: Math.round(score),
      maxScore: typeof maxScore === "number" && Number.isFinite(maxScore) ? Math.round(maxScore) : null,
      label: label || null,
    },
  });

  res.status(201).json(record);
});

/**
 * POST /api/game/child/:childId/heartbeat
 * Game pings every ~20s while a session is active. Body: { subjectId? }
 * Updates child.lastSeenAt = now + child.currentSubjectId.
 * The dashboard treats `now - lastSeenAt < 60s` as "online".
 */
router.post("/child/:childId/heartbeat", async (req, res) => {
  const { childId } = req.params;
  const { subjectId } = req.body ?? {};

  try {
    const child = await prisma.child.update({
      where: { id: childId },
      data: {
        lastSeenAt: new Date(),
        ...(subjectId !== undefined && { currentSubjectId: subjectId || null }),
      },
      select: { id: true, lastSeenAt: true, currentSubjectId: true },
    });
    res.json({ ok: true, lastSeenAt: child.lastSeenAt, currentSubjectId: child.currentSubjectId });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Child not found" });
    }
    throw err;
  }
});

/**
 * POST /api/game/child/:childId/session
 * Game posts a finished session. Body: { subjectId?, durationSec, completion?, startedAt? }
 */
router.post("/child/:childId/session", async (req, res) => {
  const { childId } = req.params;
  const { subjectId, durationSec, completion, startedAt } = req.body ?? {};

  if (typeof durationSec !== "number" || durationSec < 0) {
    return res.status(400).json({ error: "durationSec is required and must be a non-negative number" });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return res.status(404).json({ error: "Child not found" });
  }

  // Optional: validate subjectId if provided
  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
  }

  const session = await prisma.session.create({
    data: {
      childId,
      subjectId: subjectId || null,
      durationSec,
      completion: typeof completion === "number" ? completion : null,
      startedAt: startedAt ? new Date(startedAt) : null,
    },
  });

  // Lifetime total after this insert
  const lifetimeSessions = await prisma.session.count({ where: { childId } });

  return res.status(201).json({
    session: {
      id: session.id,
      childId: session.childId,
      subjectId: session.subjectId,
      durationSec: session.durationSec,
      completion: session.completion,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    },
    lifetimeSessions,
  });
});

export default router;
