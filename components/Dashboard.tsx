"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Dumbbell, Footprints, Home, LineChart, MessageCircle, Minus, Plus, Send } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import { LogoMark } from "@/components/Logo";
import { CoachAvatar } from "@/components/app/CoachAvatar";
import { coach } from "@/lib/site";

type Tab = "today" | "workout" | "progress" | "coach";

const features: { id: Tab; icon: typeof Home; title: string; body: string }[] = [
  { id: "today", icon: Home, title: "Tick off meals", body: "Your day at a glance — meals, calories, protein, water and steps." },
  { id: "workout", icon: Dumbbell, title: "Do your workouts", body: "Home or gym sessions that get a little harder every week." },
  { id: "progress", icon: LineChart, title: "Log weight & photos", body: "See the trend, not the daily noise. Progress photos stay private." },
  { id: "coach", icon: MessageCircle, title: "Message your coach", body: "Ask about a swap or a tough week and get a real reply." },
];

/* ───────────── Today ───────────── */

const meals = [
  { t: "Breakfast", d: "Moong dal chilla + curd", k: 340, p: 22 },
  { t: "Lunch", d: "Dal, 2 roti, sabzi, salad", k: 520, p: 20 },
  { t: "Snack", d: "Roasted makhana + chai", k: 160, p: 5 },
  { t: "Dinner", d: "Paneer tikka, jeera rice, raita", k: 480, p: 28 },
];

function Today() {
  const [done, setDone] = useState<number[]>([0]);
  const [water, setWater] = useState(4);
  const kcal = done.reduce((s, i) => s + meals[i].k, 0);
  const protein = done.reduce((s, i) => s + meals[i].p, 0);
  const R = 34;
  const C = 2 * Math.PI * R;
  const target = 1500;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/5">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={R} stroke="#E6F4EA" strokeWidth="9" fill="none" />
            <motion.circle
              cx="40"
              cy="40"
              r={R}
              stroke="#16A34A"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={C}
              animate={{ strokeDashoffset: C * (1 - Math.min(1, kcal / target)) }}
              initial={false}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold tabular-nums">{Math.round((kcal / target) * 100)}%</span>
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">Calories</p>
          <p className="text-lg font-bold tabular-nums">
            {kcal.toLocaleString("en-IN")} <span className="text-sm font-medium text-ink/40">/ 1,500</span>
          </p>
          <p className="text-xs font-semibold tabular-nums text-brand">Protein {protein} / 95g</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {meals.map((m, i) => {
          const on = done.includes(i);
          return (
            <button
              key={m.t}
              onClick={() => setDone((d) => (on ? d.filter((x) => x !== i) : [...d, i]))}
              aria-pressed={on}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left ring-1 ring-ink/5 transition-transform active:scale-[0.98]"
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${on ? "border-brand bg-brand text-white" : "border-ink/15"}`}>
                <AnimatePresence>
                  {on && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                      <Check size={12} strokeWidth={3.5} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ink/40">{m.t}</span>
                <span className={`block truncate text-[13px] font-semibold transition-colors ${on ? "text-ink/45" : "text-ink"}`}>{m.d}</span>
              </span>
              <span className="text-xs tabular-nums text-ink/45">{m.k}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-3 ring-1 ring-ink/5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">Water</p>
          <p className="mt-1 text-sm font-bold tabular-nums">{water} / 8 glasses</p>
          <div className="mt-2 flex items-center gap-1.5">
            <button onClick={() => setWater((w) => Math.max(0, w - 1))} aria-label="Remove a glass" className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.06]">
              <Minus size={13} />
            </button>
            <div className="flex flex-1 gap-0.5">
              {Array.from({ length: 8 }).map((_, n) => (
                <span key={n} className={`h-5 flex-1 rounded-[4px] transition-colors duration-300 ${n < water ? "bg-sky-400" : "bg-ink/[0.07]"}`} />
              ))}
            </div>
            <button onClick={() => setWater((w) => Math.min(8, w + 1))} aria-label="Add a glass" className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-canvas">
              <Plus size={13} />
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-3 ring-1 ring-ink/5">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">
            <Footprints size={11} /> Steps
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums">6,820 / 8,000</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/[0.07]">
            <motion.span className="block h-full rounded-full bg-brand" initial={{ width: 0 }} whileInView={{ width: "85%" }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Workout ───────────── */

const exercises = [
  { n: "Goblet squat", d: "3 × 12 · backpack or dumbbell", sets: 3 },
  { n: "Glute bridge", d: "3 × 15 · pause at the top", sets: 3 },
  { n: "Reverse lunge", d: "3 × 10 each leg", sets: 3 },
  { n: "Plank", d: "3 × 40 sec", sets: 3 },
];

function Workout() {
  const [sets, setSets] = useState<number[]>([3, 1, 0, 0]);
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = sets.reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-forest p-4 text-canvas">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-canvas/50">Week 6 · Day 3 · Home</p>
        <p className="mt-1 text-lg font-bold tracking-[-0.02em]">Lower body strength</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas/10">
          <motion.span className="block h-full rounded-full bg-sprout" animate={{ width: `${(doneSets / totalSets) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        <p className="mt-2 text-xs tabular-nums text-canvas/60">
          {doneSets} / {totalSets} sets · +2 reps vs last week
        </p>
      </div>
      {exercises.map((e, i) => (
        <div key={e.n} className="rounded-2xl bg-white p-3 ring-1 ring-ink/5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{e.n}</p>
              <p className="truncate text-[11px] text-ink/50">{e.d}</p>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: e.sets }).map((_, n) => {
                const on = n < sets[i];
                return (
                  <button
                    key={n}
                    onClick={() => setSets((s) => s.map((v, j) => (j === i ? (on && n === v - 1 ? n : n + 1) : v)))}
                    aria-label={`${e.n} set ${n + 1}`}
                    aria-pressed={on}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-200 ${on ? "bg-brand text-white" : "bg-ink/[0.06] text-ink/50"}`}
                  >
                    {on ? <Check size={13} strokeWidth={3.5} /> : n + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────── Progress ───────────── */

const weights = [72.4, 71.6, 71.1, 70.2, 69.6, 68.9, 68.2];

function Progress() {
  const [today, setToday] = useState(68.2);
  const series = [...weights.slice(0, -1), today];
  const min = Math.min(...series) - 0.6;
  const max = Math.max(...series) + 0.6;
  const W = 280;
  const H = 110;
  const pts = series.map((w, i) => [(i / (series.length - 1)) * W, H - ((w - min) / (max - min)) * H] as const);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const change = (today - weights[0]).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">Weight · 6 weeks</p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-[-0.03em]">{today.toFixed(1)} kg</p>
          </div>
          <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold tabular-nums text-brand-deep">{change} kg</span>
        </div>
        <svg viewBox={`-6 -6 ${W + 12} ${H + 12}`} className="mt-3 h-28 w-full overflow-visible">
          <motion.path d={path} fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} />
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3} fill={i === pts.length - 1 ? "#16A34A" : "#fff"} stroke="#16A34A" strokeWidth="2" />
          ))}
        </svg>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-ink/[0.04] p-2">
          <span className="pl-1 text-xs font-semibold text-ink/60">Log today</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setToday((w) => Math.round((w - 0.1) * 10) / 10)} aria-label="Decrease weight" className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-ink/10">
              <Minus size={13} />
            </button>
            <span className="w-14 text-center text-sm font-bold tabular-nums">{today.toFixed(1)}</span>
            <button onClick={() => setToday((w) => Math.round((w + 0.1) * 10) / 10)} aria-label="Increase weight" className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-canvas">
              <Plus size={13} />
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["Week 1", "Week 6"].map((w, i) => (
          <div key={w} className={`flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl ${i ? "bg-mint text-brand-deep" : "bg-ink/[0.05] text-ink/40"}`}>
            <Camera size={20} />
            <span className="text-xs font-semibold">{w}</span>
            <span className="text-[10px] opacity-70">Private to you & coach</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Coach chat ───────────── */

type Msg = { from: "me" | "coach"; text: string };

const quick: { q: string; a: string }[] = [
  { q: "Can I swap tonight's dinner?", a: "Of course. Swap paneer tikka for egg bhurji with 1 roti — same protein. I've updated your plan ✓" },
  { q: "Wedding this weekend 😅", a: "Enjoy it! Eat a protein-heavy lunch, skip the second dessert, and walk after. We'll get straight back on track Monday." },
  { q: "Scale hasn't moved in 2 weeks", a: "That happens. I'm bumping your steps to 9,000 and adjusting dinner portions. New plan is in your dashboard." },
];

function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "coach", text: "Morning Aanya! Great week — you hit protein 6 of 7 days. Anything you need?" }]);
  const [typing, setTyping] = useState(false);
  const [used, setUsed] = useState<number[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    // Scroll only the chat list, never the page.
    const el = list.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const ask = (i: number) => {
    if (typing) return;
    setUsed((u) => [...u, i]);
    setMsgs((m) => [...m, { from: "me", text: quick[i].q }]);
    setTyping(true);
    timer.current = setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "coach", text: quick[i].a }]);
    }, 1300);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-ink/10 pb-3">
        <CoachAvatar className="h-9 w-9" />
        <div>
          <p className="text-sm font-semibold">{coach.name} · your coach</p>
          <p className="flex items-center gap-1 text-[11px] text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Replies within the day
          </p>
        </div>
      </div>
      <div ref={list} className="min-h-0 flex-1 space-y-2 overflow-y-auto py-3" data-lenis-prevent>
        {msgs.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${m.from === "me" ? "ml-auto rounded-br-md bg-ink text-canvas" : "rounded-bl-md bg-white text-ink ring-1 ring-ink/5"}`}
          >
            {m.text}
          </motion.div>
        ))}
        {typing && (
          <div className="flex w-14 gap-1 rounded-2xl rounded-bl-md bg-white px-3 py-3 ring-1 ring-ink/5">
            {[0, 1, 2].map((n) => (
              <motion.span key={n} className="h-1.5 w-1.5 rounded-full bg-ink/40" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: n * 0.12 }} />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-ink/10 pt-3">
        {quick.map((q, i) =>
          used.includes(i) ? null : (
            <button key={q.q} onClick={() => ask(i)} className="rounded-full bg-mint px-3 py-1.5 text-[11px] font-semibold text-brand-deep transition-colors hover:bg-brand hover:text-white">
              {q.q}
            </button>
          )
        )}
        {used.length === quick.length && (
          <span className="flex w-full items-center gap-2 rounded-full bg-white px-3 py-2 text-[12px] text-ink/40 ring-1 ring-ink/10">
            Type a message… <Send size={13} className="ml-auto" />
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────────── Section ───────────── */

const tabIcons: Record<Tab, typeof Home> = { today: Home, workout: Dumbbell, progress: LineChart, coach: MessageCircle };
const tabLabels: Record<Tab, string> = { today: "Today", workout: "Workout", progress: "Progress", coach: "Coach" };

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("today");
  const current = features.find((f) => f.id === tab)!;

  return (
    <section id="app" className="relative overflow-hidden bg-forest py-20 text-canvas lg:py-32">
      <div className="container-x">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <span className="eyebrow text-canvas/50">05 — Your dashboard</span>
            </Reveal>
            <AnimatedHeading
              text="Everything for / the day, in / one place."
              className="mt-5 font-sans text-[11vw] font-normal leading-[0.98] tracking-[-0.055em] text-canvas sm:text-6xl lg:text-7xl"
            />
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-canvas/60">
                Meals, water, steps, weight, photos, workouts and your coach. Go on — tap around the phone.
              </p>
            </Reveal>

            <Reveal delay={0.15} className="mt-8 hidden lg:block">
              <ul className="border-t border-canvas/10">
                {features.map((f) => {
                  const on = f.id === tab;
                  const Icon = f.icon;
                  return (
                    <li key={f.id} className="border-b border-canvas/10">
                      <button onClick={() => setTab(f.id)} onMouseEnter={() => setTab(f.id)} className="group flex w-full items-center gap-5 py-5 text-left">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${on ? "-rotate-6 bg-sprout text-forest" : "text-canvas/40 ring-1 ring-canvas/15"}`}>
                          <Icon size={18} />
                        </span>
                        <motion.span animate={{ x: on ? 10 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="min-w-0">
                          <span className={`block text-2xl font-semibold tracking-[-0.03em] transition-colors ${on ? "text-canvas" : "text-canvas/40 group-hover:text-canvas/70"}`}>{f.title}</span>
                          <span className={`block overflow-hidden text-sm text-canvas/55 transition-all duration-300 ${on ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}>{f.body}</span>
                        </motion.span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="lg:col-span-6">
            <div className="relative mx-auto w-full max-w-[350px]">
              <div aria-hidden className="absolute -inset-10 -z-0 rounded-full bg-brand/25 blur-3xl" />
              <div className="relative rounded-[2.75rem] bg-[#1F2E25] p-2.5 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)]">
                <div className="flex h-[640px] flex-col overflow-hidden rounded-[2.25rem] bg-[#F4F5F2] text-ink">
                  <div className="flex items-center justify-between px-5 pb-2 pt-4">
                    <div className="flex items-center gap-2">
                      <LogoMark className="h-6 w-6" />
                      <span className="text-sm font-bold tracking-[-0.03em]">{tabLabels[tab]}</span>
                    </div>
                    <span className="text-[11px] text-ink/45">Week 6</span>
                  </div>
                  <div className="relative flex-1 overflow-y-auto px-4 pb-3" data-lenis-prevent>
                    <>
                      <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full"
                      >
                        {tab === "today" && <Today />}
                        {tab === "workout" && <Workout />}
                        {tab === "progress" && <Progress />}
                        {tab === "coach" && <Chat />}
                      </motion.div>
                    </>
                  </div>
                  <nav className="grid grid-cols-4 border-t border-ink/10 bg-white px-2 pb-4 pt-2" aria-label="App tabs">
                    {(Object.keys(tabIcons) as Tab[]).map((t) => {
                      const Icon = tabIcons[t];
                      const on = t === tab;
                      return (
                        <button key={t} onClick={() => setTab(t)} aria-pressed={on} className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold transition-colors ${on ? "text-brand" : "text-ink/40"}`}>
                          {on && <motion.span layoutId="app-tab" className="absolute inset-x-3 -top-2 h-0.5 rounded-full bg-brand" />}
                          <Icon size={18} />
                          {tabLabels[t]}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>
            <>
              <motion.p
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-auto mt-6 max-w-[350px] text-center text-sm text-canvas/60 lg:hidden"
              >
                <b className="text-canvas">{current.title}.</b> {current.body}
              </motion.p>
            </>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
