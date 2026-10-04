"use client";
import { useState } from "react";
import Icon from "@/components/Icon";

const STAGE = { fat_loss: "Fat loss", recomp: "Tone up", maintain: "Maintain", build: "Build muscle", muscle_gain: "Build muscle" };

export default function PlanView({ plan, today, coach, stage }) {
  const [d, setD] = useState(today);
  const [open, setOpen] = useState(null);
  const t = plan.targets;
  const day = plan.diet[d];
  const tot = day.meals.reduce((a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein }), { kcal: 0, protein: 0 });

  return (
    <div className="dpage">
      <div className="ph">
        <div>
          <h1 className="display">Your plan</h1>
          <p>{STAGE[stage] || STAGE.fat_loss} phase · v{plan.version} · since {new Date(plan.activatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
        </div>
      </div>

      {plan.coachNote && (
        <div className="card note" style={{ alignItems: "flex-start" }}>
          <span className="note__av">{coach.charAt(0)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Note from {coach}</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line", marginTop: 2 }}>{plan.coachNote}</p>
          </div>
        </div>
      )}

      <div className="card kv" style={{ marginTop: 16 }}>
        {[["Calories", t.calories, "kcal"], ["Protein", t.protein, "g"], ["Carbs", t.carbs, "g"], ["Fat", t.fat, "g"]].map(([k, v, u]) => (
          <div key={k}><b>{v.toLocaleString("en-IN")}<small style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}> {u}</small></b><span>{k} per day</span></div>
        ))}
      </div>
      <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Daily: {t.water / 1000} L water · {t.steps.toLocaleString("en-IN")} steps</div>

      <div className="sec-title"><h2>Meals by day</h2><span>{tot.kcal} kcal · {tot.protein} g protein</span></div>
      <div className="scroller" role="tablist">
        {plan.diet.map((x, k) => (
          <button key={x.day} role="tab" aria-selected={k === d} onClick={() => setD(k)} className={`daypill ${k === d ? "on" : ""}`}>
            {x.day}{k === today && <span className="dot" aria-label="today" />}
          </button>
        ))}
      </div>

      <div className="stack" style={{ marginTop: 12 }} key={d}>
        {day.meals.map((m, i) => (
          <div key={i} className="card word-in" style={{ overflow: "hidden" }}>
            <div className="row between" style={{ padding: "14px 16px 10px", alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}><span style={{ textTransform: "capitalize" }}>{m.slot}</span> · {m.time}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{m.name}</div>
              </div>
              <div className="mono" style={{ textAlign: "right", fontSize: 13, whiteSpace: "nowrap" }}><b>{m.kcal} kcal</b><div className="muted">{m.protein} g protein</div></div>
            </div>
            <div className="list" style={{ borderTop: "var(--line)" }}>
              {m.items.map((it, k) => (
                <div key={k} className="row-item">
                  <span style={{ minWidth: 0 }}>{it.food} <span className="muted">· {it.qty}</span></span>
                  <span className="mono muted" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{it.kcal} kcal</span>
                </div>
              ))}
            </div>
            {m.swaps?.length > 0 && (
              <div style={{ borderTop: "var(--line)", background: "var(--paper)" }}>
                <button onClick={() => setOpen(open === i ? null : i)} className="row-item" style={{ width: "100%", background: "none", border: 0, cursor: "pointer", fontWeight: 500, color: "var(--brand-700)" }} aria-expanded={open === i}>
                  <span className="row" style={{ gap: 6 }}><Icon name="refresh" size={15} /> {m.swaps.length} swap option{m.swaps.length > 1 ? "s" : ""}</span>
                  <Icon name="chevron" size={16} style={{ transform: open === i ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
                </button>
                {open === i && (
                  <div className="grid g2" style={{ padding: "0 12px 12px", gap: 8 }}>
                    {m.swaps.map((s) => (
                      <div key={s.name} className="card" style={{ padding: 12, boxShadow: "none" }}>
                        <b style={{ fontSize: 14 }}>{s.name}</b>
                        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{s.items.map((it) => `${it.qty} ${it.food.toLowerCase()}`).join(" · ")}</div>
                        <div className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>{s.kcal} kcal · {s.protein} g protein</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
