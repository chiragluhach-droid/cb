"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, Send } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedHeading from "@/components/ui/AnimatedHeading";

type Topic = {
  id: string;
  label: string;
  client: string;
  rules: string[];
  swaps: { from: string; to: string; why: string }[];
};

const topics: Topic[] = [
  {
    id: "pcos",
    label: "PCOS",
    client: "Meera · Veg · PCOS",
    rules: ["Lower-GI carbs", "Protein at every meal", "Regular meal timing"],
    swaps: [
      { from: "White rice", to: "Millet khichdi", why: "high-GI" },
      { from: "Sweet lassi", to: "Chaas", why: "added sugar" },
    ],
  },
  {
    id: "thyroid",
    label: "Thyroid",
    client: "Simran · Egg · Thyroid",
    rules: ["No soy", "Steady meal timing", "Enough protein to protect muscle"],
    swaps: [
      { from: "Soya chunk pulao", to: "Paneer pulao", why: "soy" },
      { from: "Tofu bhurji", to: "Egg bhurji", why: "soy" },
    ],
  },
  {
    id: "diabetes",
    label: "Diabetes",
    client: "Dev · Non-veg · Pre-diabetic",
    rules: ["Lower-GI carbs", "Fibre and protein first", "No added sugar"],
    swaps: [
      { from: "Poha", to: "Moong dal chilla", why: "high-GI" },
      { from: "Chai + biscuits", to: "Roasted chana + chaas", why: "sugar & refined flour" },
    ],
  },
  {
    id: "bp",
    label: "Blood pressure",
    client: "Arjun · Veg · High BP",
    rules: ["Lower-salt cooking", "Papad & pickle kept occasional", "More potassium-rich veg"],
    swaps: [
      { from: "Masala papad", to: "Roasted makhana", why: "high salt" },
      { from: "Instant masala oats", to: "Homemade veg upma", why: "high salt" },
    ],
  },
  {
    id: "allergy",
    label: "Allergies",
    client: "Kabir · Veg · Nut allergy",
    rules: ["Allergens removed before the draft", "Coach double-checks every dish", "Safe swaps, same macros"],
    swaps: [
      { from: "Poha with peanuts", to: "Vegetable upma", why: "nuts" },
      { from: "Fruit + almonds", to: "Fruit + roasted chana", why: "nuts" },
    ],
  },
];

const checklist = ["Calories match the goal", "Protein target met", "Portions realistic for home cooking", "Client's dislikes respected"];

function Review({ topic }: { topic: Topic }) {
  const [fixed, setFixed] = useState<number[]>([]);
  const [ticked, setTicked] = useState<number[]>([]);
  const [sent, setSent] = useState(false);
  const ready = fixed.length === topic.swaps.length && ticked.length === checklist.length;
  const toggle = (i: number) => setTicked((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]));

  return (
    <div className="relative rounded-[2rem] bg-white p-5 shadow-[0_40px_80px_-50px_rgba(10,10,10,0.5)] ring-1 ring-ink/10 sm:p-7">
      <div className="flex items-start justify-between gap-3 border-b border-ink/10 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">Admin · plan review</p>
          <p className="mt-1 text-lg font-semibold tracking-[-0.02em]">{topic.client}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${sent ? "bg-brand text-white" : "bg-warn/20 text-[#8A5A00]"}`}>{sent ? "Sent" : "Draft"}</span>
      </div>

      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink/40">Risky foods flagged</p>
      <ul className="mt-2 space-y-2">
        {topic.swaps.map((s, i) => {
          const done = fixed.includes(i);
          return (
            <motion.li
              key={s.from}
              layout
              className={`flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2.5 transition-colors duration-300 ${done ? "bg-mint" : "bg-warn/10 ring-1 ring-warn/40"}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-brand text-white" : "bg-warn text-ink"}`}>
                {done ? <Check size={12} strokeWidth={3.5} /> : <AlertTriangle size={12} strokeWidth={3} />}
              </span>
              <span className={`text-sm font-semibold ${done ? "text-ink/40 line-through" : ""}`}>{s.from}</span>
              <span className="text-xs text-ink/45">({s.why})</span>
              {done ? (
                <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-deep">
                  <ArrowRight size={13} /> {s.to}
                </span>
              ) : (
                <button
                  onClick={() => setFixed((f) => [...f, i])}
                  className="ml-auto rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-canvas transition-colors hover:bg-brand"
                >
                  Swap for {s.to}
                </button>
              )}
            </motion.li>
          );
        })}
      </ul>

      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink/40">Checklist</p>
      <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {checklist.map((c, i) => {
          const on = ticked.includes(i);
          return (
            <li key={c}>
              <button
                onClick={() => toggle(i)}
                aria-pressed={on}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${on ? "bg-ink/[0.03] text-ink" : "text-ink/60 hover:bg-ink/[0.03]"}`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${on ? "border-brand bg-brand text-white" : "border-ink/20"}`}>
                  {on && <Check size={11} strokeWidth={3.5} />}
                </span>
                {c}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        onClick={() => ready && setSent(true)}
        disabled={!ready || sent}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-all duration-300 ${
          sent ? "bg-brand text-white" : ready ? "bg-ink text-canvas hover:bg-brand" : "cursor-not-allowed bg-ink/[0.06] text-ink/35"
        }`}
      >
        {sent ? (
          <>
            <Check size={16} strokeWidth={3} /> Approved & sent to client
          </>
        ) : (
          <>
            <Send size={15} /> {ready ? "Approve & send" : `Fix ${topic.swaps.length - fixed.length} flag${topic.swaps.length - fixed.length === 1 ? "" : "s"}, tick ${checklist.length - ticked.length} check${checklist.length - ticked.length === 1 ? "" : "s"}`}
          </>
        )}
      </button>

      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, scale: 2, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: -10 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 16 }}
            className="pointer-events-none absolute -right-2 -top-4 rounded-xl border-2 border-brand bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-brand shadow-xl sm:-right-5"
          >
            Coach approved
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Coach() {
  const [active, setActive] = useState(0);
  const topic = topics[active];

  return (
    <section id="coach" className="relative bg-ivory py-20 lg:py-32">
      <div className="container-x">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="eyebrow">04 — Your coach</span>
            </Reveal>
            <AnimatedHeading
              text="A real coach / signs off / every plan."
              className="mt-5 font-sans text-[11vw] font-normal leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl"
            />
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-stone">
                The draft does the maths. Your coach does the thinking — a checklist and risk warnings help them catch anything that doesn&apos;t suit you before it reaches your plate.
              </p>
            </Reveal>

            <Reveal delay={0.15} className="mt-8">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/45">Plans that respect</p>
              <LayoutGroup id="coach-topics">
                <div className="flex flex-wrap gap-2">
                  {topics.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => setActive(i)}
                      aria-pressed={active === i}
                      className={`relative rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${active === i ? "text-canvas" : "bg-ink/[0.05] text-ink/70 hover:bg-ink/10"}`}
                    >
                      {active === i && <motion.span layoutId="topic-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                      <span className="relative">{t.label}</span>
                    </button>
                  ))}
                </div>
              </LayoutGroup>

              <AnimatePresence mode="wait">
                <motion.ul
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="mt-5 space-y-2.5"
                >
                  {topic.rules.map((r) => (
                    <li key={r} className="flex items-center gap-3 text-base font-medium text-ink">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                      {r}
                    </li>
                  ))}
                </motion.ul>
              </AnimatePresence>
              <p className="mt-6 text-xs leading-relaxed text-ink/45">We coach food and training, not medicine. Always keep your doctor in the loop.</p>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="lg:col-span-7 lg:pt-10">
            <p className="mb-3 flex items-center gap-2 text-sm text-stone">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              Try the coach&apos;s side — fix the flags, tick the checks, approve.
            </p>
            {/* Keyed so each topic starts a fresh review */}
            <Review key={topic.id} topic={topic} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
