import { motion } from "framer-motion";

function tone(colorKey) {
  const map = {
    green: "rgb(var(--green))",
    orange: "rgb(var(--orange))",
    purple: "rgb(var(--purple))",
    blue: "rgb(var(--blue))",
  };
  return map[colorKey] || "rgb(var(--blue))";
}

export default function MasteryBars({ items }) {
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.subject}>
          <div className="flex items-center justify-between text-sm">
            <div className="font-semibold">{it.subject}</div>
            <div className="opacity-80">{it.mastery}%</div>
          </div>
          <div className="mt-2 h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${it.mastery}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${tone(it.colorKey)}, rgba(var(--blob3),0.55))`,
                boxShadow: "0 0 22px rgba(255,255,255,.12)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
