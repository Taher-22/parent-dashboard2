import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, CheckCheck } from "lucide-react";
import { useChildren } from "../state/ChildrenContext.jsx";
import { sendMessage, getMessages } from "../lib/api.js";
import PageTransition from "../ui/PageTransition.jsx";

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDate(messages) {
  const groups = {};
  [...messages].reverse().forEach((m) => {
    const label = formatDate(m.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(m);
  });
  return groups;
}

export default function Messages() {
  const { kids, activeChild, setActiveChildId, activeChildId } = useChildren();

  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);

  // load history whenever active child changes
  useEffect(() => {
    if (!activeChildId) return;
    setLoadingMsgs(true);
    getMessages(activeChildId)
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, [activeChildId]);

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || !activeChildId || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);

    // optimistic
    const optimistic = {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      _pending: true,
    };
    setMessages((prev) => [optimistic, ...prev]);

    try {
      const saved = await sendMessage(activeChildId, content);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? saved : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(content);
    } finally {
      setSending(false);
    }
  }

  const grouped = groupByDate(messages);
  const selectedChild = kids.find((k) => k.id === activeChildId) ?? activeChild;

  return (
    <PageTransition>
      <div className="flex flex-col gap-5 h-full">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
          <p className="opacity-60 mt-1 text-sm">
            Send encouragement to your child while they play.
          </p>
        </div>

        {/* Child selector — avatar cards */}
        {kids.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {kids.map((kid) => {
              const isActive = kid.id === activeChildId;
              const initials = kid.displayName
                .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

              return (
                <motion.button
                  key={kid.id}
                  onClick={() => setActiveChildId(kid.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-2xl border font-semibold text-sm
                    transition-all duration-200
                    ${isActive
                      ? "bg-gradient-to-r from-emerald-500/25 to-purple-500/20 border-emerald-400/40 text-white shadow-lg shadow-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/8 opacity-60 hover:opacity-90"
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-black
                    ${isActive
                      ? "bg-gradient-to-br from-emerald-400 to-purple-500 text-white"
                      : "bg-white/15 text-white/70"
                    }
                  `}>
                    {initials}
                  </div>
                  {kid.displayName}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {!activeChildId && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 gap-3">
            <MessageSquare className="h-10 w-10" />
            <p className="text-sm">Add a child first to send messages.</p>
          </div>
        )}

        {activeChildId && (
          <div className="flex flex-col gap-3 flex-1">

            {/* Chat window */}
            <div className="panel stroke rounded-2xl flex flex-col overflow-hidden" style={{ minHeight: 340 }}>

              {/* Chat header */}
              <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-purple-500
                                flex items-center justify-center text-xs font-black text-white">
                  {selectedChild?.displayName?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "?"}
                </div>
                <div>
                  <div className="font-semibold text-sm">{selectedChild?.displayName}</div>
                  <div className="text-[11px] opacity-40">Messages appear in-game</div>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
              </div>

              {/* Messages list */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: 340 }}>
                {loadingMsgs && (
                  <div className="flex justify-center py-8 opacity-40 text-sm">Loading messages…</div>
                )}

                {!loadingMsgs && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-35">
                    <MessageSquare className="h-8 w-8" />
                    <p className="text-sm">No messages yet. Say something!</p>
                  </div>
                )}

                {!loadingMsgs && Object.entries(grouped).map(([date, msgs]) => (
                  <div key={date} className="space-y-2">
                    {/* Date label */}
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-white/8" />
                      <span className="text-[10px] font-semibold opacity-35 uppercase tracking-wider">{date}</span>
                      <div className="flex-1 h-px bg-white/8" />
                    </div>

                    {msgs.map((msg) => (
                      <AnimatePresence key={msg.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="flex justify-end"
                        >
                          <div className="max-w-[75%]">
                            <div className={`
                              px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed
                              ${msg._pending
                                ? "bg-emerald-500/20 border border-emerald-500/20 opacity-70"
                                : "bg-gradient-to-br from-emerald-500/30 to-purple-500/20 border border-emerald-500/20"
                              }
                            `}>
                              {msg.content}
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1 px-1">
                              <span className="text-[10px] opacity-35">{formatTime(msg.createdAt)}</span>
                              {!msg._pending && <CheckCheck className="h-3 w-3 opacity-35" />}
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    ))}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input bar */}
            <div className="panel stroke rounded-2xl px-4 py-3 flex items-end gap-3">
              <textarea
                className="flex-1 bg-transparent resize-none outline-none text-sm
                           placeholder:opacity-35 leading-relaxed min-h-[42px] max-h-[120px]"
                placeholder={`Message ${selectedChild?.displayName ?? "child"}…`}
                rows={1}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <motion.button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.93 }}
                className={`
                  flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                  transition-all duration-200
                  ${text.trim() && !sending
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-white/8 text-white/30 cursor-not-allowed"
                  }
                `}
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </div>

            <p className="text-[11px] opacity-30 text-center -mt-1">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
