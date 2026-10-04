"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FOODS } from "@/lib/foods";
import { DAYS } from "@/lib/planEngine";

const FOOD_LIST = Object.values(FOODS);
const clone = (x) => JSON.parse(JSON.stringify(x));
const sum = (items) => items.reduce((a, i) => ({ kcal: a.kcal + (+i.kcal || 0), protein: a.protein + (+i.protein || 0) }), { kcal: 0, protein: 0 });
const cell = { padding: "6px 8px", borderRadius: 8, fontSize: 13 };

export default function PlanEditor({ plan }) {
  const router = useRouter();
  const readOnly = plan.status === "archived";
  const [t, setT] = useState(plan.targets || {});
  const [diet, setDiet] = useState(plan.diet || []);
  const [workout, setWorkout] = useState(plan.workout || { sessions: [], progression: [] });
  const [coachNote, setCoachNote] = useState(plan.coachNote || "");
  const [adminNote, setAdminNote] = useState(plan.adminNote || "");
  const [d, setD] = useState(0);
  const [tab, setTab] = useState("diet");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const upDay = (fn) => setDiet((x) => { const n = clone(x); fn(n[d]); return n; });
  const upW = (fn) => setWorkout((x) => { const n = clone(x); fn(n); return n; });

  const pickFood = (mi, ii, name) => upDay((day) => {
    const it = day.meals[mi].items[ii];
    it.food = name;
    const f = FOOD_LIST.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (f && !it.kcal) Object.assign(it, { qty: `${f.per} ${f.unit}`, kcal: f.kcal, protein: f.p, carbs: f.c, fat: f.f });
  });

  const save = async (action) => {
    setBusy(action); setMsg("");
    const r = await fetch(`/api/admin/plans/${plan._id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, targets: t, diet, workout, coachNote, adminNote }) });
    const j = await r.json();
    setBusy("");
    if (!r.ok) return setMsg("⚠ " + j.error);
    setMsg(action === "save_approve" ? "sent to client ✓" : "saved ✓");
    router.refresh();
  };
  const discard = async () => {
    if (!window.confirm("Delete this draft?")) return;
    const r = await fetch(`/api/admin/plans/${plan._id}`, { method: "DELETE" });
    if (r.ok) router.push(location.pathname); else setMsg("⚠ " + (await r.json()).error);
  };

  const day = diet[d];
  const dayTot = day ? day.meals.reduce((a, m) => { const s = sum(m.items); return { kcal: a.kcal + s.kcal, protein: a.protein + s.protein }; }, { kcal: 0, protein: 0 }) : { kcal: 0, protein: 0 };
  const off = t.calories ? (dayTot.kcal - t.calories) / t.calories : 0;
  const statusColor = { active: "var(--lime)", review: "var(--pink)", drafting: "var(--butter)", archived: "var(--paper-2)" }[plan.status];

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="row between wrapflex" style={{ padding: 16, borderBottom: "var(--line)", background: statusColor, gap: 10 }}>
        <div>
          <b className="display" style={{ fontSize: 24 }}>v{plan.version} · {plan.status === "review" ? "waiting for your review" : plan.status === "drafting" ? "hand-written draft" : plan.status}</b>
          <div className="mono" style={{ fontSize: 11 }}>{plan.reason.replace("_", " ")} · source: {plan.source} · created {new Date(plan.createdAt).toLocaleString("en-IN")}{plan.calorieAdjust ? ` · adjust ${plan.calorieAdjust} kcal` : ""}</div>
        </div>
        {!readOnly && (
          <div className="row wrapflex">
            {plan.status !== "active" && <button className="btn sm ghost" onClick={discard}>🗑 discard</button>}
            <button className="btn sm ghost" style={{ border: "var(--line)", background: "#fff" }} disabled={!!busy} onClick={() => save("save")}>{busy === "save" ? "…" : plan.status === "active" ? "save (goes live now)" : "save draft"}</button>
            {plan.status !== "active" && <button className="btn sm" disabled={!!busy} onClick={() => save("save_approve")}>{busy === "save_approve" ? "…" : "✓ approve & send"}</button>}
          </div>
        )}
      </div>
      {msg && <div className={msg.startsWith("⚠") ? "err" : "ok"} style={{ margin: 12 }}>{msg}</div>}

      <div style={{ padding: 16 }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
          {[["calories", "kcal"], ["protein", "g"], ["carbs", "g"], ["fat", "g"], ["water", "ml"], ["steps", ""]].map(([k, u]) => (
            <div key={k}><label className="label" style={{ fontSize: 10 }}>{k} {u && `(${u})`}</label><input className="input" style={cell} type="number" value={t[k] ?? ""} disabled={readOnly} onChange={(e) => setT({ ...t, [k]: e.target.value })} /></div>
          ))}
        </div>
        <label className="label" style={{ marginTop: 14 }}>note to client (shown on their plan, sign it as you)</label>
        <textarea className="textarea" rows={4} value={coachNote} disabled={readOnly} onChange={(e) => setCoachNote(e.target.value)} style={{ fontFamily: "var(--serif)", fontSize: 18 }} />
        <label className="label" style={{ marginTop: 10 }}>private admin note</label>
        <input className="input" style={cell} value={adminNote} disabled={readOnly} onChange={(e) => setAdminNote(e.target.value)} placeholder="only you see this" />

        <div className="toggle" style={{ marginTop: 18 }}>
          <button className={tab === "diet" ? "on" : ""} onClick={() => setTab("diet")}>🍛 diet</button>
          <button className={tab === "workout" ? "on" : ""} onClick={() => setTab("workout")}>🏋️ workout</button>
        </div>

        {tab === "diet" && day && (
          <div style={{ marginTop: 14 }}>
            <div className="row wrapflex" style={{ gap: 6 }}>
              {diet.map((x, k) => <button key={x.day} className={`btn sm ${k === d ? "" : "ghost"}`} style={{ border: "var(--line)", padding: "6px 12px" }} onClick={() => setD(k)}>{x.day}</button>)}
              <span className="pill" style={{ background: Math.abs(off) < 0.07 ? "var(--lime)" : "var(--orange)", marginLeft: 8 }}>{Math.round(dayTot.kcal)} / {t.calories} kcal · {Math.round(dayTot.protein)} / {t.protein}g P</span>
              {!readOnly && <button className="btn sm ghost" onClick={() => window.confirm(`Copy ${day.day} to every day?`) && setDiet((x) => x.map((dd) => ({ ...clone(day), day: dd.day })))}>⧉ copy {day.day} to all days</button>}
            </div>

            <datalist id="foods">{FOOD_LIST.map((f) => <option key={f.name} value={f.name} />)}</datalist>
            <div className="stack" style={{ marginTop: 12 }}>
              {day.meals.map((m, mi) => {
                const s = sum(m.items);
                return (
                  <div key={mi} className="card" style={{ padding: 12, boxShadow: "none", background: "#fff" }}>
                    <div className="row wrapflex" style={{ gap: 6 }}>
                      <input className="input" style={{ ...cell, width: 130 }} value={m.slot} disabled={readOnly} onChange={(e) => upDay((dd) => (dd.meals[mi].slot = e.target.value))} />
                      <input className="input" style={{ ...cell, width: 90 }} value={m.time} disabled={readOnly} onChange={(e) => upDay((dd) => (dd.meals[mi].time = e.target.value))} />
                      <input className="input" style={{ ...cell, flex: 1, minWidth: 180, fontWeight: 700 }} placeholder="dish name" value={m.name} disabled={readOnly} onChange={(e) => upDay((dd) => (dd.meals[mi].name = e.target.value))} />
                      <span className="mono" style={{ fontSize: 12 }}>{Math.round(s.kcal)} kcal · {Math.round(s.protein)}g</span>
                      {!readOnly && <button className="btn sm ghost" title="remove meal" onClick={() => upDay((dd) => dd.meals.splice(mi, 1))}>✕</button>}
                    </div>
                    <div className="tablewrap">
                      <table className="table" style={{ marginTop: 6 }}>
                        <thead><tr><th>food</th><th>qty</th><th>kcal</th><th>P</th><th>C</th><th>F</th><th></th></tr></thead>
                        <tbody>
                          {m.items.map((it, ii) => (
                            <tr key={ii}>
                              <td><input list="foods" className="input" style={{ ...cell, minWidth: 160 }} value={it.food} disabled={readOnly} onChange={(e) => pickFood(mi, ii, e.target.value)} /></td>
                              <td><input className="input" style={{ ...cell, width: 100 }} value={it.qty} disabled={readOnly} onChange={(e) => upDay((dd) => (dd.meals[mi].items[ii].qty = e.target.value))} /></td>
                              {["kcal", "protein", "carbs", "fat"].map((k) => (
                                <td key={k}><input className="input" type="number" style={{ ...cell, width: 70 }} value={it[k]} disabled={readOnly} onChange={(e) => upDay((dd) => (dd.meals[mi].items[ii][k] = e.target.value))} /></td>
                              ))}
                              <td>{!readOnly && <button className="btn sm ghost" style={{ padding: "4px 8px" }} onClick={() => upDay((dd) => dd.meals[mi].items.splice(ii, 1))}>✕</button>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!readOnly && <button className="mono" style={{ background: "none", border: 0, textDecoration: "underline", cursor: "pointer", fontSize: 12, marginTop: 6 }} onClick={() => upDay((dd) => dd.meals[mi].items.push({ food: "", qty: "", kcal: 0, protein: 0, carbs: 0, fat: 0 }))}>+ add item</button>}
                    {m.swaps?.length > 0 && (
                      <div className="row wrapflex" style={{ gap: 6, marginTop: 8 }}>
                        <span className="mono muted" style={{ fontSize: 11 }}>swaps:</span>
                        {m.swaps.map((sw, si) => (
                          <span key={si} className="pill gray" title={sw.items.map((i) => `${i.qty} ${i.food}`).join(", ")}>
                            {sw.name} · {sw.kcal}kcal {!readOnly && <button style={{ border: 0, background: "none", cursor: "pointer" }} onClick={() => upDay((dd) => dd.meals[mi].swaps.splice(si, 1))}>✕</button>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {!readOnly && <button className="btn sm ghost" style={{ border: "2px dashed var(--ink)", boxShadow: "none" }} onClick={() => upDay((dd) => dd.meals.push({ slot: "Snack", time: "", name: "", items: [{ food: "", qty: "", kcal: 0, protein: 0, carbs: 0, fat: 0 }], swaps: [] }))}>+ add meal</button>}
            </div>
          </div>
        )}

        {tab === "workout" && (
          <div style={{ marginTop: 14 }} className="stack">
            <div className="tablewrap">
              <table className="table">
                <thead><tr><th>week</th><th>sets</th><th>reps</th><th>coach cue</th></tr></thead>
                <tbody>
                  {(workout.progression || []).map((p, k) => (
                    <tr key={k}>
                      <td className="mono">wk {p.week}</td>
                      <td><input className="input" type="number" style={{ ...cell, width: 70 }} value={p.sets} disabled={readOnly} onChange={(e) => upW((w) => (w.progression[k].sets = +e.target.value))} /></td>
                      <td><input className="input" style={{ ...cell, width: 80 }} value={p.reps} disabled={readOnly} onChange={(e) => upW((w) => (w.progression[k].reps = e.target.value))} /></td>
                      <td><input className="input" style={cell} value={p.note} disabled={readOnly} onChange={(e) => upW((w) => (w.progression[k].note = e.target.value))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(workout.sessions || []).map((s, si) => (
              <div key={si} className="card" style={{ padding: 12, boxShadow: "none" }}>
                <div className="row wrapflex" style={{ gap: 6 }}>
                  <select className="select" style={{ ...cell, width: 90 }} value={s.day} disabled={readOnly} onChange={(e) => upW((w) => (w.sessions[si].day = e.target.value))}>{DAYS.map((x) => <option key={x}>{x}</option>)}</select>
                  <input className="input" style={{ ...cell, flex: 1, fontWeight: 700 }} value={s.focus} disabled={readOnly} onChange={(e) => upW((w) => (w.sessions[si].focus = e.target.value))} />
                  {!readOnly && <button className="btn sm ghost" onClick={() => upW((w) => w.sessions.splice(si, 1))}>✕ day</button>}
                </div>
                {s.exercises.map((x, xi) => (
                  <div key={xi} className="row" style={{ gap: 6, marginTop: 6 }}>
                    <input className="input" style={{ ...cell, flex: 1 }} value={x.name} disabled={readOnly} onChange={(e) => upW((w) => (w.sessions[si].exercises[xi].name = e.target.value))} />
                    <input className="input" style={{ ...cell, width: 70 }} value={x.rest} disabled={readOnly} onChange={(e) => upW((w) => (w.sessions[si].exercises[xi].rest = e.target.value))} />
                    <label className="mono" style={{ fontSize: 11, whiteSpace: "nowrap" }}><input type="checkbox" checked={!!x.timed} disabled={readOnly} onChange={(e) => upW((w) => (w.sessions[si].exercises[xi].timed = e.target.checked))} /> timed</label>
                    {!readOnly && <button className="btn sm ghost" style={{ padding: "4px 8px" }} onClick={() => upW((w) => w.sessions[si].exercises.splice(xi, 1))}>✕</button>}
                  </div>
                ))}
                {!readOnly && <button className="mono" style={{ background: "none", border: 0, textDecoration: "underline", cursor: "pointer", fontSize: 12, marginTop: 6 }} onClick={() => upW((w) => w.sessions[si].exercises.push({ name: "", rest: "60s", timed: false }))}>+ exercise</button>}
              </div>
            ))}
            {!readOnly && <button className="btn sm ghost" style={{ border: "2px dashed var(--ink)", boxShadow: "none" }} onClick={() => upW((w) => w.sessions.push({ day: "Sat", focus: "Full body", exercises: [] }))}>+ add training day</button>}
          </div>
        )}
      </div>
    </div>
  );
}
