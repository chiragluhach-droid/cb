"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

const LINES = ["Reviewing your profile…", "Calculating your calorie and protein targets…", "Matching meals to your preferences…", "Checking protein for every meal…", "Planning your workouts…"];
const STEPS = ["Profile received", "Plan drafted", "Coach review", "Ready for you"];

const TODO = [
  ["/dashboard/progress", "camera", "Take “before” photos", "Private to you and your coach."],
  ["/dashboard/progress", "ruler", "Log your measurements", "Waist, hips and arms. The tape shows what the scale misses."],
  ["/dashboard/inbox", "message", "Check your coach inbox", "Your plan and messages arrive here."],
];

export default function Waiting({ name, coach }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 2400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="dpage" style={{ maxWidth: 720 }}>
      <span className="chip" style={{ color: "#854d0e", background: "var(--butter)", borderColor: "#fde68a" }}><span className="blink">●</span>&nbsp;In progress</span>
      <h1 className="display" style={{ fontSize: 24, marginTop: 12 }}>Hi {name}, your plan is being prepared</h1>
      <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>Usually ready within a few hours, 24 at most. We&apos;ll notify you in your inbox.</p>

      <div className="card" style={{ marginTop: 18, padding: 16 }}>
        <div className="row" style={{ gap: 12 }}>
          <span className="note__av" style={{ width: 40, height: 40 }}>{coach.charAt(0)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{coach} is reviewing your plan</div>
            <div key={i} className="word-in" style={{ fontWeight: 600, fontSize: 15 }}>{LINES[i]}</div>
          </div>
        </div>
        <ol className="wsteps">
          {STEPS.map((s, k) => (
            <li key={s} className={k < 2 ? "done" : k === 2 ? "now" : ""}>
              <span>{k < 2 ? <Icon name="check" size={12} stroke={3} /> : k + 1}</span>{s}
            </li>
          ))}
        </ol>
      </div>

      <div className="sec-title"><h2>While you wait</h2></div>
      <div className="card list">
        {TODO.map(([href, icon, t, d]) => (
          <Link key={t} href={href} className="row" style={{ padding: "14px 16px", gap: 12 }}>
            <span className="track__ic" style={{ width: 36, height: 36, background: "var(--paper-2)", color: "var(--ink-2)" }}><Icon name={icon} size={18} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{t}</div>
              <div className="muted" style={{ fontSize: 13 }}>{d}</div>
            </div>
            <Icon name="chevron" size={18} style={{ color: "var(--border-2)", flex: "none" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
