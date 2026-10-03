"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { burst } from "@/components/fx";

const LIKES = ["paneer", "rajma", "chole", "dal", "poha", "idli", "dosa", "chilla", "curd", "eggs", "chicken", "fish", "oats", "khichdi", "sprouts", "peanut butter", "banana", "makhana", "tofu", "quinoa"];
const DISLIKES = ["karela", "lauki", "baingan", "mushroom", "oats", "curd", "eggs", "soya", "tofu", "fish", "quinoa", "sprouts", "upma", "poha"];

const Opt = ({ on, onClick, emoji, title, sub, color = "var(--lime)" }) => (
  <button type="button" onClick={(e) => { onClick(); if (!on) burst(e.clientX, e.clientY, [emoji]); }} className="card" data-cursor="pick"
    style={{ textAlign: "left", padding: 18, cursor: "pointer", background: on ? color : "#fffdf7", transform: on ? "rotate(-1.5deg) translate(-2px,-2px)" : "", boxShadow: on ? "var(--shadow-lg)" : "var(--shadow)", transition: "all .2s cubic-bezier(.3,1.6,.6,1)" }}>
    <div style={{ fontSize: 34 }}>{emoji}</div>
    <div className="display" style={{ fontSize: 22, marginTop: 8 }}>{title}</div>
    {sub && <div className="muted" style={{ fontSize: 14, marginTop: 4, color: on ? "var(--ink)" : undefined }}>{sub}</div>}
  </button>
);

const Tag = ({ on, onClick, children, color = "var(--lime)" }) => (
  <button type="button" onClick={onClick} className="pill" style={{ fontSize: 14, padding: "8px 14px", cursor: "pointer", background: on ? color : "#fffdf7", transform: on ? "rotate(-3deg)" : "", transition: "transform .2s" }}>
    {on ? "✓ " : "+ "}{children}
  </button>
);

export default function Start() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [custom, setCustom] = useState({ like: "", dislike: "" });
  const [d, setD] = useState({
    goal: "", sex: "", age: "", heightCm: "", weightKg: "", targetWeightKg: "", activity: "", diet: "",
    conditions: [], likes: [], dislikes: [], mealsPerDay: 4, workoutPlace: "", experience: "beginner", daysPerWeek: 4, afterGoal: "maintain", notes: "", city: "", phone: "",
  });
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const toggle = (k, v) => setD((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k].filter((y) => y !== "none"), v] }));

  const bmi = d.heightCm && d.weightKg ? (d.weightKg / Math.pow(d.heightCm / 100, 2)).toFixed(1) : null;

  const steps = [
    {
      q: <>what&apos;s the <span className="serif">main</span> goal?</>,
      ok: !!d.goal,
      body: (
        <div className="grid g2">
          <Opt on={d.goal === "fat_loss"} onClick={() => set("goal", "fat_loss")} emoji="🔥" title="lose fat" sub="drop kgs, keep energy" />
          <Opt on={d.goal === "recomp"} onClick={() => set("goal", "recomp")} emoji="✨" title="tone up" sub="lose a bit, look sharper" color="var(--pink)" />
          <Opt on={d.goal === "muscle_gain"} onClick={() => set("goal", "muscle_gain")} emoji="💪" title="build muscle" sub="gain size + strength" color="var(--sky)" />
          <Opt on={d.goal === "maintain"} onClick={() => set("goal", "maintain")} emoji="🧘" title="eat better" sub="same weight, healthier" color="var(--butter)" />
        </div>
      ),
    },
    {
      q: <>a bit <span className="serif">about</span> you</>,
      ok: d.sex && +d.age > 13,
      body: (
        <div className="stack">
          <div className="grid g2">
            <Opt on={d.sex === "female"} onClick={() => set("sex", "female")} emoji="👩" title="woman" color="var(--pink)" />
            <Opt on={d.sex === "male"} onClick={() => set("sex", "male")} emoji="👨" title="man" color="var(--sky)" />
          </div>
          <div style={{ marginTop: 20 }}><label className="label">age</label><input className="input" type="number" value={d.age} onChange={(e) => set("age", e.target.value)} placeholder="27" style={{ fontSize: 28, fontFamily: "var(--display)" }} /></div>
        </div>
      ),
    },
    {
      q: <>the <span className="serif">numbers</span></>,
      ok: +d.heightCm > 100 && +d.weightKg > 25,
      body: (
        <div className="stack">
          <div className="grid g3">
            {[["heightCm", "height (cm)", "160"], ["weightKg", "weight now (kg)", "72"], ["targetWeightKg", "goal weight (kg)", "62"]].map(([k, l, ph]) => (
              <div key={k}><label className="label">{l}</label><input className="input" type="number" step="0.1" value={d[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} style={{ fontSize: 28, fontFamily: "var(--display)" }} /></div>
            ))}
          </div>
          {bmi && (
            <div className="card" style={{ padding: 16, marginTop: 18, background: "var(--butter)" }}>
              <span className="mono">BMI {bmi}</span> · {bmi < 18.5 ? "we'll focus on healthy gains 🌱" : bmi < 25 ? "solid base, let's sharpen it ✨" : bmi < 30 ? "very doable, we've got you 🔥" : "one step at a time, no crash diets 💚"}
              {d.targetWeightKg && d.weightKg && d.weightKg - d.targetWeightKg > 0 && (
                <div className="mono muted" style={{ fontSize: 12, marginTop: 6 }}>~{Math.ceil((d.weightKg - d.targetWeightKg) / 0.6)} weeks at a sustainable pace</div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      q: <>how <span className="serif">active</span> is a normal day?</>,
      ok: !!d.activity,
      body: (
        <div className="grid g2">
          <Opt on={d.activity === "sedentary"} onClick={() => set("activity", "sedentary")} emoji="🛋️" title="mostly sitting" sub="desk job, < 4k steps" />
          <Opt on={d.activity === "light"} onClick={() => set("activity", "light")} emoji="🚶" title="lightly active" sub="some walking, 4–7k steps" />
          <Opt on={d.activity === "moderate"} onClick={() => set("activity", "moderate")} emoji="🏃" title="pretty active" sub="on my feet / workout 3–4×" />
          <Opt on={d.activity === "active"} onClick={() => set("activity", "active")} emoji="⚡" title="very active" sub="physical job / daily training" />
        </div>
      ),
    },
    {
      q: <>what do you <span className="serif">eat?</span></>,
      ok: !!d.diet,
      body: (
        <div className="grid g3">
          {[["veg", "🌱", "vegetarian"], ["egg", "🥚", "veg + eggs"], ["nonveg", "🍗", "non-veg"], ["vegan", "🥥", "vegan"], ["jain", "🙏", "jain"]].map(([v, e, t]) => (
            <Opt key={v} on={d.diet === v} onClick={() => set("diet", v)} emoji={e} title={t} />
          ))}
        </div>
      ),
    },
    {
      q: <>any <span className="serif">health</span> stuff?</>,
      ok: d.conditions.length > 0,
      sub: "Pick all that apply. Your coach builds around these.",
      body: (
        <div className="grid g3">
          {[["pcos", "🌸", "PCOS / PCOD"], ["thyroid", "🦋", "thyroid"], ["diabetes", "🩸", "diabetes / pre"], ["bp", "❤️", "high BP"], ["lactose", "🥛", "lactose intolerant"], ["none", "✌️", "nope, all good"]].map(([v, e, t]) => (
            <Opt key={v} on={d.conditions.includes(v)} onClick={() => (v === "none" ? set("conditions", ["none"]) : toggle("conditions", v))} emoji={e} title={t} color="var(--pink)" />
          ))}
        </div>
      ),
    },
    {
      q: <>foods you <span className="serif">love</span> 😍</>,
      ok: true,
      sub: "We'll put more of these in your plan.",
      body: (
        <div>
          <div className="row wrapflex">{LIKES.map((x) => <Tag key={x} on={d.likes.includes(x)} onClick={() => toggle("likes", x)}>{x}</Tag>)}
            {d.likes.filter((x) => !LIKES.includes(x)).map((x) => <Tag key={x} on onClick={() => toggle("likes", x)}>{x}</Tag>)}
          </div>
          <form className="row" style={{ marginTop: 18 }} onSubmit={(e) => { e.preventDefault(); if (custom.like.trim()) { toggle("likes", custom.like.trim().toLowerCase()); setCustom({ ...custom, like: "" }); } }}>
            <input className="input" placeholder="add your own…" value={custom.like} onChange={(e) => setCustom({ ...custom, like: e.target.value })} />
            <button className="btn sm">add</button>
          </form>
        </div>
      ),
    },
    {
      q: <>foods you <span className="serif">hate</span> 🤢</>,
      ok: true,
      sub: "These never show up. Pinky promise.",
      body: (
        <div>
          <div className="row wrapflex">{DISLIKES.map((x) => <Tag key={x} color="var(--orange)" on={d.dislikes.includes(x)} onClick={() => toggle("dislikes", x)}>{x}</Tag>)}
            {d.dislikes.filter((x) => !DISLIKES.includes(x)).map((x) => <Tag key={x} color="var(--orange)" on onClick={() => toggle("dislikes", x)}>{x}</Tag>)}
          </div>
          <form className="row" style={{ marginTop: 18 }} onSubmit={(e) => { e.preventDefault(); if (custom.dislike.trim()) { toggle("dislikes", custom.dislike.trim().toLowerCase()); setCustom({ ...custom, dislike: "" }); } }}>
            <input className="input" placeholder="add your own…" value={custom.dislike} onChange={(e) => setCustom({ ...custom, dislike: e.target.value })} />
            <button className="btn sm">add</button>
          </form>
        </div>
      ),
    },
    {
      q: <>training <span className="serif">vibes</span></>,
      ok: !!d.workoutPlace,
      body: (
        <div className="stack">
          <div className="grid g2">
            <Opt on={d.workoutPlace === "home"} onClick={() => set("workoutPlace", "home")} emoji="🏠" title="at home" sub="mat + maybe dumbbells" />
            <Opt on={d.workoutPlace === "gym"} onClick={() => set("workoutPlace", "gym")} emoji="🏋️" title="at the gym" sub="full equipment" color="var(--sky)" />
          </div>
          <div className="grid g3" style={{ marginTop: 20 }}>
            <div><label className="label">experience</label>
              <select className="select" value={d.experience} onChange={(e) => set("experience", e.target.value)}><option value="beginner">beginner</option><option value="intermediate">intermediate</option><option value="advanced">advanced</option></select></div>
            <div><label className="label">days / week</label>
              <select className="select" value={d.daysPerWeek} onChange={(e) => set("daysPerWeek", +e.target.value)}>{[3, 4, 5].map((n) => <option key={n} value={n}>{n} days</option>)}</select></div>
            <div><label className="label">meals / day</label>
              <select className="select" value={d.mealsPerDay} onChange={(e) => set("mealsPerDay", +e.target.value)}>{[3, 4, 5].map((n) => <option key={n} value={n}>{n} meals</option>)}</select></div>
          </div>
          {d.goal === "fat_loss" && (
            <div style={{ marginTop: 16 }}><label className="label">once you hit your goal weight…</label>
              <div className="row wrapflex">
                <Tag on={d.afterGoal === "maintain"} onClick={() => set("afterGoal", "maintain")}>maintain it</Tag>
                <Tag on={d.afterGoal === "build"} onClick={() => set("afterGoal", "build")}>build muscle</Tag>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      q: <>anything <span className="serif">else</span> your coach should know?</>,
      ok: true,
      sub: "Night shifts, a wedding in 3 months, knee pain, fasting days: tell us anything.",
      body: (
        <div className="stack">
          <textarea className="textarea" rows={4} value={d.notes} onChange={(e) => set("notes", e.target.value)} placeholder="I skip breakfast on weekdays, and I fast on Tuesdays…" />
          <div className="grid g2">
            <div><label className="label">city</label><input className="input" value={d.city} onChange={(e) => set("city", e.target.value)} placeholder="Mumbai" /></div>
            <div><label className="label">whatsapp (optional)</label><input className="input" value={d.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91…" /></div>
          </div>
        </div>
      ),
    },
  ];

  const step = steps[i];
  const last = i === steps.length - 1;

  const next = async (e) => {
    if (!step.ok) return;
    if (!last) { setI(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(d) });
    const j = await r.json();
    if (!r.ok) { setBusy(false); return setErr(j.error); }
    burst(e?.clientX || innerWidth / 2, e?.clientY || innerHeight / 2);
    setTimeout(() => router.push(j.next), 900);
  };

  useEffect(() => {
    const k = (e) => { if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "INPUT") next(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const colors = ["var(--butter)", "var(--paper)", "var(--sky)", "var(--paper)", "var(--lime)", "var(--paper)", "var(--pink)", "var(--paper)", "var(--lilac)", "var(--paper)"];

  return (
    <div style={{ minHeight: "100vh", background: colors[i], transition: "background .5s" }}>
      <div className="wrap" style={{ maxWidth: 860, padding: "26px 0 120px" }}>
        <div className="row between">
          <Logo />
          <span className="mono">{String(i + 1).padStart(2, "0")} / {steps.length}</span>
        </div>
        <div className="progress" style={{ marginTop: 18 }}><i style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>
        <div key={i} className="word-in" style={{ marginTop: 50 }}>
          <h1 className="display" style={{ fontSize: "clamp(40px, 7vw, 82px)" }}>{step.q}</h1>
          {step.sub && <p style={{ fontSize: 18, marginTop: 10 }}>{step.sub}</p>}
          <div style={{ marginTop: 34 }}>{step.body}</div>
        </div>
        {err && <div className="err" style={{ marginTop: 20 }}>{err}</div>}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, borderTop: "var(--line)", background: "#fffdf7", padding: "14px 0", zIndex: 40 }}>
        <div className="wrap row between" style={{ maxWidth: 860 }}>
          <button className="btn ghost sm" disabled={i === 0} onClick={() => setI(i - 1)}>← back</button>
          <button className="btn lime" disabled={!step.ok || busy} onClick={next} data-cursor={last ? "send" : "next"}>
            {busy ? "sending to your coach…" : last ? "send to my coach 🚀" : "next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
