"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";

export const fmtDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export function WeightChart({ points }: { points: { date: string; kg: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const gid = `wfill-${useId().replace(/:/g, "")}`;
  if (points.length < 2) {
    return <div className="flex h-48 items-center justify-center rounded-2xl bg-[#F7F8F5] text-sm text-stone">Log your weight on a few days to see the trend.</div>;
  }
  const W = 600;
  const H = 200;
  const pad = 14;
  const kgs = points.map((p) => p.kg);
  const min = Math.min(...kgs) - 0.5;
  const max = Math.max(...kgs) + 0.5;
  const xy = points.map((p, i) => [pad + (i / (points.length - 1)) * (W - pad * 2), pad + (1 - (p.kg - min) / (max - min)) * (H - pad * 2)] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${xy[xy.length - 1][0]} ${H} L${xy[0][0]} ${H} Z`;
  const h = hover ?? points.length - 1;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-52 w-full overflow-visible" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#16A34A" stopOpacity="0.18" />
            <stop offset="1" stopColor="#16A34A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={W - pad} y1={pad + f * (H - pad * 2)} y2={pad + f * (H - pad * 2)} stroke="#0A0A0A" strokeOpacity="0.05" />
        ))}
        <path d={area} fill={`url(#${gid})`} />
        <motion.path d={line} fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
        {xy.map(([x, y], i) => (
          <g key={i}>
            <rect x={x - (W / points.length) / 2} y={0} width={W / points.length} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
            <circle cx={x} cy={y} r={i === h ? 6 : 3.5} fill={i === h ? "#16A34A" : "#fff"} stroke="#16A34A" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-stone">
        <span>{fmtDay(points[0].date)}</span>
        <span className="rounded-full bg-forest px-2.5 py-1 font-semibold tabular-nums text-canvas">
          {fmtDay(points[h].date)} · {points[h].kg.toFixed(1)} kg
        </span>
        <span>{fmtDay(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
