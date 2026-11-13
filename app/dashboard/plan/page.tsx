"use client";

import { useMemo, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { Check, Clock, ShieldCheck } from "lucide-react";
import { Card, CardTitle } from "@/components/app/ui";
import { DishThumb, MealRow } from "@/components/app/MealRow";
import { dayMeals } from "@/components/app/meals";
import { dayKey, useSession } from "@/lib/demo-store";
import { dayNames } from "@/lib/workouts";

const dietLabel = { veg: "Vegetarian", jain: "Jain", egg: "Eggetarian", nonveg: "Non-vegetarian", vegan: "Vegan" } as const;
const condLabel = { pcos: "PCOS", thyroid: "Thyroid", diabetes: "Diabetes", bp: "Blood pressure" } as const;

/** Monday of the week containing `d`. */
const mondayOf = (d: Date) => {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
};

export default function PlanPage() {
  const { data } = useSession();
  const today = useMemo(() => new Date(), []);
  const monday = useMemo(() => mondayOf(today), [today]);
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)), [monday]);
  const [sel, setSel] = useState((today.getDay() + 6) % 7);

  if (!data?.profile) return null;
  const profile = data.profile;
  const date = week[sel];
  const { targets: t, meals, skipped } = dayMeals(profile, date, data.days[dayKey(date)], data.planEdits);
  const dayTotal = meals.reduce((s, m) => ({ kcal: s.kcal + m.kcal, p: s.p + m.protein }), { kcal: 0, p: 0 });

  // What's on the menu this week, most frequent first.
  const weekDishes = new Map<string, { name: string; count: number; dish: (typeof meals)[number]["dish"] }>();
  week.forEach((d) =>
    dayMeals(profile, d, data.days[dayKey(d)], data.planEdits).meals.forEach((m) => {
      if (!m.dish) return;
      const cur = weekDishes.get(m.dish.id);
      weekDishes.set(m.dish.id, { name: m.dish.name, dish: m.dish, count: (cur?.count ?? 0) + 1 });
    })
  );
  const staples = [...weekDishes.values()].sort((a, b) => b.count - a.count);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-stone">This week</p>
          <h1 className="mt-1 text-[2.25rem] font-medium leading-[1] tracking-[-0.055em] text-ink sm:text-5xl">
            My <span className="font-serif italic text-brand">plan.</span>
          </h1>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold ${
            data.planStatus === "approved" ? "bg-mint text-brand-deep" : "bg-warn/15 text-[#8A5A00]"
          }`}
        >
          {data.planStatus === "approved" ? <ShieldCheck size={14} /> : <Clock size={14} />}
          {data.planStatus === "approved" ? "Coach-approved" : "Draft · in review"}
        </span>
      </div>

      {/* Week strip */}
      <LayoutGroup id="plan-week">
        <div className="hide-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-7 sm:px-0">
          {week.map((d, i) => {
            const on = i === sel;
            const isToday = dayKey(d) === dayKey(today);
            return (
              <button
                key={i}
                onClick={() => setSel(i)}
                aria-pressed={on}
                className={`relative flex min-w-[3.75rem] shrink-0 flex-col items-center rounded-2xl py-3 transition-colors ${on ? "text-canvas" : "bg-white text-ink ring-1 ring-ink/[0.06] hover:ring-ink/20"}`}
              >
                {on && <motion.span layoutId="plan-day" className="absolute inset-0 rounded-2xl bg-forest" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
                <span className={`relative text-[11px] font-semibold ${on ? "text-canvas/60" : "text-ink/45"}`}>{dayNames[i]}</span>
                <span className="relative mt-0.5 text-xl font-semibold tabular-nums tracking-[-0.03em]">{d.getDate()}</span>
                {isToday && <span className={`relative mt-1 h-1 w-1 rounded-full ${on ? "bg-sprout" : "bg-brand"}`} />}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-4 lg:col-span-8 lg:space-y-6">
          <Card>
            <CardTitle action={<span className="text-xs tabular-nums text-stone">{dayTotal.kcal.toLocaleString("en-IN")} kcal · {dayTotal.p}g protein</span>}>
              {date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
            </CardTitle>
            <motion.div key={sel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-2">
              {meals.map((m) => (
                <MealRow key={m.slot} meal={m} readOnly />
              ))}
            </motion.div>
            <p className="mt-4 text-xs text-stone">Tick off and swap meals from Today. Swaps you make show here too.</p>
          </Card>

          <Card>
            <CardTitle>On the menu this week</CardTitle>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {staples.map((s) => (
                <div key={s.name} className="flex items-center gap-3 rounded-2xl bg-[#F7F8F5] p-2 pr-3">
                  <DishThumb dish={s.dish} size="h-11 w-11" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{s.name}</span>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink/60">×{s.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4 lg:space-y-6">
          <Card className="bg-forest text-canvas ring-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-canvas/50">Daily targets</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums tracking-[-0.05em] text-sprout">{t.kcal.toLocaleString("en-IN")}</p>
            <p className="text-sm text-canvas/55">kcal per day</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                ["Protein", t.protein],
                ["Carbs", t.carbs],
                ["Fat", t.fat],
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-canvas/[0.06] py-3">
                  <p className="text-lg font-semibold tabular-nums">{v}g</p>
                  <p className="text-[11px] text-canvas/50">{l}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>Built around you</CardTitle>
            <ul className="space-y-2.5 text-sm">
              {[
                `${dietLabel[profile.diet]} dishes only`,
                ...profile.conditions.map((c) => `${condLabel[c]}-aware choices`),
                ...(profile.allergies.length ? [`No ${profile.allergies.join(", ")}`] : []),
                ...(profile.dislikes.trim() ? [`Avoiding: ${profile.dislikes.trim()}`] : []),
                `${skipped.length} dishes ruled out for you`,
              ].map((r) => (
                <li key={r} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    <Check size={11} strokeWidth={3.5} />
                  </span>
                  <span className="text-ink">{r}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
