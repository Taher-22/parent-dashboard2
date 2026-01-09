import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const canned = [
  {
    q: "How can I support fractions at home?",
    a: "Try short 5-minute micro-practice: use pizza slices, money, or measuring cups. Praise effort, not speed. Keep sessions predictable: same time, same routine.",
  },
  {
    q: "What does 'focus minutes' mean?",
    a: "It counts active learning time in games (movement + answers). Breaks are excluded. For ADHD, short bursts with breaks tend to work better than long sessions.",
  },
  {
    q: "How should I set playtime limits?",
    a: "Start with a daily limit and a session limit. Example: 60 min/day, 25 min/session + 7 min break. Consistency matters more than strictness.",
  },
];

function bubbleBase(isUser) {
  return isUser
    ? "bg-gradient-to-r from-emerald-400/25 via-yellow-300/20 to-purple-400/25 border-white/20"
    : "bg-white/15 dark:bg-white/10 border-white/15";
}

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I’m your EduGalaxy AI helper. Ask me about limits, progress, or weak areas." },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  const suggestions = useMemo(() => canned.map((c) => c.q), []);

  function scrollBottom() {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
  }

  function send(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setTimeout(() => {
      const match = canned.find((c) => c.q.toLowerCase() === trimmed.toLowerCase());
      const reply = match?.a || "I can help. Tell me what you want to improve: time control, weak areas, or motivation routines.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
      scrollBottom();
    }, 450);
    scrollBottom();
  }

  return (
    <div className="panel stroke rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 opacity-85" />
          <div className="font-extrabold">AI Helper</div>
        </div>
        <div className="text-xs opacity-70">Use Case 05 — AI Chat Interaction</div>
      </div>

      <div ref={listRef} className="h-[360px] overflow-auto p-4 space-y-3">
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
              <div className={"max-w-[78%] rounded-2xl px-4 py-3 border " + bubbleBase(isUser)}>
                <div className="text-sm leading-relaxed">{m.text}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/15 bg-white/10 hover:bg-white/20"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            className="flex-1 rounded-xl px-4 py-3 bg-white/10 border border-white/15 outline-none focus:ring-2 focus:ring-emerald-400/30"
            placeholder="Ask a question..."
          />
          <button
            onClick={() => send(input)}
            className="rounded-xl px-4 py-3 font-extrabold bg-gradient-to-r from-emerald-400/40 via-yellow-300/30 to-purple-400/40 border border-white/20 hover:brightness-110"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
