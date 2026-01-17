import { motion } from "framer-motion";

export default function Card({ title, subtitle, children, right }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="panel stroke rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-main">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs mt-1 text-muted">
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>

      <div className="mt-4 text-secondary">
        {children}
      </div>
    </motion.div>
  );
}
