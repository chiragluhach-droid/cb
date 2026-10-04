"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import Logo from "./Logo";
import Icon from "./Icon";
import { RevealOnScroll } from "./fx";
import { STORIES, FAQ } from "@/lib/content";
import { PLANS } from "@/lib/pricing";
import { buildPlan } from "@/lib/planEngine";

function SectionHead({ eyebrow, title, sub, center }) {
  return (
    <div className={`sec-head reveal ${center ? "center" : ""}`}>
      <div className="eyebrow brand">{eyebrow}</div>
      <h2 className="display">{title}</h2>
      {sub && <p className="lead">{sub}</p>}
    </div>
  );
}

export function Nav({ authed }) {
  return (
    <header className="lnav">
      <div className="wrap lnav__in">
        <div className="row" style={{ gap: 36 }}>
          <Logo />
          <nav className="lnav__links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#results">Results</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {authed ? (
            <Link className="btn primary sm" href="/dashboard">Go to dashboard</Link>
          ) : (
            <>
              <Link className="btn ghost sm lnav__signin" href="/login">Sign in</Link>
              <Link className="btn primary sm" href="/signup">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const MOCK_MEALS = [
  ["Breakfast", "Besan chilla, mint chutney, curd", 340, true],
  ["Lunch", "Dal, 2 roti, mixed veg sabzi, salad", 520, true],
  ["Snack", "Roasted makhana, green tea", 160, false],
  ["Dinner", "Paneer tikka, jeera rice, cucumber raita", 480, false],
];

function DashboardMock() {
  return (
    <div className="mock">
      <div className="mock__bar"><i /><i /><i /><span>app.khao.fit/dashboard</span></div>
      <div className="mock__body">
        <aside className="mock__side">
          {[["home", "Today", true], ["clipboard", "My plan"], ["dumbbell", "Workout"], ["chart", "Progress"], ["message", "Coach"]].map(([i, l, on]) => (
            <div key={l} className={on ? "on" : ""}><Icon name={i} size={14} /> {l}</div>
          ))}
        </aside>
        <div className="mock__main">
          <div className="row between">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Good morning, Riya</div>
              <div className="muted" style={{ fontSize: 12 }}>Week 6 · Fat loss phase</div>
            </div>
            <span className="pill lime">On track</span>
          </div>
          <div className="mock__stats">
            {[["Calories", "860", "1,650", 52], ["Protein", "48g", "95g", 51], ["Steps", "6,820", "8,000", 85]].map(([k, v, t, p]) => (
              <div key={k} className="mock__stat">
                <div className="muted" style={{ fontSize: 11 }}>{k}</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{v} <span className="muted" style={{ fontWeight: 500, fontSize: 11 }}>/ {t}</span></div>
                <div className="progress" style={{ height: 5, marginTop: 6 }}><i style={{ width: `${p}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mock__meals">
            {MOCK_MEALS.map(([slot, name, kcal, done]) => (
              <div key={slot} className="mock__meal">
                <span className={`tick ${done ? "on" : ""}`} style={{ width: 18, height: 18, borderRadius: 5 }}><Icon name="check" size={11} stroke={3} /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="muted" style={{ fontSize: 10.5 }}>{slot}</div>
                  <div className="mock__mealname">{name}</div>
                </div>
                <span className="mono muted" style={{ fontSize: 11.5 }}>{kcal} kcal</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mock__float">
        <div className="muted" style={{ fontSize: 11 }}>Weight · last 6 weeks</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>−4.2 kg</div>
        <svg viewBox="0 0 160 44" width="160" height="44" aria-hidden>
          <polyline points="0,6 27,10 54,15 81,19 108,26 135,30 160,38" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero">
      <RevealOnScroll />
      <div className="wrap hero__grid">
        <div>
          <span className="chip hero__badge"><span className="dot" /> Now accepting new clients</span>
          <h1 className="display hero__title">Nutrition coaching built around the food you already eat.</h1>
          <p className="lead" style={{ maxWidth: 540 }}>
            Khao gives you a personal diet and workout plan made from everyday Indian meals, reviewed by a real coach and adjusted as your body changes. Including PCOS, thyroid and diabetes-aware plans.
          </p>
          <div className="row wrapflex" style={{ marginTop: 32, gap: 12 }}>
            <Link href="/signup" className="btn primary lg">Get your plan <Icon name="arrow" size={16} /></Link>
            <a href="#demo" className="btn ghost lg">See a sample day</a>
          </div>
          <ul className="hero__checks">
            {["Coach-reviewed plans", "Veg, Jain, egg & non-veg", "UPI & international cards"].map((x) => (
              <li key={x}><Icon name="check" size={16} /> {x}</li>
            ))}
          </ul>
        </div>
        <DashboardMock />
      </div>
    </section>
  );
}

export function Stats() {
  return (
    <section className="stats">
      <div className="wrap stats__grid">
        {[["3 min", "to complete onboarding"], ["24 hrs", "to receive your first plan"], ["100%", "of plans reviewed by a coach"], ["2–3 wks", "before a plateau triggers a new plan"]].map(([v, k]) => (
          <div key={k}>
            <div className="stats__v">{v}</div>
            <div className="muted" style={{ fontSize: 14 }}>{k}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  ["plate", "Personalised meal plans", "Calories and protein worked out for your body, then turned into meals from dal, roti, paneer, idli and everything else you already cook."],
  ["shield", "Reviewed by a coach", "Every plan is checked and approved by your coach before it reaches you. No auto-generated PDFs."],
  ["refresh", "Plans that adapt", "Lose 2 kg and your numbers update. Stall for two weeks and your plan is reworked. Hit your goal and you move to maintain or build."],
  ["dumbbell", "Home or gym training", "Progressive workouts that get harder each week, whether you have a full gym or a mat and a pair of dumbbells."],
  ["chart", "Progress tracking", "Log meals, water, steps and weight daily. Weekly check-ins, progress photos and a before/after comparison."],
  ["message", "Direct coach access", "Questions about a meal swap or a tough week? Message your coach from the dashboard and get a real reply."],
];

export function Features() {
  return (
    <section id="features" className="section">
      <div className="wrap">
        <SectionHead center eyebrow="Features" title="Everything you need to reach your goal" sub="A coach, a plan and a tracker in one place, designed for the way Indian households actually eat." />
        <div className="grid g3 feat">
          {FEATURES.map(([i, t, d], k) => (
            <div key={t} className="card feat__card reveal" style={{ transitionDelay: `${k * 50}ms` }}>
              <span className="feat__icon"><Icon name={i} size={20} /></span>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  ["Tell us about you", "Goal, height, weight, health conditions, diet type and the foods you love or avoid. About 3 minutes."],
  ["Your coach builds the plan", "Targets are calculated, meals are matched to your preferences, and your coach reviews everything."],
  ["Follow it day to day", "Today's meals on your dashboard. Tick them off, swap a dish, log water, steps and weight."],
  ["It evolves with you", "Progress, plateaus and goals all trigger a reviewed update, so the plan always fits where you are now."],
];

export function How() {
  return (
    <section id="how" className="section alt">
      <div className="wrap">
        <SectionHead eyebrow="How it works" title="From sign-up to your first plan in 24 hours" />
        <div className="steps">
          {STEPS.map(([t, d], k) => (
            <div key={t} className="step reveal" style={{ transitionDelay: `${k * 60}ms` }}>
              <span className="step__n">{k + 1}</span>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Interactive: a live sample day from the real plan engine
export function TryIt() {
  const [goal, setGoal] = useState("fat_loss");
  const [diet, setDiet] = useState("veg");
  const [sex, setSex] = useState("female");
  const [w, setW] = useState(72);
  const [day, setDay] = useState(0);
  const plan = useMemo(
    () =>
      buildPlan({ name: "You", sex, age: 27, heightCm: sex === "female" ? 160 : 175, weightKg: w, targetWeightKg: goal === "fat_loss" ? w - 8 : w, goal, activity: "light", diet, conditions: [], likes: [], dislikes: [], mealsPerDay: 4, workoutPlace: "home", experience: "beginner", daysPerWeek: 4 }),
    [goal, diet, sex, w]
  );
  const t = plan.targets;
  const meals = plan.diet[day].meals;
  const Seg = ({ set, val, opts }) => (
    <div className="seg">
      {opts.map(([v, l]) => (
        <button key={v} type="button" className={val === v ? "on" : ""} onClick={() => set(v)}>{l}</button>
      ))}
    </div>
  );
  const macros = [["Protein", t.protein, "var(--c-green)"], ["Carbs", t.carbs, "var(--c-blue)"], ["Fat", t.fat, "var(--c-amber)"]];

  return (
    <section id="demo" className="section">
      <div className="wrap">
        <SectionHead eyebrow="Live preview" title="See a sample day in seconds" sub="This runs on the same engine your coach starts from. Change the inputs and the plan updates." />
        <div className="card demo reveal">
          <div className="demo__controls">
            <div><span className="label">Goal</span><Seg set={setGoal} val={goal} opts={[["fat_loss", "Lose fat"], ["recomp", "Tone up"], ["muscle_gain", "Build muscle"]]} /></div>
            <div><span className="label">Diet</span><Seg set={setDiet} val={diet} opts={[["vegan", "Vegan"], ["veg", "Vegetarian"], ["egg", "Eggetarian"], ["nonveg", "Non-veg"]]} /></div>
            <div><span className="label">Sex</span><Seg set={setSex} val={sex} opts={[["female", "Female"], ["male", "Male"]]} /></div>
            <div>
              <span className="label">Weight · <b style={{ color: "var(--ink)" }}>{w} kg</b></span>
              <input type="range" className="range" min={45} max={130} value={w} onChange={(e) => setW(+e.target.value)} />
            </div>
            <div className="demo__targets">
              <div>
                <div className="muted" style={{ fontSize: 13 }}>Daily target</div>
                <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em" }} className="mono">{t.calories.toLocaleString("en-IN")} <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>kcal</span></div>
              </div>
              {macros.map(([k, v, c]) => (
                <div key={k} className="demo__macro">
                  <div className="row between" style={{ fontSize: 13 }}><span className="muted">{k}</span><b className="mono">{v} g</b></div>
                  <div className="progress" style={{ height: 6, marginTop: 6 }}><i style={{ width: `${Math.min(100, ((v * (k === "Fat" ? 9 : 4)) / t.calories) * 100 * 1.6)}%`, background: c }} /></div>
                </div>
              ))}
              <div className="muted" style={{ fontSize: 13 }}>Water {t.water / 1000} L · {t.steps.toLocaleString("en-IN")} steps</div>
            </div>
          </div>
          <div className="demo__plan">
            <div className="tabs">
              {plan.diet.map((d, k) => (
                <button key={d.day} type="button" className={k === day ? "on" : ""} onClick={() => setDay(k)}>{d.day}</button>
              ))}
            </div>
            <div className="plate" key={`${day}${goal}${diet}${sex}${w}`}>
              {meals.map((m, k) => (
                <div className="m" key={k}>
                  <div style={{ minWidth: 0 }}>
                    <div className="muted" style={{ fontSize: 12, textTransform: "capitalize" }}>{m.slot} · {m.time}</div>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{m.items.map((i) => `${i.qty} ${i.food.toLowerCase()}`).join(" · ")}</div>
                  </div>
                  <div className="mono" style={{ textAlign: "right", fontSize: 13, whiteSpace: "nowrap" }}>
                    <b>{m.kcal} kcal</b><br /><span className="muted">{m.protein} g protein</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
              A rough preview. Your real plan also uses your height, age, health conditions and food preferences, and is reviewed by your coach.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Results() {
  return (
    <section id="results" className="section alt">
      <div className="wrap">
        <SectionHead center eyebrow="Results" title="Real people, real food, real progress" />
        <div className="grid g3" style={{ marginTop: 48 }}>
          {STORIES.map((s, k) => (
            <figure key={s.name} className="card quote reveal" style={{ transitionDelay: `${(k % 3) * 50}ms` }}>
              <div className="row between">
                <span className="quote__result">{s.lost}</span>
                <span className="pill">{s.tag}</span>
              </div>
              <blockquote>&ldquo;{s.quote}&rdquo;</blockquote>
              <figcaption className="row">
                <span className="avatar">{s.name.charAt(0)}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{s.city} · {s.weeks} weeks</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 20, textAlign: "center" }}>Individual results vary.</p>
      </div>
    </section>
  );
}

export function Pricing() {
  const [cur, setCur] = useState("INR");
  const sym = cur === "INR" ? "₹" : "$";
  return (
    <section id="pricing" className="section">
      <div className="wrap">
        <SectionHead center eyebrow="Pricing" title="Simple, transparent pricing" sub="One-time payment per programme. No auto-renewals, no hidden fees." />
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <div className="tabs pill-tabs">
            <button type="button" className={cur === "INR" ? "on" : ""} onClick={() => setCur("INR")}>INR · UPI & cards</button>
            <button type="button" className={cur === "USD" ? "on" : ""} onClick={() => setCur("USD")}>USD · International</button>
          </div>
        </div>
        <div className="prices">
          {Object.values(PLANS).map((p, k) => (
            <div key={p.id} className={`card price reveal ${k === 1 ? "featured" : ""}`}>
              <div className="row between">
                <h3>{p.label}</h3>
                {k === 1 && <span className="pill lime">Most popular</span>}
              </div>
              <div className="muted" style={{ fontSize: 14 }}>{p.days}-day programme</div>
              <div className="row" style={{ alignItems: "baseline", gap: 6, marginTop: 8 }}>
                <span className="price__amt mono">{sym}{p[cur].toLocaleString("en-IN")}</span>
                <span className="muted">one-time</span>
              </div>
              <div className="muted" style={{ fontSize: 13 }}>≈ {sym}{Math.round(p[cur] / p.days)} per day{k === 1 && " · save 17%"}</div>
              <Link href={`/signup?plan=${p.id}`} className={`btn ${k === 1 ? "primary" : "ghost"}`} style={{ width: "100%", marginTop: 8 }}>
                Start {p.days}-day plan
              </Link>
              <ul>{p.perks.map((x) => <li key={x}><Icon name="check" size={16} /> {x}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 20, fontSize: 13, textAlign: "center" }}>Have a discount code? Apply it at checkout.</p>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="section alt">
      <div className="wrap faq">
        <SectionHead eyebrow="FAQ" title="Frequently asked questions" sub={<>Can&apos;t find what you&apos;re looking for? Sign up and message your coach directly.</>} />
        <div>
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}<span className="pm" aria-hidden>+</span></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <>
      <section className="section" style={{ paddingTop: 0, background: "var(--paper)" }}>
        <div className="wrap">
          <div className="cta">
            <div>
              <h2>Ready to start eating better?</h2>
              <p>Answer a few questions and your coach will have your plan ready within 24 hours.</p>
            </div>
            <div className="row wrapflex" style={{ gap: 10 }}>
              <Link href="/signup" className="btn lg cta__btn">Get your plan <Icon name="arrow" size={16} /></Link>
              <a href="#pricing" className="btn lg cta__ghost">View pricing</a>
            </div>
          </div>
        </div>
      </section>
      <footer className="lfoot">
        <div className="wrap lfoot__grid">
          <div>
            <Logo />
            <p className="muted" style={{ marginTop: 14, fontSize: 14, maxWidth: 300 }}>Personal nutrition and training coaching, built around Indian food.</p>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#features">Features</a><a href="#how">How it works</a><a href="#demo">Sample plan</a><a href="#pricing">Pricing</a>
          </div>
          <div>
            <h4>Account</h4>
            <Link href="/signup">Get started</Link><Link href="/login">Sign in</Link><Link href="/dashboard">Dashboard</Link>
          </div>
          <div>
            <h4>Support</h4>
            <a href="#faq">FAQ</a><a href="#results">Client results</a>
          </div>
        </div>
        <div className="wrap lfoot__bottom">
          <span>© {new Date().getFullYear()} Khao Nutrition &amp; Training. All rights reserved.</span>
          <span>Not medical advice. Consult your doctor about any health condition.</span>
        </div>
      </footer>
    </>
  );
}
