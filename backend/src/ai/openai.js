// Shared OpenAI chat-completion helpers.
// Used by the parent-facing AI chat (ai.routes.js) and the in-game
// "help after X mistakes" hint generator (game.routes.js).
// Reads OPENAI_API_KEY from the environment (set in Railway).

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export const AI_MODEL = "gpt-4o-mini";

/**
 * Low-level chat completion. Throws so callers can choose how to degrade:
 *   err.code === "NO_KEY"     → OPENAI_API_KEY not configured
 *   err.code === "OPENAI_ERR" → upstream non-2xx (see err.status, err.detail)
 */
export async function chatCompletion({ messages, maxTokens = 400, temperature = 0.6 }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const e = new Error("OPENAI_API_KEY missing");
    e.code = "NO_KEY";
    throw e;
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: AI_MODEL, messages, max_tokens: maxTokens, temperature }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const e = new Error(`OpenAI error ${response.status}`);
    e.code = "OPENAI_ERR";
    e.status = response.status;
    e.detail = detail.slice(0, 500);
    throw e;
  }

  const data = await response.json();
  return {
    reply: data.choices?.[0]?.message?.content?.trim() || "",
    model: AI_MODEL,
    usage: data.usage || null,
  };
}

/**
 * Generate a short, kid-friendly hint for a question the child just got wrong
 * several times. Deliberately does NOT reveal the final answer — it nudges the
 * child toward figuring it out. Returns a plain string (may be empty on a weird
 * upstream response; caller should have a fallback).
 */
export async function generateChildHint({
  displayName,
  subjectName,
  question,
  userAnswer,
  correctAnswer,
  options,
}) {
  const name = (displayName || "the child").trim();
  const subj = subjectName ? ` (${subjectName})` : "";
  const optionsLine =
    Array.isArray(options) && options.length
      ? `\nThe choices shown were: ${options.join(", ")}.`
      : "";

  const system = `You are a warm, encouraging tutor speaking directly to a young child named ${name} who is playing an educational game.
The child has just gotten this kind of question wrong a few times and needs a gentle hand.
Rules:
- Talk TO the child, simply and kindly. Short sentences. 2-4 sentences max.
- Do NOT state the final answer outright. Give a hint, a strategy, or a way to think about it so they can get it themselves.
- Be positive and reduce frustration ("You're close!", "Let's try a different way").
- Plain text only: no markdown, no lists. At most one friendly emoji.`;

  const user = `Subject${subj}: ${subjectName || "general"}
Question: ${question || "(unknown)"}
The child's wrong answer: ${userAnswer || "(blank)"}
The correct answer (for your reference only — do NOT reveal it directly): ${correctAnswer || "(unknown)"}${optionsLine}

Write the hint now.`;

  const { reply } = await chatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    maxTokens: 200,
    temperature: 0.7,
  });
  return reply;
}
