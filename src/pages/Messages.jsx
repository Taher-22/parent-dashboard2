import { useState } from "react";
import { motion } from "framer-motion";
import { Send, MessageSquare } from "lucide-react";
import { useChildren } from "../state/ChildrenContext.jsx";
import { sendMessage } from "../lib/api.js";
import PageTransition from "../ui/PageTransition.jsx";
import Card from "../ui/Card.jsx";

export default function Messages() {
  const { kids, activeChildId, setActiveChildId } = useChildren();

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const selectedChild = kids.find((k) => k.id === activeChildId) ?? null;

  async function handleSend() {
    if (!message.trim() || !activeChildId || sending) return;
    setSending(true);
    try {
      await sendMessage(activeChildId, message.trim());
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <PageTransition>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
          <p className="opacity-75 mt-1">Send encouragement and support to your child while they play.</p>
        </div>
      </div>

      {/* Child selector */}
      <Card title="Select Child">
        {kids.length === 0 ? (
          <p className="text-sm opacity-60">No children added yet.</p>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {kids.map((kid) => {
              const isActive  = kid.id === activeChildId;
              const initials  = kid.displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
              return (
                <motion.button
                  key={kid.id}
                  onClick={() => setActiveChildId(kid.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`
                    flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border font-semibold text-sm transition-all duration-200
                    ${isActive
                      ? "bg-gradient-to-r from-emerald-500/25 to-purple-500/20 border-emerald-400/40 text-white shadow-lg shadow-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10 opacity-60 hover:opacity-90"
                    }
                  `}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black
                    ${isActive ? "bg-gradient-to-br from-emerald-400 to-purple-500 text-white" : "bg-white/15 text-white/70"}`}>
                    {initials}
                  </div>
                  {kid.displayName}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </motion.button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Message form */}
      {selectedChild && (
        <Card title={`Send Message to ${selectedChild.displayName}`}>
          <div className="space-y-3">
            <textarea
              className="w-full rounded-xl p-3 bg-black/5 dark:bg-white/8 border border-white/10
                         text-sm resize-none outline-none focus:border-emerald-500/50 transition-colors
                         placeholder:opacity-40"
              rows={4}
              placeholder="Type your message here…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <motion.button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 rounded-xl font-bold py-2.5 px-5 text-sm transition-all
                ${sent
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                  : "bg-blue-500 hover:bg-blue-400 text-white disabled:opacity-40"
                }`}
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : sent ? "Sent!" : "Send Message"}
            </motion.button>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card>
        <div className="flex items-center gap-3 opacity-60">
          <MessageSquare className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">
            Messages will appear in the game for your child to see. Use this to encourage them, remind them of breaks, or celebrate their progress!
          </p>
        </div>
      </Card>
    </PageTransition>
  );
}
