import clsx from "clsx";

export default function Badge({ children, tone = "green" }) {
  const map = {
    green: "bg-emerald-500/15 text-emerald-200 dark:text-emerald-100 border-emerald-500/25",
    orange: "bg-orange-500/15 text-orange-200 dark:text-orange-100 border-orange-500/25",
    purple: "bg-purple-500/15 text-purple-200 dark:text-purple-100 border-purple-500/25",
    blue: "bg-sky-500/15 text-sky-200 dark:text-sky-100 border-sky-500/25",
    neutral: "bg-black/5 text-slate-700 border-black/10 dark:bg-white/10 dark:text-slate-200 dark:border-white/10",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border",
        map[tone] || map.neutral
      )}
    >
      {children}
    </span>
  );
}
