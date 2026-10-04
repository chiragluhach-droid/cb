// Simple SVG line chart for weight over time
export default function WeightChart({ series, goal, height = 220 }) {
  if (series.length < 2) return <div className="muted" style={{ padding: 30, textAlign: "center" }}>Log your weight a couple of times to see your chart.</div>;
  const W = 640, H = height, P = 34;
  const ws = series.map((s) => s.w).concat(goal ? [goal] : []);
  const min = Math.floor(Math.min(...ws) - 1), max = Math.ceil(Math.max(...ws) + 1);
  const t0 = new Date(series[0].date).getTime(), t1 = new Date(series.at(-1).date).getTime() || t0 + 1;
  const x = (d) => P + ((new Date(d).getTime() - t0) / Math.max(1, t1 - t0)) * (W - P * 2);
  const y = (w) => P / 2 + ((max - w) / (max - min)) * (H - P * 1.5);
  const pts = series.map((s) => `${x(s.date)},${y(s.w)}`).join(" ");
  const area = `${x(series[0].date)},${H - P} ${pts} ${x(series.at(-1).date)},${H - P}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {[0, 0.5, 1].map((k) => {
        const v = max - (max - min) * k;
        return (<g key={k}><line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="#e2e8f0" /><text x={4} y={y(v) + 4} style={{ font: "11px var(--sans)", fill: "var(--muted)" }}>{v.toFixed(0)}</text></g>);
      })}
      {goal && <><line x1={P} x2={W - P} y1={y(goal)} y2={y(goal)} stroke="var(--c-amber)" strokeWidth="1.5" strokeDasharray="6 5" /><text x={W - P} y={y(goal) - 6} textAnchor="end" style={{ font: "600 11px var(--sans)", fill: "var(--c-amber)" }}>goal {goal}kg</text></>}
      <polygon points={area} fill="var(--brand)" opacity=".08" />
      <polyline points={pts} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1">
        <animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.4s" fill="freeze" />
      </polyline>
      {series.map((s, i) => <circle key={i} cx={x(s.date)} cy={y(s.w)} r={i === series.length - 1 ? 5 : 3} fill={i === series.length - 1 ? "var(--brand)" : "#fff"} stroke="var(--brand)" strokeWidth="2"><title>{s.date}: {s.w} kg</title></circle>)}
      <text x={P} y={H - 8} style={{ font: "11px var(--sans)", fill: "var(--muted)" }}>{series[0].date}</text>
      <text x={W - P} y={H - 8} textAnchor="end" style={{ font: "11px var(--sans)", fill: "var(--muted)" }}>{series.at(-1).date}</text>
    </svg>
  );
}
