"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Logo from "./Logo";
import { Sticker, Magnetic, Tilt, CountUp, RevealOnScroll, burst } from "./fx";
import { STORIES, FAQ, MARQUEE } from "@/lib/content";
import { PLANS } from "@/lib/pricing";
import { buildPlan } from "@/lib/planEngine";

const IMG = (id, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

export function Nav({ authed }) {
  return (
    <header className="nav wrap">
      <div className="nav__in">
        <Logo />
        <nav className="nav__links">
          <a href="#how">how it works</a>
          <a href="#try">try it</a>
          <a href="#results">results</a>
          <a href="#pricing">pricing</a>
        </nav>
        <div className="row" style={{ gap: 6 }}>
          {authed ? (
            <Link className="btn lime sm" href="/dashboard">my dashboard →</Link>
          ) : (
            <>
              <Link className="btn ghost sm" href="/login">log in</Link>
              <Link className="btn lime sm" href="/signup" data-cursor="let's go">get my plan</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const WORDS = ["roti", "dal", "paneer", "dosa", "biryani*", "chai"];

export function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 1700);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="hero wrap">
      <RevealOnScroll />
      <div className="row wrapflex" style={{ gap: 10 }}>
        <span className="chip" style={{ background: "var(--lime)" }}>● now taking clients</span>
        <span className="chip">diet + workout + a real human</span>
      </div>
      <h1 className="display" style={{ marginTop: 22 }}>
        eat <span key={i} className="rot-word word-in">{WORDS[i]}</span>
        <br />
        <span className="hl">get fit.</span> <span className="serif">no sad</span>
        <br />
        salads<span style={{ color: "var(--orange)" }}>.</span>
      </h1>

      <div className="hero__grid">
        <div>
          <p style={{ fontSize: "clamp(18px, 2vw, 23px)", maxWidth: 560, lineHeight: 1.4 }}>
            A diet + workout plan built around <span className="serif" style={{ fontSize: "1.2em" }}>ghar ka khana</span>. Made for your body,
            your PCOS or thyroid, your cravings. Checked by your coach. Updated as you change.
          </p>
          <div className="row wrapflex" style={{ marginTop: 28, gap: 14 }}>
            <Magnetic>
              <Link href="/signup" className="btn lime" data-cursor="start" style={{ fontSize: 20, padding: "18px 30px" }}>
                build my plan →
              </Link>
            </Magnetic>
            <a href="#reel" className="btn ghost" data-cursor="play">▶ watch 30s</a>
          </div>
          <div className="row wrapflex" style={{ marginTop: 40, gap: 34 }}>
            {[[3, " min", "to sign up"], [24, " hrs", "plan in your hands"], [100, "%", "plans checked by a human"]].map(([n, s, k]) => (
              <div key={k}>
                <div className="display" style={{ fontSize: 46 }}><CountUp to={n} suffix={s} /></div>
                <div className="eyebrow muted">{k}</div>
              </div>
            ))}
          </div>
          <p className="mono muted" style={{ fontSize: 11, marginTop: 12 }}>*yes, biryani. portion-controlled, but yes.</p>
        </div>

        <div className="hero__art" style={{ position: "relative", maxWidth: 460, justifySelf: "center", width: "100%" }}>
          <Tilt className="arch" data-cursor="yum">
            <img src={IMG("1546833999-b9f581a1996d")} alt="Indian thali with roti, dal and sabzi" />
          </Tilt>
          <div className="badge-spin" style={{ top: -40, left: -50 }}>
            <svg viewBox="0 0 200 200" className="spin" style={{ width: "100%", height: "100%" }}>
              <defs><path id="c" d="M100,100 m-75,0 a75,75 0 1,1 150,0 a75,75 0 1,1 -150,0" /></defs>
              <circle cx="100" cy="100" r="98" fill="var(--butter)" stroke="var(--ink)" strokeWidth="3" />
              <text style={{ fontFamily: "var(--mono)", fontSize: 17, fontWeight: 700, letterSpacing: 3 }}>
                <textPath href="#c">REAL COACH ✦ REAL FOOD ✦ REAL RESULTS ✦</textPath>
              </text>
            </svg>
            <div className="core">🧑‍🍳</div>
          </div>
          <div className="macro-card float" style={{ right: -18, top: "38%" }}>
            <div className="eyebrow muted">today's lunch</div>
            <b style={{ fontFamily: "var(--display)", fontSize: 17 }}>Dal, 2 roti, sabzi</b>
            <div className="mono" style={{ marginTop: 4 }}>520 kcal · 24g protein</div>
          </div>
          <div className="macro-card" style={{ left: -24, bottom: 30, background: "var(--lime)", rotate: "-4deg" }}>
            <div className="mono">✓ ticked off · streak 12 🔥</div>
          </div>
          <Sticker style={{ top: "4%", right: -10, background: "var(--pink)" }} rotate={8}>PCOS friendly</Sticker>
          <Sticker style={{ bottom: -24, right: 40, background: "var(--sky)" }} rotate={-6}>veg / non-veg / jain</Sticker>
        </div>
      </div>
    </section>
  );
}

export function Marquee({ items = MARQUEE, rev, lime }) {
  const row = (
    <span>
      {items.map((w) => (
        <span key={w} style={{ display: "contents" }}>
          {w} <span style={{ color: lime ? "var(--pink)" : "var(--lime)" }}>✦</span>
        </span>
      ))}
    </span>
  );
  return (
    <div className={`marquee ${rev ? "rev" : ""} ${lime ? "lime" : ""}`} style={{ rotate: rev ? "1deg" : "-1.5deg", margin: "10px -10px" }}>
      <div className="marquee__track">{row}{row}</div>
    </div>
  );
}

export function Reel() {
  return (
    <section id="reel" className="section wrap">
      <div className="grid g2" style={{ alignItems: "center", gap: 50 }}>
        <div className="reveal">
          <div className="kicker"><span className="dot" /><span className="eyebrow">the 30-second version</span></div>
          <h2 className="display">
            this is how <span className="serif">your</span> plan gets made.
          </h2>
          <p style={{ fontSize: 20, marginTop: 22, maxWidth: 480, color: "var(--ink-2)" }}>
            You tell us about your body, your food and your schedule. Your coach builds the plan, checks every meal and sends it over.
            Then it keeps changing as you do.
          </p>
          <div className="row wrapflex" style={{ marginTop: 26 }}>
            <span className="pill lime">no generic PDFs</span>
            <span className="pill pink">no 1200-kcal crash diets</span>
            <span className="pill sky">no boiled-chicken-only</span>
          </div>
        </div>
        <div className="reveal" style={{ display: "flex", justifyContent: "center", position: "relative" }}>
          <div className="phone" data-cursor="watch">
            <iframe src="/reel.html" title="How KHAO works" loading="lazy" />
          </div>
          <Sticker style={{ top: 40, left: "4%", background: "var(--lime)" }} rotate={-10}>▶ live</Sticker>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  ["01", "spill the tea", "Goal, height, weight, PCOS / thyroid, veg or non-veg, foods you love and hate. 3 minutes.", "var(--butter)", "📝"],
  ["02", "coach builds it", "Your calories and protein worked out, then meals from everyday Indian food. Checked before it reaches you.", "var(--pink)", "🧑‍🍳"],
  ["03", "tick, swap, log", "Today's meals on your dashboard. Tick them off, swap a dish you're not feeling, log water, steps and weight.", "var(--sky)", "✅"],
  ["04", "plan evolves", "Weight drops? Numbers update. Stuck for 2–3 weeks? Plan changes. Hit your goal? We switch to maintain or build.", "var(--lime)", "📈"],
];

export function How() {
  return (
    <section id="how" className="section wrap">
      <div className="kicker reveal"><span className="dot" /><span className="eyebrow">how it works</span></div>
      <h2 className="display reveal" style={{ maxWidth: 900 }}>
        4 steps. <span className="serif">zero</span> guesswork.
      </h2>
      <div className="grid g4" style={{ marginTop: 50 }}>
        {STEPS.map(([n, t, d, c, e], k) => (
          <Tilt key={n} className="card step reveal wobble" style={{ background: c, transitionDelay: `${k * 80}ms` }} data-cursor={e}>
            <div className="row between">
              <span className="n">{n}</span>
              <span style={{ fontSize: 40 }}>{e}</span>
            </div>
            <div>
              <h3 className="display" style={{ fontSize: 32, marginBottom: 10 }}>{t}</h3>
              <p style={{ fontSize: 15 }}>{d}</p>
            </div>
          </Tilt>
        ))}
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
  const kcalP = (t.protein * 4) / t.calories, kcalC = (t.carbs * 4) / t.calories;
  const C = 2 * Math.PI * 54;
  const Seg = ({ set, val, opts }) => (
    <div className="seg">
      {opts.map(([v, l]) => (
        <button key={v} className={val === v ? "on" : ""} onClick={() => set(v)}>{l}</button>
      ))}
    </div>
  );

  return (
    <section id="try" className="section" style={{ background: "var(--lilac)", borderBlock: "var(--line)" }}>
      <div className="wrap">
        <div className="kicker reveal"><span className="dot" /><span className="eyebrow">play with it</span></div>
        <h2 className="display reveal">see a sample day <span className="serif">rn.</span></h2>
        <div className="grid g2" style={{ marginTop: 40, alignItems: "start" }}>
          <div className="card demo stack reveal">
            <div><span className="label">goal</span><Seg set={setGoal} val={goal} opts={[["fat_loss", "lose fat 🔥"], ["recomp", "tone up ✨"], ["muscle_gain", "build muscle 💪"]]} /></div>
            <div><span className="label">i eat</span><Seg set={setDiet} val={diet} opts={[["vegan", "vegan"], ["veg", "veg"], ["egg", "veg + eggs"], ["nonveg", "non-veg"]]} /></div>
            <div><span className="label">i am</span><Seg set={setSex} val={sex} opts={[["female", "woman"], ["male", "man"]]} /></div>
            <div>
              <span className="label">weight: <b>{w} kg</b></span>
              <input type="range" className="range" min={45} max={130} value={w} onChange={(e) => setW(+e.target.value)} />
            </div>
            <div className="row" style={{ gap: 22, marginTop: 18, flexWrap: "wrap" }}>
              <svg className="donut" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="54" fill="none" stroke="var(--butter)" strokeWidth="22" />
                <circle cx="70" cy="70" r="54" fill="none" stroke="var(--pink)" strokeWidth="22" strokeDasharray={`${C * kcalP} ${C}`} transform="rotate(-90 70 70)" style={{ transition: "all .5s" }} />
                <circle cx="70" cy="70" r="54" fill="none" stroke="var(--sky)" strokeWidth="22" strokeDasharray={`${C * kcalC} ${C}`} strokeDashoffset={-C * kcalP} transform="rotate(-90 70 70)" style={{ transition: "all .5s" }} />
                <circle cx="70" cy="70" r="65" fill="none" stroke="var(--ink)" strokeWidth="2" />
                <circle cx="70" cy="70" r="43" fill="#fffdf7" stroke="var(--ink)" strokeWidth="2" />
                <text x="70" y="68" textAnchor="middle" style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 24 }}>{t.calories}</text>
                <text x="70" y="86" textAnchor="middle" style={{ fontFamily: "var(--mono)", fontSize: 10 }}>KCAL / DAY</text>
              </svg>
              <div className="stack mono" style={{ fontSize: 14 }}>
                <div><span className="pill pink">protein</span> {t.protein}g</div>
                <div><span className="pill sky">carbs</span> {t.carbs}g</div>
                <div><span className="pill butter">fat</span> {t.fat}g</div>
                <div>💧 {t.water / 1000}L · 👟 {t.steps.toLocaleString("en-IN")} steps</div>
              </div>
            </div>
          </div>
          <div className="reveal">
            <div className="row wrapflex" style={{ marginBottom: 14, gap: 6 }}>
              {plan.diet.map((d, k) => (
                <button key={d.day} className={`btn sm ${k === day ? "" : "ghost"}`} style={{ padding: "6px 12px" }} onClick={() => setDay(k)}>{d.day}</button>
              ))}
            </div>
            <div className="plate" key={`${day}${goal}${diet}${sex}${w}`}>
              {meals.map((m, k) => (
                <div className="m" key={k} style={{ animationDelay: `${k * 60}ms` }}>
                  <div>
                    <div className="eyebrow muted">{m.slot} · {m.time}</div>
                    <b style={{ fontFamily: "var(--display)", fontSize: 18 }}>{m.name}</b>
                    <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{m.items.map((i) => `${i.qty} ${i.food.toLowerCase()}`).join(" · ")}</div>
                  </div>
                  <div className="mono" style={{ textAlign: "right", fontSize: 13, whiteSpace: "nowrap" }}>
                    {m.kcal} kcal<br /><span className="muted">{m.protein}g P</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mono" style={{ fontSize: 12, marginTop: 12 }}>
              ↑ a rough preview. your real plan uses your height, age, health conditions and the foods you love, and your coach checks it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Bento() {
  return (
    <section className="section wrap">
      <div className="kicker reveal"><span className="dot" /><span className="eyebrow">what you get</span></div>
      <h2 className="display reveal">your own little <span className="serif">fitness HQ.</span></h2>
      <div className="bento" style={{ marginTop: 44 }}>
        <div className="card b-a reveal" style={{ background: "var(--ink)", color: "var(--paper)" }}>
          <img src={IMG("1567188040759-fb8a883dc6d8", 1000)} alt="Paneer tikka" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
          <div style={{ position: "relative", padding: 26, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <span className="chip" style={{ background: "var(--lime)", color: "var(--ink)", alignSelf: "flex-start" }}>meal plan</span>
            <div>
              <h3 className="display" style={{ fontSize: 44 }}>paneer tikka <span className="serif">is</span> on the menu.</h3>
              <p style={{ maxWidth: 380, marginTop: 8 }}>Indian food, with the calories and protein worked out. Not feeling it? Swap the dish in one tap.</p>
            </div>
          </div>
        </div>
        <div className="card b-b reveal" style={{ background: "var(--butter)", padding: 22 }}>
          <span className="eyebrow">daily tracking</span>
          <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: "wrap" }}>
            {["🥣 breakfast", "🍛 lunch", "🥜 snack", "🫓 dinner"].map((m, k) => (
              <span key={m} className={`pill ${k < 2 ? "lime" : ""}`} style={{ fontSize: 13, padding: "6px 12px" }}>{k < 2 ? "✓ " : ""}{m}</span>
            ))}
          </div>
          <div className="row" style={{ marginTop: 18, gap: 18 }}>
            <span className="mono">💧 2.1 / 2.5L</span><span className="mono">👟 8,402</span><span className="mono">⚖️ 68.4</span>
          </div>
        </div>
        <div className="card b-c reveal" style={{ padding: 0 }}>
          <img src={IMG("1571019613454-1cb2f99b2d8b", 700)} alt="Home workout" style={{ width: "100%", height: "58%", objectFit: "cover", borderBottom: "var(--line)" }} />
          <div style={{ padding: 18 }}>
            <span className="eyebrow">workouts</span>
            <h3 className="display" style={{ fontSize: 26, marginTop: 6 }}>home or gym. gets harder every week.</h3>
          </div>
        </div>
        <div className="card b-d reveal" style={{ background: "var(--pink)", display: "grid", placeItems: "center", fontSize: 54 }} data-cursor="📸">📸</div>
        <div className="card b-e reveal" style={{ background: "var(--sky)", padding: 22 }}>
          <span className="eyebrow">progress</span>
          <svg viewBox="0 0 300 80" style={{ width: "100%", height: 90, marginTop: 6 }}>
            <polyline points="0,12 40,18 80,22 120,30 160,34 200,33 240,46 300,60" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" strokeDasharray="400" strokeDashoffset="0">
              <animate attributeName="stroke-dashoffset" from="400" to="0" dur="2s" fill="freeze" />
            </polyline>
            <circle cx="300" cy="60" r="6" fill="var(--lime)" stroke="var(--ink)" strokeWidth="2" />
          </svg>
          <div className="mono" style={{ fontSize: 13 }}>start vs now · weight, waist, photos</div>
        </div>
        <div className="card b-f reveal" style={{ background: "var(--lime)", padding: 22, display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 48 }}>💬</span>
          <div>
            <span className="eyebrow">your coach</span>
            <p className="serif" style={{ fontSize: 24, lineHeight: 1.15 }}>&ldquo;Scale stuck for 2 weeks? Totally normal. Tweaked your plan, check it out.&rdquo;</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Results() {
  return (
    <section id="results" className="section" style={{ paddingBottom: 60 }}>
      <div className="wrap">
        <div className="kicker reveal"><span className="dot" /><span className="eyebrow">real people, real thalis</span></div>
        <div className="row between wrapflex reveal" style={{ alignItems: "end" }}>
          <h2 className="display">the <span className="serif">glow-up</span> files.</h2>
          <span className="mono muted">drag / scroll →</span>
        </div>
      </div>
      <div className="wrap" style={{ marginTop: 40 }}>
        <div className="stories">
          {STORIES.map((s, k) => (
            <Tilt key={s.name} className="card story" style={{ background: k % 2 ? "#fffdf7" : s.color }} data-cursor={s.emoji}>
              <div className="row between">
                <span style={{ fontSize: 40, width: 64, height: 64, borderRadius: "50%", border: "var(--line)", background: k % 2 ? s.color : "#fffdf7", display: "grid", placeItems: "center" }}>{s.emoji}</span>
                <span className="pill" style={{ background: "#fffdf7" }}>{s.tag}</span>
              </div>
              <div className="display" style={{ fontSize: 58 }}>{s.lost}</div>
              <p className="serif" style={{ fontSize: 22, lineHeight: 1.2 }}>&ldquo;{s.quote}&rdquo;</p>
              <div className="row between mono" style={{ fontSize: 12, marginTop: "auto" }}>
                <span>{s.name} · {s.city}</span>
                <span>{s.weeks} wks</span>
              </div>
            </Tilt>
          ))}
        </div>
        <p className="mono muted" style={{ fontSize: 11 }}>individual results vary. consistency &gt; perfection.</p>
      </div>
      <div className="wrap grid g3" style={{ marginTop: 30 }}>
        {["1589301760014-d929f3979dbc", "1626777552726-4a6b54c97e46", "1541534741688-6078c6bfb5c5"].map((id, k) => (
          <Tilt key={id} className="card reveal" style={{ overflow: "hidden", aspectRatio: "4/3", rotate: `${[-2, 1.5, -1][k]}deg` }}>
            <img src={IMG(id, 700)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Tilt>
        ))}
      </div>
    </section>
  );
}

export function Pricing() {
  const [cur, setCur] = useState("INR");
  const sym = cur === "INR" ? "₹" : "$";
  return (
    <section id="pricing" className="section wrap">
      <div className="kicker reveal"><span className="dot" /><span className="eyebrow">pricing</span></div>
      <div className="row between wrapflex reveal" style={{ alignItems: "end", gap: 20 }}>
        <h2 className="display">cheaper than <span className="serif">your</span> swiggy bill.</h2>
        <div className="toggle">
          <button className={cur === "INR" ? "on" : ""} onClick={() => setCur("INR")}>🇮🇳 INR · UPI</button>
          <button className={cur === "USD" ? "on" : ""} onClick={() => setCur("USD")}>🌍 USD</button>
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 44, maxWidth: 980 }}>
        {Object.values(PLANS).map((p, k) => (
          <Tilt key={p.id} className="card price reveal" max={5} style={{ background: k ? "var(--lime)" : "#fffdf7" }}>
            {k === 1 && <span className="sticker" style={{ top: -18, right: 20, background: "var(--pink)", rotate: "6deg", cursor: "default" }}>most picked ⭐</span>}
            <div className="eyebrow">{p.label}</div>
            <div className="row" style={{ alignItems: "baseline", gap: 8 }}>
              <span className="amt">{sym}{p[cur].toLocaleString("en-IN")}</span>
              <span className="mono muted">/ {p.days} days</span>
            </div>
            <div className="mono" style={{ fontSize: 13 }}>
              ≈ {sym}{Math.round(p[cur] / p.days)}/day{k === 1 && " · save 17%"}
            </div>
            <ul>{p.perks.map((x) => <li key={x}>{x}</li>)}</ul>
            <Link href={`/signup?plan=${p.id}`} className={`btn ${k ? "" : "lime"}`} onClick={(e) => burst(e.clientX, e.clientY)} data-cursor="yesss">
              start {p.days}-day plan →
            </Link>
          </Tilt>
        ))}
      </div>
      <p className="mono muted" style={{ marginTop: 20, fontSize: 13 }}>UPI · cards · international cards · got a code? apply it at checkout.</p>
    </section>
  );
}

export function Faq() {
  return (
    <section className="section wrap faq" style={{ paddingTop: 40 }}>
      <div className="kicker reveal"><span className="dot" /><span className="eyebrow">faq</span></div>
      <h2 className="display reveal" style={{ marginBottom: 30 }}>questions? <span className="serif">fair.</span></h2>
      {FAQ.map(([q, a]) => (
        <details key={q} className="reveal">
          <summary data-cursor="open">{q}<span className="pm">+</span></summary>
          <p>{a}</p>
        </details>
      ))}
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer-cta">
      <div className="wrap">
        <div className="row between wrapflex" style={{ gap: 30, alignItems: "end" }}>
          <div>
            <p className="serif" style={{ fontSize: "clamp(28px,4vw,52px)", lineHeight: 1.05, maxWidth: 680 }}>
              Your body, your food, your coach. Let&apos;s go.
            </p>
            <div className="row wrapflex" style={{ marginTop: 26 }}>
              <Magnetic><Link href="/signup" className="btn lime" style={{ fontSize: 22, padding: "20px 34px", boxShadow: "4px 4px 0 var(--pink)" }} data-cursor="go">build my plan →</Link></Magnetic>
            </div>
          </div>
          <div className="mono" style={{ fontSize: 13, opacity: 0.7, display: "grid", gap: 6 }}>
            <a href="#how">how it works</a><a href="#pricing">pricing</a><Link href="/login">log in</Link>
          </div>
        </div>
        <div className="display huge" style={{ marginTop: 60 }}>khao<span style={{ color: "var(--pink)" }}>.</span></div>
        <div className="row between wrapflex mono" style={{ fontSize: 12, opacity: 0.6, marginTop: 16 }}>
          <span>© {new Date().getFullYear()} khao. made with ghee & grit in india.</span>
          <span>not medical advice. talk to your doctor about health conditions.</span>
        </div>
      </div>
    </footer>
  );
}
