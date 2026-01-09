import { motion } from "framer-motion";

export default function Card({ title, subtitle, children, right }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="
        relative overflow-hidden rounded-2xl p-5
        backdrop-blur-2xl
        bg-white/45 dark:bg-black/45
        text-slate-900 dark:text-white
        shadow-[0_20px_60px_rgba(0,0,0,0.25)]
        dark:shadow-[0_30px_80px_rgba(0,0,0,0.6)]
      "
    >
      {/* animated gradient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="
          absolute -top-24 -right-24 h-64 w-64 rounded-full
          bg-gradient-to-br from-green-400 via-orange-400 to-purple-400
          blur-3xl animate-pulse
        " />
      </div>

      {/* content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold tracking-tight">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs mt-1 opacity-80">
                {subtitle}
              </div>
            )}
          </div>
          {right}
        </div>

        <div className="mt-4">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
