import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import { masteryBySubject, weakAreas, recentSessions, weeklyMinutes } from "../data/mock.js";
import { Download, Printer } from "lucide-react";

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const report = {
    generatedAt: new Date().toISOString(),
    masteryBySubject,
    weakAreas,
    recentSessions,
    weeklyMinutes,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-3xl font-extrabold tracking-tight">Reports</div>
          <div className="opacity-75 mt-1">
            Parent summary report for printing and exporting (Use Case 03 — Parent views dashboard analytics).
          </div>
        </div>
        <div className="hidden md:flex gap-2">
          <Badge tone="blue">Printable</Badge>
          <Badge tone="purple">Exportable</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <Card
          title="Quick Actions"
          subtitle="Print or export the report"
          right={
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="rounded-xl px-4 py-2 border border-white/15 bg-white/10 hover:bg-white/20 font-semibold flex items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button
                onClick={() => downloadJson("edugalaxy-report.json", report)}
                className="rounded-xl px-4 py-2 border border-white/15 bg-white/10 hover:bg-white/20 font-semibold flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Export JSON
              </button>
            </div>
          }
        >
          <div className="text-sm opacity-80">
            Printing is optimized with minimal UI. Export includes mastery, weak areas, sessions, and weekly minutes.
          </div>
        </Card>

        <Card title="Weak Areas Summary" subtitle="Actionable next steps">
          <ul className="space-y-2 text-sm">
            {weakAreas.map((w) => (
              <li key={w.subject} className="rounded-xl px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/10">
                <div className="font-semibold">{w.subject}</div>
                <div className="opacity-80">{w.note}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <Card title="Subject Mastery" subtitle="Snapshot">
          <div className="space-y-2 text-sm">
            {masteryBySubject.map((m) => (
              <div key={m.subject} className="flex items-center justify-between rounded-xl px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/10">
                <div className="font-semibold">{m.subject}</div>
                <div className="font-extrabold">{m.mastery}%</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Sessions" subtitle="Last activities recorded">
          <div className="space-y-2 text-sm">
            {recentSessions.map((s) => (
              <div key={s.id} className="rounded-xl px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{s.game}</div>
                  <div className="opacity-70 text-xs">{s.time}</div>
                </div>
                <div className="opacity-80">{s.outcome}</div>
                <div className="opacity-70 text-xs mt-1">Duration: {s.duration} min</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
