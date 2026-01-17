import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function TimeTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        {/* =========================
           GRADIENT (THEME AWARE)
        ========================= */}
        <defs>
          <linearGradient id="timeFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="rgb(var(--blob1))"
              stopOpacity={0.55}
            />
            <stop
              offset="100%"
              stopColor="rgb(var(--blob1))"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>

        {/* =========================
           AXES (AUTO THEME)
        ========================= */}
        <XAxis
          dataKey="day"
          stroke="currentColor"
          tick={{ fontSize: 12, fill: "currentColor" }}
        />

        <YAxis
          allowDecimals={false}
          stroke="currentColor"
          tick={{ fontSize: 12, fill: "currentColor" }}
        />

        {/* =========================
           TOOLTIP (THEME AWARE)
        ========================= */}
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.15)" }}
          contentStyle={{
            background: "rgb(var(--panel))",
            border: "none",
            borderRadius: 12,
            boxShadow: "0 12px 30px rgba(0,0,0,.25)",
            color: "rgb(var(--text-main))",
            fontSize: 12,
          }}
          labelStyle={{
            color: "rgb(var(--text-muted))",
            marginBottom: 4,
          }}
          itemStyle={{
            color: "rgb(var(--text-main))",
          }}
        />

        {/* =========================
           AREA + LINE
        ========================= */}
        <Area
          type="monotone"
          dataKey="minutes"
          stroke="rgb(var(--blob1))"
          strokeWidth={3}
          fill="url(#timeFill)"
          dot={{
            r: 4,
            fill: "rgb(var(--blob1))",
          }}
          activeDot={{ r: 6 }}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
