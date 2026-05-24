import express from "express";
import prisma from "../db/prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = express.Router();

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

// Compact "5m ago", "2h ago", "3d ago" formatter — easier for the model to read than ISO timestamps.
function fmtAgo(date, now = new Date()) {
  if (!date) return "?";
  const diffMs = now.getTime() - new Date(date).getTime();
  if (diffMs < 0)         return "in future";
  const s = Math.floor(diffMs / 1000);
  if (s < 60)             return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)             return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)             return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 14)             return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 8)              return `${w}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

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
        include: {
          subjects:     { include: { subject: true } },
          timeControls: true,
        },
      });

      if (child) {
        const now = new Date();
        const oneDayAgo  = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
          totalAnswers,
          correctAnswers,
          timedOutTotal,
          totalLast7d,
          correctLast7d,
          totalLast24h,
          correctLast24h,
          recentWrongs,
          recentTimedOut,
          recentCorrects,
          recentScores,
          recentSessions,
          perSubjectAnswerStats,
          subjectScopedWrongs,
          subjectScopedCorrects,
        ] = await Promise.all([
          prisma.answerRecord.count({ where: { childId } }),
          prisma.answerRecord.count({ where: { childId, isCorrect: true } }),
          prisma.answerRecord.count({ where: { childId, timedOut: true } }),

          // 7-day window
          prisma.answerRecord.count({ where: { childId, createdAt: { gte: sevenDaysAgo } } }),
          prisma.answerRecord.count({ where: { childId, isCorrect: true, createdAt: { gte: sevenDaysAgo } } }),

          // 24h window (for "today vs week" trend)
          prisma.answerRecord.count({ where: { childId, createdAt: { gte: oneDayAgo } } }),
          prisma.answerRecord.count({ where: { childId, isCorrect: true, createdAt: { gte: oneDayAgo } } }),

          // Recent wrong (not timed-out)
          prisma.answerRecord.findMany({
            where: { childId, isCorrect: false, timedOut: false },
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { subject: { select: { name: true } } },
          }),

          // Recent timed-out — separate signal (anxiety / too hard / disengaged)
          prisma.answerRecord.findMany({
            where: { childId, timedOut: true },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { subject: { select: { name: true } } },
          }),

          // Recent correct — what's clicking
          prisma.answerRecord.findMany({
            where: { childId, isCorrect: true },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { subject: { select: { name: true } } },
          }),

          prisma.scoreRecord.findMany({
            where: { childId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { subject: { select: { name: true } } },
          }),

          // Last few play sessions for engagement context
          prisma.session.findMany({
            where: { childId },
            orderBy: { endedAt: "desc" },
            take: 5,
            include: { subject: { select: { name: true } } },
          }),

          // Per-subject answer breakdown — total + correct grouped by subjectId
          prisma.answerRecord.groupBy({
            by: ["subjectId", "isCorrect"],
            where: { childId },
            _count: { _all: true },
          }),

          // Subject-scoped wrongs (only when parent is on a subject page)
          subjectId
            ? prisma.answerRecord.findMany({
                where: { childId, subjectId, isCorrect: false, timedOut: false },
                orderBy: { createdAt: "desc" },
                take: 6,
              })
            : Promise.resolve([]),

          // Subject-scoped corrects
          subjectId
            ? prisma.answerRecord.findMany({
                where: { childId, subjectId, isCorrect: true },
                orderBy: { createdAt: "desc" },
                take: 4,
              })
            : Promise.resolve([]),
        ]);

        // ─── Derived metrics ────────────────────────────────────────────
        const accuracyPct = totalAnswers > 0
          ? Math.round((correctAnswers / totalAnswers) * 100)
          : null;
        const acc7d = totalLast7d > 0
          ? Math.round((correctLast7d / totalLast7d) * 100)
          : null;
        const acc24h = totalLast24h > 0
          ? Math.round((correctLast24h / totalLast24h) * 100)
          : null;
        const timedOutPct = totalAnswers > 0
          ? Math.round((timedOutTotal / totalAnswers) * 100)
          : 0;

        let trendLine = "(not enough data)";
        if (acc7d != null && accuracyPct != null) {
          if (acc24h != null && totalLast24h >= 5) {
            const delta = acc24h - acc7d;
            const arrow = delta > 5 ? "↑" : delta < -5 ? "↓" : "→";
            trendLine = `last 24h ${acc24h}% ${arrow} vs 7d avg ${acc7d}%`;
          } else {
            trendLine = `last 7d: ${acc7d}% (${correctLast7d}/${totalLast7d})`;
          }
        }

        // Compute age from birthdate
        let ageLine = "";
        if (child.birthdate) {
          const ageYears = Math.floor(
            (now.getTime() - new Date(child.birthdate).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          );
          if (ageYears >= 0 && ageYears < 30) ageLine = `- Age: ${ageYears}\n`;
        }

        // Per-subject accuracy map
        const subjAccMap = {};
        for (const row of perSubjectAnswerStats) {
          if (!row.subjectId) continue;
          if (!subjAccMap[row.subjectId]) subjAccMap[row.subjectId] = { correct: 0, total: 0 };
          subjAccMap[row.subjectId].total += row._count._all;
          if (row.isCorrect) subjAccMap[row.subjectId].correct += row._count._all;
        }

        // ─── Subject summary lines ──────────────────────────────────────
        const subjectsSummary = child.subjects.length
          ? child.subjects
              .map((s) => {
                const name = s.subject?.name || s.subjectId;
                const mastery = Math.round(s.completion || 0);
                const min = Math.round((s.timeSpentSec || 0) / 60);
                const acc = subjAccMap[s.subjectId];
                const accStr = acc && acc.total > 0
                  ? `, accuracy ${Math.round((acc.correct / acc.total) * 100)}% (${acc.correct}/${acc.total})`
                  : "";
                const last = s.lastPlayedAt
                  ? `, last played ${fmtAgo(s.lastPlayedAt, now)}`
                  : "";
                return `  · ${name}: mastery ${mastery}%, time ${min}m${accStr}${last}`;
              })
              .join("\n")
          : "  (no subjects played yet)";

        const wrongsList = recentWrongs.length
          ? recentWrongs.map((a) => {
              const subj = a.subject?.name || "—";
              return `  · [${subj}] "${a.question || "?"}" — kid said "${a.userAnswer ?? ""}", correct was "${a.correctAnswer ?? ""}"`;
            }).join("\n")
          : "  (none recorded recently)";

        const timedOutList = recentTimedOut.length
          ? recentTimedOut.map((a) => {
              const subj = a.subject?.name || "—";
              return `  · [${subj}] "${a.question || "?"}" — correct was "${a.correctAnswer ?? ""}"`;
            }).join("\n")
          : "  (none)";

        const correctsList = recentCorrects.length
          ? recentCorrects.map((a) => {
              const subj = a.subject?.name || "—";
              return `  · [${subj}] "${a.question || "?"}" — got "${a.correctAnswer ?? ""}"`;
            }).join("\n")
          : "  (none recorded)";

        const scoresList = recentScores.length
          ? recentScores.map((s) =>
              `  · ${s.subject?.name || s.subjectId || "—"}: ${s.score}${s.maxScore ? "/" + s.maxScore : ""} (${s.label || "Run"})`
            ).join("\n")
          : "  (none recorded)";

        const sessionsList = recentSessions.length
          ? recentSessions.map((s) => {
              const subj = s.subject?.name || "—";
              const mins = Math.round((s.durationSec || 0) / 60);
              const when = s.endedAt ? fmtAgo(s.endedAt, now) : "?";
              return `  · ${subj}: ${mins}m, ended ${when}`;
            }).join("\n")
          : "  (no sessions recorded)";

        // ─── Time controls block ────────────────────────────────────────
        const tc = child.timeControls;
        const timeControlsBlock = tc
          ? `TIME CONTROLS (parent's current limits — your advice should respect these):
  · Daily limit: ${tc.dailyMinutes ?? "—"} min
  · Session length: ${tc.sessionMinutes ?? "—"} min
  · Break: ${tc.breakMinutes ?? "—"} min
  · Allowed window: ${tc.allowedFrom || "—"} → ${tc.allowedTo || "—"}
  · Bedtime block: ${tc.bedtimeBlock || "—"}${tc.blockAfterBedtime ? " (enforced)" : " (not enforced)"}`
          : "TIME CONTROLS: (defaults)";

        // ─── Focus subject sub-block ────────────────────────────────────
        const focusSubject = subjectId
          ? (child.subjects.find((s) => s.subjectId === subjectId)?.subject?.name || subjectId)
          : null;

        const focusAcc = subjectId ? subjAccMap[subjectId] : null;
        const focusAccPct = focusAcc && focusAcc.total > 0
          ? Math.round((focusAcc.correct / focusAcc.total) * 100)
          : null;

        const focusBlock = subjectId
          ? `\nFOCUS SUBJECT — ${focusSubject}:
  · Accuracy here: ${focusAccPct != null ? focusAccPct + "%" : "no data"}${focusAcc ? ` (${focusAcc.correct}/${focusAcc.total})` : ""}
  · Recent wrongs in this subject:
${subjectScopedWrongs.length
  ? subjectScopedWrongs.map((a) => `    · "${a.question || "?"}" — said "${a.userAnswer ?? ""}", correct "${a.correctAnswer ?? ""}"`).join("\n")
  : "    (none)"}
  · Recent corrects in this subject:
${subjectScopedCorrects.length
  ? subjectScopedCorrects.map((a) => `    · "${a.question || "?"}" — got "${a.correctAnswer ?? ""}"`).join("\n")
  : "    (none)"}
`
          : "";

        // Force-stop signal
        const lockedLine = child.forceStopped
          ? `- ⚠ Currently FORCE-STOPPED by parent${child.forceStoppedAt ? ` (since ${fmtAgo(child.forceStoppedAt, now)})` : ""}\n`
          : "";

        const lastSeenLine = child.lastSeenAt
          ? `- Last seen in-game: ${fmtAgo(child.lastSeenAt, now)}\n`
          : "";

        childContext = `\nCHILD CONTEXT (cite specific numbers, subjects, and example questions when relevant — don't generalise if you can quote real data):
- Name: ${child.displayName}
${ageLine}- Overall accuracy: ${accuracyPct != null ? accuracyPct + "%" : "no data"} (${correctAnswers} correct of ${totalAnswers})
- Trend: ${trendLine}
- Timed-out rate: ${timedOutPct}% (${timedOutTotal} timed-out of ${totalAnswers})
- Coins: ${child.coins ?? 0}
${lastSeenLine}${lockedLine}${focusSubject ? `- Parent is currently focused on: ${focusSubject}\n` : ""}
PER-SUBJECT BREAKDOWN:
${subjectsSummary}

${timeControlsBlock}

RECENT MISTAKES (last 8 wrong, excluding timed-out):
${wrongsList}

RECENT TIMED-OUTS (last 5 — possible "stuck" / anxiety signal):
${timedOutList}

RECENT CORRECTS (last 5 — what's clicking):
${correctsList}

RECENT SCORES (last 5 score-game runs):
${scoresList}

RECENT SESSIONS (last 5 play sessions):
${sessionsList}
${focusBlock}`;
      }
    } catch (err) {
      console.error("AI chat — context lookup failed:", err);
      // continue without context rather than failing the whole request
    }
  }

  const systemPrompt = `You are NeuroQuest's AI helper for parents.
Your job: give concrete, warm, evidence-based advice about a kid's learning, screen time, motivation, and progress.

How to use the CHILD CONTEXT below (when present):
- Quote specific numbers, subjects, and example questions instead of speaking in generalities.
- If the trend shows a decline, point at the subjects or question types driving it.
- High timed-out rate suggests time pressure / anxiety — name that explicitly when it's high.
- "Recent corrects" tell you what is clicking — use them to suggest next-step extensions.
- "Recent timed-outs" and "recent mistakes" tell you what is NOT clicking — suggest concrete practice for those.
- When the parent has set TIME CONTROLS, your suggestions must respect those limits (don't recommend "an hour more" if daily is 30 min).
- If the kid is force-stopped, acknowledge that briefly and steer the conversation to "when they resume".
- If FOCUS SUBJECT is set, weight your advice toward that subject unless the parent's question is clearly broader.

Style: short paragraphs, no fluff, no boilerplate, no markdown headers. Be warm but specific.
If you don't have data on something the parent asked about, say so — never invent numbers.
If asked for general parenting advice unrelated to NeuroQuest, answer briefly and steer back to actionable suggestions tied to their kid's data.
Avoid medical claims. If the parent describes a serious concern (e.g. self-harm), gently suggest a professional.
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
