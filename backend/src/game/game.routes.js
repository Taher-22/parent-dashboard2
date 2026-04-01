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

  return res.json({
    childId: child.id,
    displayName: child.displayName,
    coins: child.coins,
    timeControls: child.timeControls,
    subjects: child.subjects.map((progress) => ({
      subjectId: progress.subjectId,
      subjectName: progress.subject?.name || "",
      timeSpentSec: progress.timeSpentSec,
      completion: progress.completion,
      lastPlayedAt: progress.lastPlayedAt,
    })),
    rewards: child.rewards,
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

export default router;
