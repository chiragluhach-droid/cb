"use client";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/fx";
import Icon from "@/components/Icon";

const greet = () => {
  const h = new Date().getHours();
  return h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const fmt = (n) => Math.round(n).toLocaleString("en-IN");

function Ring({ value, max, label, color, unit = "" }) {
  const pct = Math.min(1, max ? value / max : 0);
  const C = 2 * Math.PI * 42;
  return (
    <div className="ring">
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--paper-2)" strokeWidth="11" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="11" strokeDasharray={`${C * pct} ${C}`} strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray .6s ease" }} />
        <text x="50" y="57" textAnchor="middle" style={{ fontWeight: 700, fontSize: 20, fill: "var(--ink)" }}>{Math.round(pct * 100)}%</text>
      </svg>
      <div className="ring__k">{label}</div>
      <div className="ring__v mono">{fmt(value)}<span> / {fmt(max)}{unit}</span></div>
    </div>
  );
}

export default function Today({ name, coach, date, day, targets, log: initial, streak, session, prog, note }) {
  const [log, setLog] = useState(initial);
  const [steps, setSteps] = useState(initial.steps || "");
  const [weight, setWeight] = useState(initial.weightKg || "");
  const [toast, toastNode] = useToast();

  const save = async (body) => {
    const r = await fetch("/api/log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date, ...body }) });
    const j = await r.json();
    if (!r.ok) { toast(j.error || "Couldn't save, try again"); return null; }
    setLog(j.log);
    return j.log;
  };

  const dish = (m, i) => {
    const s = log.swaps?.[i] || 0;
    return s && m.swaps?.[s - 1] ? { ...m.swaps[s - 1], slot: m.slot, time: m.time, swapped: true } : m;
  };
  const meals = day.meals.map(dish);
  const eaten = meals.reduce((a, m, i) => (log.meals?.[i] ? { kcal: a.kcal + m.kcal, protein: a.protein + m.protein } : a), { kcal: 0, protein: 0 });
  const doneCount = meals.filter((_, i) => log.meals?.[i]).length;

  const tick = async (i) => {
    const done = !log.meals?.[i];
    setLog((l) => ({ ...l, meals: { ...l.meals, [i]: done } }));
    await save({ action: "meal", idx: i, done });
    if (done && doneCount + 1 === meals.length) toast("All meals done today. Great work!");
  };
  const swap = async (i) => {
    const m = day.meals[i];
    const next = ((log.swaps?.[i] || 0) + 1) % ((m.swaps?.length || 0) + 1);
    setLog((l) => ({ ...l, swaps: { ...l.swaps, [i]: next } }));
    await save({ action: "swap", idx: i, swap: next });
    toast(next ? `Swapped to ${m.swaps[next - 1].name}` : `Back to ${m.name}`);
  };

  const water = log.waterMl || 0;
  const glasses = Math.round(water / 250);
  const maxGlasses = Math.round(targets.water / 250);
  const setWater = async (ml) => {
    ml = Math.max(0, ml);
    setLog((l) => ({ ...l, waterMl: ml }));
    await save({ waterMl: ml });
  };

  return (
    <div className="today">
      {toastNode}
      <div className="ph">
        <div>
          <div className="eyebrow">{new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1 className="display" style={{ marginTop: 4 }}>{greet()}, {name}</h1>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className="chip"><Icon name="flame" size={14} style={{ color: "var(--c-amber)" }} /> {streak} day streak</span>
          <span className="chip" style={{ background: "var(--brand-50)", color: "var(--brand-700)", borderColor: "#bbf7d0" }}>{doneCount}/{meals.length} meals</span>
        </div>
      </div>

      {note && (
        <Link href="/dashboard/inbox" className="card note">
          <span className="note__av">{coach.charAt(0)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{coach} · {note.title}</div>
            <p className="clamp2" style={{ fontSize: 14, marginTop: 2 }}>{note.body}</p>
          </div>
          <Icon name="arrow" size={16} style={{ color: "var(--muted)", flex: "none" }} />
        </Link>
      )}

      <div className="card rings">
        <Ring value={eaten.kcal} max={targets.calories} label="Calories" color="var(--c-amber)" />
        <Ring value={eaten.protein} max={targets.protein} label="Protein" color="var(--c-green)" unit="g" />
        <Ring value={log.steps || 0} max={targets.steps} label="Steps" color="var(--c-blue)" />
      </div>

      <div className="today__grid">
        <section>
          <div className="sec-title">
            <h2>Today&apos;s meals</h2>
            <span>{fmt(eaten.kcal)} / {fmt(targets.calories)} kcal</span>
          </div>
          <div className="card list">
            {meals.map((m, i) => {
              const on = !!log.meals?.[i];
              const canSwap = day.meals[i].swaps?.length > 0;
              return (
                <div key={i} className={`meal ${on ? "done" : ""}`}>
                  <button className="meal__tick" onClick={() => tick(i)} aria-pressed={on} aria-label={on ? `Unmark ${m.name}` : `Mark ${m.name} as eaten`}>
                    <span className={`tick ${on ? "on" : ""}`}><Icon name="check" size={14} stroke={3} /></span>
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="meal__slot">
                      <span><span style={{ textTransform: "capitalize" }}>{m.slot}</span> · {m.time}</span>
                      {m.swapped && <span className="pill lilac" style={{ fontSize: 11, padding: "0 7px" }}>Swapped</span>}
                    </div>
                    <div key={m.name} className="meal__name word-in">{m.name}</div>
                    <div className="meal__items clamp2">{m.items.map((it) => `${it.qty} ${it.food.toLowerCase()}`).join(" · ")}</div>
                    <div className="meal__foot">
                      <span className="mono">{m.kcal} kcal · {m.protein} g protein</span>
                      {canSwap && (
                        <button className="meal__swap" onClick={() => swap(i)}><Icon name="refresh" size={14} /> Swap</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside>
          <div className="sec-title"><h2>Track</h2><span>Saved automatically</span></div>
          <div className="track">
            <div className="card track__water">
              <div className="row between">
                <div className="row" style={{ gap: 8 }}><span className="track__ic" style={{ color: "var(--c-blue)", background: "var(--sky)" }}><Icon name="water" size={16} /></span><b>Water</b></div>
                <span className="mono muted" style={{ fontSize: 13 }}>{(water / 1000).toFixed(2)} / {targets.water / 1000} L</span>
              </div>
              <div className="glasses" aria-hidden>
                {Array.from({ length: maxGlasses }).map((_, k) => <i key={k} className={k < glasses ? "on" : ""} />)}
              </div>
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <button className="btn ghost" style={{ flex: "none", width: 48, padding: 0 }} onClick={() => setWater(water - 250)} disabled={!water} aria-label="Remove a glass">−</button>
                <button className="btn primary" style={{ flex: 1 }} onClick={() => setWater(water + 250)}>+ 1 glass (250 ml)</button>
              </div>
            </div>

            <form className="card track__num" onSubmit={async (e) => { e.preventDefault(); if (await save({ steps })) toast("Steps saved"); }}>
              <div className="row" style={{ gap: 8 }}><span className="track__ic" style={{ color: "var(--c-violet)", background: "var(--lilac)" }}><Icon name="activity" size={16} /></span><b>Steps</b></div>
              <input className="input" type="number" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={String(targets.steps)} aria-label="Steps today" />
              <div className="progress" style={{ height: 6 }}><i style={{ width: `${Math.min(100, ((log.steps || 0) / targets.steps) * 100)}%`, background: "var(--c-blue)" }} /></div>
              <button className="btn ghost sm">Save</button>
            </form>

            <form className="card track__num" onSubmit={async (e) => { e.preventDefault(); if (await save({ weightKg: weight })) toast("Weight logged"); }}>
              <div className="row" style={{ gap: 8 }}><span className="track__ic" style={{ color: "var(--c-amber)", background: "var(--orange)" }}><Icon name="scale" size={16} /></span><b>Weight</b></div>
              <input className="input" type="number" inputMode="decimal" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="kg" aria-label="Morning weight in kg" />
              <p className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>After waking, before eating</p>
              <button className="btn ghost sm">Log</button>
            </form>

            <div className="card track__work">
              <div className="row between">
                <div className="row" style={{ gap: 8 }}><span className="track__ic" style={{ color: "var(--brand-600)", background: "var(--brand-50)" }}><Icon name="dumbbell" size={16} /></span><b style={{ textTransform: "capitalize" }}>{session ? session.focus : "Rest day"}</b></div>
                {session && <span className="pill">Week {prog?.week}</span>}
              </div>
              {session ? (
                <>
                  <div className="list" style={{ marginTop: 10 }}>
                    {session.exercises.map((x) => (
                      <div key={x.name} className="row between" style={{ padding: "8px 0", fontSize: 14 }}>
                        <span>{x.name}</span>
                        <span className="mono muted" style={{ fontSize: 13, whiteSpace: "nowrap" }}>{x.timed ? `${prog?.sets} × ${30 + (prog?.week || 1) * 5}s` : `${prog?.sets} × ${prog?.reps}`}</span>
                      </div>
                    ))}
                  </div>
                  <div className="row" style={{ marginTop: 12, gap: 8 }}>
                    <button className={`btn ${log.workoutDone ? "primary" : "ghost"}`} style={{ flex: 1 }} onClick={() => save({ workoutDone: !log.workoutDone })}>
                      {log.workoutDone ? <><Icon name="check" size={16} stroke={2.5} /> Completed</> : "Mark as done"}
                    </button>
                    <Link href="/dashboard/workout" className="btn ghost" style={{ flex: "none" }}>Details</Link>
                  </div>
                </>
              ) : (
                <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>Recovery is part of the plan. Go for a walk and hit your steps.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
