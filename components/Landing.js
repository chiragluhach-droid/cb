"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Logo from "./Logo";
import Icon from "./Icon";
import { RevealOnScroll } from "./fx";
import { STORIES, FAQ } from "@/lib/content";
import { PLANS } from "@/lib/pricing";
import { buildPlan } from "@/lib/planEngine";

const LINKS = [["#features", "Features"], ["#how", "How it works"], ["#results", "Results"], ["#pricing", "Pricing"], ["#faq", "FAQ"]];

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
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <header className={`lnav ${open ? "open" : ""}`}>
      <div className="wrap lnav__in">
        <div className="row" style={{ gap: 36 }}>
          <Logo />
          <nav className="lnav__links" aria-label="Sections">
            {LINKS.map(([h, l]) => <a key={h} href={h}>{l}</a>)}
          </nav>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {authed ? (
            <Link className="btn primary sm" href="/dashboard">Dashboard</Link>
          ) : (
            <>
              <Link className="btn ghost sm lnav__signin" href="/login">Sign in</Link>
              <Link className="btn primary sm" href="/signup">Get started</Link>
            </>
          )}
          <button className="lnav__burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>
            <span /><span />
          </button>
        </div>
      </div>
      <div className="lnav__sheet" hidden={!open}>
        <nav className="wrap" aria-label="Mobile">
          {LINKS.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)}>{l}<Icon name="chevron" size={18} /></a>)}
          {!authed && <Link href="/login" className="btn ghost lg" style={{ marginTop: 16 }}>Sign in</Link>}
        </nav>
      </div>
    </header>
  );
}

const MOCK_MEALS = [
  ["Breakfast", "Besan chilla, mint chutney, curd", 340, true],
  ["Lunch", "Dal, 2 roti, mixed veg sabzi, salad", 520, true],
  ["Snack", "Roasted makhana, green tea", 160, false],
  ["Dinner", "Paneer tikka, jeera rice, raita", 480, false],
];

function DashboardMock() {
  return (
    <div className="mock" aria-hidden>
      <div className="mock__bar"><i /><i /><i /><span>khao · today</span></div>
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
                <div style={{ fontWeight: 700, fontSize: 15 }}>{v} <span className="muted mock__of">/ {t}</span></div>
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
        <svg viewBox="0 0 160 44" width="160" height="44">
          <polyline points="0,6 27,10 54,15 81,19 108,26 135,30 160,38" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero" id="top">
      <RevealOnScroll />
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <span className="chip hero__badge"><span className="dot" /> Free during early access</span>
          <h1 className="display hero__title">Nutrition coaching built around the food you already eat.</h1>
          <p className="hero__lead">
            A personal diet and workout plan made from everyday Indian meals, reviewed by a real coach and adjusted as your body changes.
          </p>
          <div className="hero__ctas">
            <Link href="/signup" className="btn primary lg">Get your free plan <Icon name="arrow" size={16} /></Link>
            <a href="#demo" className="btn ghost lg">See a sample day</a>
          </div>
          <ul className="hero__checks">
            {["Coach-reviewed plans", "Veg, Jain, egg & non-veg", "PCOS & thyroid aware"].map((x) => (
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
    <section className="stats" aria-label="Key numbers">
      <div className="wrap stats__grid">
        {[["3 min", "to sign up"], ["24 hrs", "to your first plan"], ["100%", "coach-reviewed"], ["₹0", "during early access"]].map(([v, k]) => (
          <div key={k}>
            <div className="stats__v">{v}</div>
            <div className="stats__k">{k}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  ["plate", "Personal meal plans", "Your calories and protein, as dal, roti, paneer and idli."],
  ["shield", "Coach-reviewed", "Every plan is checked by a real coach before you see it."],
  ["refresh", "Adapts as you go", "Progress or plateau, your plan updates to match."],
  ["dumbbell", "Home or gym", "Workouts that get harder each week, wherever you train."],
  ["chart", "Simple tracking", "Meals, water, steps, weight and photos in one place."],
  ["message", "Direct coach chat", "Ask about a swap or a tough week and get a real reply."],
];

export function Features() {
  return (
    <section id="features" className="section">
      <div className="wrap">
        <SectionHead center eyebrow="Features" title="Everything you need, nothing you don't" />
        <div className="feat">
          {FEATURES.map(([i, t, d], k) => (
            <div key={t} className="feat__item reveal" style={{ transitionDelay: `${k * 40}ms` }}>
              <span className="feat__icon"><Icon name={i} size={20} /></span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  ["Tell us about you", "Goal, body, health and the foods you love. About 3 minutes."],
  ["Your coach builds the plan", "Targets calculated, meals matched, everything reviewed."],
  ["Follow it day to day", "Tick meals, swap dishes, log water, steps and weight."],
  ["It evolves with you", "Progress and plateaus trigger a reviewed update."],
];

export function How() {
  return (
    <section id="how" className="section alt">
      <div className="wrap">
        <SectionHead eyebrow="How it works" title="From sign-up to your first plan in 24 hours" />
        <ol className="steps">
          {STEPS.map(([t, d], k) => (
            <li key={t} className="step reveal" style={{ transitionDelay: `${k * 60}ms` }}>
              <span className="step__n">{k + 1}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </li>
          ))}
        </ol>
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
  const Seg = ({ set, val, opts, label }) => (
    <div className="seg" role="radiogroup" aria-label={label}>
      {opts.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={val === v} className={val === v ? "on" : ""} onClick={() => set(v)}>{l}</button>
      ))}
    </div>
  );
  const macros = [["Protein", t.protein, "var(--c-green)", 4], ["Carbs", t.carbs, "var(--c-blue)", 4], ["Fat", t.fat, "var(--c-amber)", 9]];

  return (
    <section id="demo" className="section">
      <div className="wrap">
        <SectionHead eyebrow="Live preview" title="See a sample day in seconds" sub="Runs on the same engine your coach starts from. Change the inputs and the plan updates." />
        <div className="card demo reveal">
          <div className="demo__controls">
            <div><span className="label">Goal</span><Seg label="Goal" set={setGoal} val={goal} opts={[["fat_loss", "Lose fat"], ["recomp", "Tone up"], ["muscle_gain", "Build muscle"]]} /></div>
            <div><span className="label">Diet</span><Seg label="Diet" set={setDiet} val={diet} opts={[["veg", "Veg"], ["vegan", "Vegan"], ["egg", "Egg"], ["nonveg", "Non-veg"]]} /></div>
            <div className="demo__row">
              <div><span className="label">Sex</span><Seg label="Sex" set={setSex} val={sex} opts={[["female", "Female"], ["male", "Male"]]} /></div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <span className="label">Weight · <b style={{ color: "var(--ink)" }}>{w} kg</b></span>
                <input type="range" className="range" min={45} max={130} value={w} onChange={(e) => setW(+e.target.value)} aria-label="Weight in kg" />
              </div>
            </div>
            <div className="demo__targets">
              <div>
                <div className="muted" style={{ fontSize: 13 }}>Daily target</div>
                <div className="mono demo__kcal">{t.calories.toLocaleString("en-IN")} <span>kcal</span></div>
              </div>
              <div className="demo__macros">
                {macros.map(([k, v, c, m]) => (
                  <div key={k}>
                    <div className="row between" style={{ fontSize: 13 }}><span className="muted">{k}</span><b className="mono">{v} g</b></div>
                    <div className="progress" style={{ height: 6, marginTop: 6 }}><i style={{ width: `${Math.min(100, ((v * m) / t.calories) * 160)}%`, background: c }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="demo__plan">
            <div className="tabs demo__days" role="tablist">
              {plan.diet.map((d, k) => (
                <button key={d.day} type="button" role="tab" aria-selected={k === day} className={k === day ? "on" : ""} onClick={() => setDay(k)}>{d.day}</button>
              ))}
            </div>
            <div className="plate" key={`${day}${goal}${diet}${sex}${w}`}>
              {meals.map((m, k) => (
                <div className="m" key={k}>
                  <div style={{ minWidth: 0 }}>
                    <div className="muted" style={{ fontSize: 12 }}><span style={{ textTransform: "capitalize" }}>{m.slot}</span> · {m.time}</div>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div className="muted plate__items">{m.items.map((i) => `${i.qty} ${i.food.toLowerCase()}`).join(" · ")}</div>
                  </div>
                  <div className="mono" style={{ textAlign: "right", fontSize: 13, whiteSpace: "nowrap" }}>
                    <b>{m.kcal}</b> kcal<br /><span className="muted">{m.protein} g P</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
              A rough preview. Your real plan also uses your height, age, health and food preferences, and is reviewed by your coach.
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
      </div>
      <div className="wrap quotes">
        {STORIES.map((s) => (
          <figure key={s.name} className="card quote">
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
      <p className="muted quotes__hint">Swipe for more · Individual results vary.</p>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="section">
      <div className="wrap">
        <SectionHead center eyebrow="Pricing" title="Free during early access" sub="Choose a programme length. No card, no payment, no auto-renewals." />
        <div className="prices">
          {Object.values(PLANS).map((p, k) => (
            <div key={p.id} className={`card price reveal ${k === 1 ? "featured" : ""}`}>
              <div className="row between">
                <h3>{p.label}</h3>
                {k === 1 && <span className="pill lime">Most popular</span>}
              </div>
              <div className="muted" style={{ fontSize: 14 }}>{p.days}-day programme</div>
              <div className="row" style={{ alignItems: "baseline", gap: 10, marginTop: 6 }}>
                <span className="price__amt">Free</span>
                <s className="muted mono" style={{ fontSize: 15 }}>₹{p.INR.toLocaleString("en-IN")}</s>
              </div>
              <Link href={`/signup?plan=${p.id}`} className={`btn ${k === 1 ? "primary" : "ghost"}`} style={{ width: "100%", marginTop: 10 }}>
                Start {p.days}-day plan
              </Link>
              <ul>{p.perks.map((x) => <li key={x}><Icon name="check" size={16} /> {x}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="section alt">
      <div className="wrap faq">
        <SectionHead eyebrow="FAQ" title="Questions, answered" sub={<>Something else? Sign up and message your coach directly.</>} />
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

// Mobile-only sticky CTA that appears once the hero has scrolled away
function MobileCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("top");
    const end = document.getElementById("cta");
    if (!hero) return;
    let pastHero = false, atEnd = false;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.target === hero) pastHero = !e.isIntersecting;
        if (e.target === end) atEnd = e.isIntersecting;
      });
      setShow(pastHero && !atEnd);
    });
    io.observe(hero);
    if (end) io.observe(end);
    return () => io.disconnect();
  }, []);
  return (
    <div className={`mcta ${show ? "show" : ""}`} aria-hidden={!show}>
      <Link href="/signup" className="btn primary lg" tabIndex={show ? 0 : -1}>Get your free plan <Icon name="arrow" size={16} /></Link>
    </div>
  );
}

export function Footer() {
  return (
    <>
      <section className="section cta-wrap" id="cta">
        <div className="wrap">
          <div className="cta">
            <div>
              <h2>Ready to start eating better?</h2>
              <p>Answer a few questions. Your coach will have your plan ready within 24 hours.</p>
            </div>
            <div className="cta__btns">
              <Link href="/signup" className="btn lg cta__btn">Get your free plan <Icon name="arrow" size={16} /></Link>
              <a href="#demo" className="btn lg cta__ghost">See a sample day</a>
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
          <span>© {new Date().getFullYear()} Khao Nutrition &amp; Training</span>
          <span>Not medical advice. Consult your doctor about any health condition.</span>
        </div>
      </footer>
      <MobileCta />
    </>
  );
}
