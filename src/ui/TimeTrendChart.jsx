import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

export default function TimeTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        
        {/* GRADIENT FILL */}
        <defs>
          <linearGradient id="timeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22e6a7" stopOpacity={0.65} />
            <stop offset="100%" stopColor="#22e6a7" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {/* AXES */}
        <XAxis
          dataKey="day"
          stroke="rgba(255,255,255,0.6)"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.4)"
          tick={{ fontSize: 12 }}
          allowDecimals={false}
        />
        
        {/* TOOLTIP */}
        <Tooltip
          contentStyle={{
            background: "rgba(0,0,0,0.7)",
            border: "none",
            borderRadius: 12,
            color: "#fff",
            fontSize: 12
          }}
          cursor={{ stroke: "rgba(255,255,255,0.2)" }}
        />

        {/* LINE + AREA */}
        <Area
          type="monotone"
          dataKey="minutes"
          stroke="#22e6a7"
          strokeWidth={3}
          fill="url(#timeFill)"
          dot={{ r: 4, fill: "#22e6a7" }}
          activeDot={{ r: 6 }}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
