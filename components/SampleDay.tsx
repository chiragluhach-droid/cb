"use client";

import { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useSpring, useTransform } from "framer-motion";
import { AlertTriangle, Check, ChevronDown, RotateCcw, Utensils } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import { unsplash } from "@/lib/site";
import {
  Activity,
  Allergen,
  Condition,
  Diet,
  Goal,
  Inputs,
  Sex,
  defaultInputs,
  draftDay,
  servingsLabel,
} from "@/lib/engine";

const goals: { v: Goal; l: string }[] = [
  { v: "lose", l: "Lose fat" },
  { v: "tone", l: "Tone up" },
  { v: "build", l: "Build muscle" },
];
const diets: { v: Diet; l: string }[] = [
  { v: "veg", l: "Veg" },
  { v: "jain", l: "Jain" },
  { v: "egg", l: "Egg" },
  { v: "nonveg", l: "Non-veg" },
  { v: "vegan", l: "Vegan" },
];
const sexes: { v: Sex; l: string }[] = [
  { v: "female", l: "Female" },
  { v: "male", l: "Male" },
];
const activities: { v: Activity; l: string }[] = [
  { v: "sedentary", l: "Desk job" },
  { v: "light", l: "Light" },
  { v: "moderate", l: "Active" },
  { v: "very", l: "Very active" },
];
const conditions: { v: Condition; l: string }[] = [
  { v: "pcos", l: "PCOS" },
  { v: "thyroid", l: "Thyroid" },
  { v: "diabetes", l: "Diabetes" },
  { v: "bp", l: "Blood pressure" },
];
const allergens: { v: Allergen; l: string }[] = [
  { v: "dairy", l: "Dairy" },
  { v: "gluten", l: "Gluten" },
  { v: "nuts", l: "Nuts" },
  { v: "soy", l: "Soy" },
];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A number that eases to its new value. */
function Num({ value }: { value: number }) {
  const mv = useSpring(value, { stiffness: 140, damping: 22 });
  useEffect(() => {
    mv.set(value);
  }, [mv, value]);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("en-IN"));
  return <motion.span>{text}</motion.span>;
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-canvas/45">{children}</p>;
}

/** Single-choice pill group with a sliding highlight. */
function Segmented<T extends string>({ id, options, value, onChange }: { id: string; options: { v: T; l: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl bg-canvas/[0.06] p-1" role="radiogroup">
      {options.map((o) => {
        const on = o.v === value;
        return (
          <button
            key={o.v}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.v)}
            className={`relative flex-1 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${on ? "text-forest" : "text-canvas/70 hover:text-canvas"}`}
          >
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-xl bg-sprout" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{o.l}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Multi-choice chips. */
function Chips<T extends string>({ options, value, onChange }: { options: { v: T; l: string }[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.v);
        return (
          <button
            key={o.v}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o.v) : [...value, o.v])}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-300 ${
              on ? "bg-sprout text-forest" : "bg-canvas/[0.06] text-canvas/70 ring-1 ring-canvas/10 hover:text-canvas"
            }`}
          >
            <motion.span animate={{ width: on ? 14 : 0, opacity: on ? 1 : 0 }} className="inline-flex overflow-hidden">
              <Check size={14} strokeWidth={3} />
            </motion.span>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function Slider({ label, unit, min, max, value, onChange }: { label: string; unit: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between">
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-canvas/45">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-canvas">
          {value} <span className="text-canvas/45">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="evo-range"
        style={{ "--fill": `${fill}%` } as CSSProperties}
        aria-label={label}
      />
    </label>
  );
}

export default function SampleDay() {
  const [inp, setInp] = useState<Inputs>(defaultInputs);
  const [day, setDay] = useState(0);
  const [more, setMore] = useState(false);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setInp((p) => ({ ...p, [k]: v }));

  const draft = useMemo(() => draftDay(inp, day), [inp, day]);
  const { targets: t, meals, total, skipped } = draft;
  const proteinShort = t.protein - total.protein;
  const kcalOff = Math.abs(total.kcal - t.kcal) / t.kcal;
  const macroTotal = t.protein * 4 + t.carbs * 4 + t.fat * 9;

  return (
    <section id="sample" className="relative overflow-hidden bg-forest py-20 text-canvas lg:py-32">
      <div className="container-x">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-14">
          <div>
            <Reveal className="flex items-center gap-3">
              <span className="eyebrow text-canvas/50">02 — Live preview</span>
              <span className="-rotate-3 rounded-full bg-sprout px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-forest">Try it</span>
            </Reveal>
            <AnimatedHeading
              text="See a sample day / in seconds."
              className="mt-5 max-w-3xl font-sans text-[11vw] font-normal leading-[0.98] tracking-[-0.055em] text-canvas sm:text-6xl lg:text-7xl"
            />
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-pretty text-base leading-relaxed text-canvas/60">
              Runs on the same rules your coach starts from. Change anything and the day redraws — no AI, no waiting.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Controls */}
          <Reveal className="lg:col-span-5">
            <div className="space-y-6 rounded-[2rem] bg-forest-2 p-5 ring-1 ring-canvas/10 sm:p-7">
              <LayoutGroup>
                <div>
                  <Label>Goal</Label>
                  <Segmented id="goal" options={goals} value={inp.goal} onChange={(v) => set("goal", v)} />
                </div>
                <div>
                  <Label>Diet</Label>
                  <Segmented id="diet" options={diets} value={inp.diet} onChange={(v) => set("diet", v)} />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div>
                    <Label>Sex</Label>
                    <Segmented id="sex" options={sexes} value={inp.sex} onChange={(v) => set("sex", v)} />
                  </div>
                  <Slider label="Weight" unit="kg" min={40} max={130} value={inp.weight} onChange={(v) => set("weight", v)} />
                </div>

                <button
                  onClick={() => setMore((m) => !m)}
                  aria-expanded={more}
                  className="flex w-full items-center justify-between rounded-2xl bg-canvas/[0.05] px-4 py-3 text-sm font-semibold text-canvas/80 lg:hidden"
                >
                  Height, age, activity & health
                  <ChevronDown size={16} className={`transition-transform duration-300 ${more ? "rotate-180" : ""}`} />
                </button>

                <div className={`${more ? "block" : "hidden"} space-y-6 lg:block`}>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Slider label="Height" unit="cm" min={140} max={200} value={inp.height} onChange={(v) => set("height", v)} />
                    <Slider label="Age" unit="yrs" min={16} max={70} value={inp.age} onChange={(v) => set("age", v)} />
                  </div>
                  <div>
                    <Label>Activity</Label>
                    <Segmented id="act" options={activities} value={inp.activity} onChange={(v) => set("activity", v)} />
                  </div>
                  <div>
                    <Label>Health conditions</Label>
                    <Chips options={conditions} value={inp.conditions} onChange={(v) => set("conditions", v)} />
                  </div>
                  <div>
                    <Label>Allergies</Label>
                    <Chips options={allergens} value={inp.allergies} onChange={(v) => set("allergies", v)} />
                  </div>
                </div>
              </LayoutGroup>

              <button
                onClick={() => {
                  setInp(defaultInputs);
                  setDay(0);
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-canvas/50 transition-colors hover:text-canvas"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </Reveal>

          {/* Output */}
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="rounded-[2rem] bg-canvas p-4 text-ink sm:p-6">
              {/* Targets */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="col-span-2 rounded-2xl bg-forest p-4 text-canvas sm:col-span-1">
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-canvas/50">Daily target</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-sprout">
                    <Num value={t.kcal} />
                  </p>
                  <p className="text-xs text-canvas/50">kcal</p>
                </div>
                {[
                  { l: "Protein", v: t.protein, c: "bg-brand" },
                  { l: "Carbs", v: t.carbs, c: "bg-warn" },
                  { l: "Fat", v: t.fat, c: "bg-ink/30" },
                ].map((m) => (
                  <div key={m.l} className="rounded-2xl bg-ink/[0.04] p-4">
                    <p className="flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-ink/45">
                      <span className={`h-2 w-2 rounded-full ${m.c}`} />
                      {m.l}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.04em]">
                      <Num value={m.v} />
                      <span className="text-sm font-medium text-ink/40">g</span>
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-ink/5">
                <motion.span className="h-full bg-brand" animate={{ width: `${((t.protein * 4) / macroTotal) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                <motion.span className="h-full bg-warn" animate={{ width: `${((t.carbs * 4) / macroTotal) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                <motion.span className="h-full bg-ink/30" animate={{ width: `${((t.fat * 9) / macroTotal) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
              </div>

              {/* Days */}
              <div className="hide-scrollbar -mx-1 mt-5 flex gap-1 overflow-x-auto px-1">
                {days.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => setDay(i)}
                    aria-pressed={day === i}
                    className={`relative min-w-[3.25rem] flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${day === i ? "text-canvas" : "text-ink/55 hover:text-ink"}`}
                  >
                    {day === i && <motion.span layoutId="day-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <span className="relative">{d}</span>
                  </button>
                ))}
              </div>

              {/* Meals */}
              <ul className="mt-4 space-y-2">
                {meals.map((m) => (
                  <li key={m.slot} className="relative min-h-[5.25rem] overflow-hidden rounded-2xl bg-ink/[0.035] ring-1 ring-ink/5">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div
                        key={`${m.dish?.id ?? "none"}-${m.servings}`}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-3 p-3 sm:gap-4"
                      >
                        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-mint text-brand sm:h-16 sm:w-16">
                          {m.dish?.img ? (
                            <Image src={unsplash(m.dish.img, 200)} alt="" fill sizes="64px" className="object-cover" />
                          ) : (
                            <Utensils size={20} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-ink/40">
                            {m.label} · {m.time}
                          </p>
                          <p className="truncate text-sm font-semibold sm:text-base">{m.dish ? m.dish.name : "Your coach plans this one"}</p>
                          {m.dish && (
                            <p className="truncate text-xs text-ink/50">
                              {servingsLabel(m.servings)} · {m.dish.serving}
                            </p>
                          )}
                        </div>
                        {m.dish && (
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold tabular-nums">{m.kcal}</p>
                            <p className="text-[0.6875rem] font-semibold tabular-nums text-brand">{m.protein}g P</p>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </li>
                ))}
              </ul>

              {/* Coach checks */}
              <div className="mt-4 rounded-2xl bg-mint p-4">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-brand-deep">What your coach checks next</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${kcalOff <= 0.08 ? "bg-brand text-white" : "bg-warn text-ink"}`}>
                      {kcalOff <= 0.08 ? <Check size={11} strokeWidth={3.5} /> : <AlertTriangle size={11} strokeWidth={3} />}
                    </span>
                    <span>
                      Day total <b className="tabular-nums">{total.kcal.toLocaleString("en-IN")} kcal</b> vs target{" "}
                      <span className="tabular-nums">{t.kcal.toLocaleString("en-IN")}</span>
                      {kcalOff > 0.08 && " — portions get adjusted"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${proteinShort <= t.protein * 0.15 ? "bg-brand text-white" : "bg-warn text-ink"}`}>
                      {proteinShort <= t.protein * 0.15 ? <Check size={11} strokeWidth={3.5} /> : <AlertTriangle size={11} strokeWidth={3} />}
                    </span>
                    <span>
                      Protein <b className="tabular-nums">{total.protein}g</b> of {t.protein}g
                      {proteinShort > t.protein * 0.15 && ` — short by ${proteinShort}g, a protein side gets added`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                      <Check size={11} strokeWidth={3.5} />
                    </span>
                    <span>
                      {skipped.length === 0 ? (
                        "No dishes needed skipping for your answers"
                      ) : (
                        <>
                          Skipped <b>{skipped.length}</b> {skipped.length === 1 ? "dish" : "dishes"}:{" "}
                          <span className="text-ink/60">
                            {skipped
                              .slice(0, 3)
                              .map((s) => `${s.name.split(/[+,]/)[0].trim()} (${s.reason})`)
                              .join(", ")}
                            {skipped.length > 3 && ` +${skipped.length - 3} more`}
                          </span>
                        </>
                      )}
                    </span>
                  </li>
                </ul>
              </div>

              <p className="mt-4 px-1 text-xs leading-relaxed text-ink/45">
                A rough preview. Your real plan also uses your full questionnaire and food preferences, and is reviewed by your coach before you see it. Not medical advice.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
