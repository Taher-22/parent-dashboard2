import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { askAI } from "../lib/api.js";
import { useChildren } from "../state/ChildrenContext.jsx";

// Quick-prompt chips. These get rendered as suggestions; clicking sends the
// text straight as a user turn. Keep them short and action-oriented.
const SUGGESTIONS = [
  "What should they practice next?",
  "Why is accuracy slipping this week?",
  "How do I motivate them when they're frustrated?",
  "Are the time limits I have set reasonable?",
  "Summarize their progress so far",
];

function bubbleClass(isUser) {
  return isUser
    ? "bg-gradient-to-r from-emerald-400/25 via-yellow-300/20 to-purple-400/25 border-white/20"
    : "bg-white/15 dark:bg-white/10 border-white/15";
}

export default function ChatPanel() {
  const { activeChild } = useChildren();
  const [searchParams] = useSearchParams();
  const subjectFromUrl = searchParams.get("subject") || null;

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your NeuroQuest AI helper. Ask me anything about how your kid's doing — I can see their recent answers, mastery, and scores.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  function scrollBottom() {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }

  useEffect(() => { scrollBottom(); }, [messages, sending]);

  async function send(text) {
    const trimmed = (text || "").trim();
    if (!trimmed || sending) return;

    const next = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);

    try {
      // Only forward the user/assistant turns to the API (drop the seeded greeting if it was first).
      const apiMessages = next
        .filter((m, i) => !(i === 0 && m.role === "assistant"))
        .map((m) => ({ role: m.role, content: m.content }));

      const { reply } = await askAI({
        messages: apiMessages,
        childId: activeChild?.id || null,
        subjectId: subjectFromUrl,
      });

      setMessages((cur) => [...cur, { role: "assistant", content: reply || "(no response)" }]);
    } catch (err) {
      console.error(err);
      setError(err?.message || "AI request failed. Try again in a moment.");
      // Roll the user message off so they can edit & retry
      setMessages((cur) => cur.slice(0, -1));
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  }

  const placeholder = useMemo(() => {
    if (!activeChild) return "Ask anything about NeuroQuest…";
    if (subjectFromUrl) return `Ask about ${activeChild.displayName}'s ${subjectFromUrl}…`;
    return `Ask about ${activeChild.displayName}…`;
  }, [activeChild, subjectFromUrl]);

  return (
    <div className="panel stroke rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 opacity-85" />
          <div className="font-extrabold">AI Helper</div>
        </div>
        <div className="text-xs opacity-70 truncate">
          {activeChild
            ? <>Context: <span className="font-semibold">{activeChild.displayName}</span>{subjectFromUrl && <> · {subjectFromUrl}</>}</>
            : "No child selected"}
        </div>
      </div>

      <div ref={listRef} className="h-[420px] overflow-auto p-4 space-y-3">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={isUser ? "flex justify-end" : "flex justify-start"}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 border ${bubbleClass(isUser)}`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
              </div>
            </motion.div>
          );
        })}
        {sending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 border bg-white/10 border-white/15 flex items-center gap-2 text-sm opacity-80">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking…</span>
            </div>
          </motion.div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10">
        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={sending}
              className="text-xs px-3 py-1.5 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
            disabled={sending}
            className="flex-1 rounded-xl px-4 py-3 bg-white/10 border border-white/15 outline-none focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-60"
            placeholder={placeholder}
          />
          <button
            onClick={() => send(input)}
            disabled={sending || !input.trim()}
            className="rounded-xl px-4 py-3 font-extrabold bg-gradient-to-r from-emerald-400/40 via-yellow-300/30 to-purple-400/40 border border-white/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
