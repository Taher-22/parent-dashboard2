import clsx from "clsx";

export default function Badge({ children, tone = "neutral" }) {
  const map = {
    green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
    orange: "bg-orange-500/15 text-orange-700 dark:text-orange-200",
    purple: "bg-purple-500/15 text-purple-700 dark:text-purple-200",
    blue: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
    neutral: "bg-black/5 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  };

  return (
    <span className={clsx(
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
      map[tone]
    )}>
      {children}
    </span>
  );
}
