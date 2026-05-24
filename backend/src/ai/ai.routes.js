import express from "express";
import prisma from "../db/prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = express.Router();

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

/**
 * POST /api/ai/chat
 * Body: { messages: [{ role, content }], childId?, subjectId? }
 * If a childId belonging to this parent is provided, the kid's recent
 * answer stats / subject mastery / mistakes are injected as a system
 * message so the model can give grounded, specific advice.
 */
router.post("/chat", requireAuth, async (req, res) => {
  const { messages, childId, subjectId } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "AI is not configured on the server (OPENAI_API_KEY missing).",
    });
  }

  // Build child context — only if the caller owns this child.
  let childContext = "";
  if (childId) {
    try {
      const child = await prisma.child.findFirst({
        where: { id: childId, parentId: req.user.id },
        include: { subjects: { include: { subject: true } } },
      });

      if (child) {
        const [totalAnswers, correctAnswers, recentWrongs, recentScores] = await Promise.all([
          prisma.answerRecord.count({ where: { childId } }),
          prisma.answerRecord.count({ where: { childId, isCorrect: true } }),
          prisma.answerRecord.findMany({
            where: { childId, isCorrect: false, timedOut: false },
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { subject: { select: { name: true } } },
          }),
          prisma.scoreRecord.findMany({
            where: { childId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { subject: { select: { name: true } } },
          }),
        ]);

        const accuracyPct = totalAnswers > 0
          ? Math.round((correctAnswers / totalAnswers) * 100)
          : null;

        const subjectsSummary = child.subjects
          .map((s) => {
            const name = s.subject?.name || s.subjectId;
            const mastery = Math.round(s.completion || 0);
            const min = Math.round((s.timeSpentSec || 0) / 60);
            return `  · ${name}: mastery ${mastery}%, time ${min}m`;
          })
          .join("\n");

        const wrongsList = recentWrongs.length
          ? recentWrongs.map((a) => {
              const subj = a.subject?.name || "—";
              return `  · [${subj}] "${a.question}" — kid said "${a.userAnswer}", correct was "${a.correctAnswer}"`;
            }).join("\n")
          : "  (none recorded recently)";

        const scoresList = recentScores.length
          ? recentScores.map((s) =>
              `  · ${s.subject?.name || s.subjectId}: ${s.score}${s.maxScore ? "/" + s.maxScore : ""} (${s.label || "Run"})`
            ).join("\n")
          : "  (none recorded)";

        const focusSubject = subjectId
          ? (child.subjects.find((s) => s.subjectId === subjectId)?.subject?.name || subjectId)
          : null;

        childContext = `\nCHILD CONTEXT (use this when relevant; cite specific numbers / questions when answering):
- Name: ${child.displayName}
- Overall accuracy: ${accuracyPct != null ? accuracyPct + "%" : "no data"} (${correctAnswers} correct of ${totalAnswers})
- Coins balance: ${child.coins ?? 0}
${focusSubject ? `- Parent is currently focused on: ${focusSubject}\n` : ""}
PER-SUBJECT MASTERY:
${subjectsSummary || "  (no subjects played yet)"}

RECENT MISTAKES (last 8 wrong answers, excluding timed-out):
${wrongsList}

RECENT SCORES (last 5):
${scoresList}
`;
      }
    } catch (err) {
      console.error("AI chat — context lookup failed:", err);
      // continue without context rather than failing the whole request
    }
  }

  const systemPrompt = `You are NeuroQuest's AI helper for parents.
Your job: give concrete, warm, evidence-based advice about a kid's learning, screen time, motivation, and progress.
Style: short paragraphs, no fluff, no boilerplate. Cite specific numbers from the context when you can.
If asked for general parenting advice unrelated to NeuroQuest, answer briefly and steer back to actionable suggestions.
Avoid medical claims. If the parent describes a serious concern (eg. self-harm), gently suggest a professional.
${childContext}`;

  const finalMessages = [
    { role: "system", content: systemPrompt },
    ...messages.filter((m) => m && typeof m.role === "string" && typeof m.content === "string"),
  ];

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: finalMessages,
        max_tokens: 600,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("OpenAI error:", response.status, errText);
      return res.status(502).json({
        error: "AI service error",
        status: response.status,
        detail: errText.slice(0, 500),
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "(no response)";

    res.json({
      reply,
      model: MODEL,
      usage: data.usage || null,
    });
  } catch (err) {
    console.error("AI chat — fetch failed:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

export default router;
