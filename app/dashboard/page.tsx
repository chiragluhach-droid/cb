"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Clock, Droplet, Dumbbell, Footprints, MessageCircle, Minus, Plus, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { Bar, Card, CardTitle, Num, Ring } from "@/components/app/ui";
import { MealRow, SwapSheet } from "@/components/app/MealRow";
import { dayMeals, slotShare, stepGoal, swapOptions } from "@/components/app/meals";
import { planDay } from "@/components/app/Shell";
import { Slot } from "@/lib/engine";
import { dayKey, emptyDay, newId, useSession, weekday } from "@/lib/demo-store";
import { parsePlan } from "@/lib/plans";
import { sessionFor, weekSince } from "@/lib/workouts";
import { coach } from "@/lib/site";
import { CoachAvatar } from "@/components/app/CoachAvatar";

const greeting = (h: number) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

export default function TodayPage() {
  const { user, data, update, updateDay } = useSession();
  const [swapSlot, setSwapSlot] = useState<Slot | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!user || !data?.profile) return null;
  const profile = data.profile;
  const key = dayKey(now);
  const log = data.days[key] ?? emptyDay();
  const { targets: t, meals } = dayMeals(profile, now, log, data.planEdits);
  const eaten = meals.filter((m) => log.meals.includes(m.slot));
  const kcal = eaten.reduce((s, m) => s + m.kcal, 0);
  const protein = eaten.reduce((s, m) => s + m.protein, 0);
  const plan = parsePlan(user.plan);
  const { day, total } = planDay(data.startDate, plan.duration);
  const steps = stepGoal(profile.activity);
  const session = plan.kind === "meal-workout" ? sessionFor(profile.workoutPlace, weekday(now)) : null;
  const sessionSets = session ? session.exercises.reduce((s, e) => s + e.sets, 0) : 0;
  const sessionDone = session ? session.exercises.reduce((s, e) => s + Math.min(e.sets, log.sets[e.id] ?? 0), 0) : 0;
  const lastCoach = [...data.messages].reverse().find((m) => m.from === "coach");
  const todayWeight = data.weights.find((w) => w.date === key);
  const latestWeight = [...data.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const startWeight = [...data.weights].sort((a, b) => a.date.localeCompare(b.date))[0];
  const week = weekSince(data.startDate, now);

  const toggleMeal = (slot: Slot) =>
    updateDay(key, (d) => ({ ...d, meals: d.meals.includes(slot) ? d.meals.filter((s) => s !== slot) : [...d.meals, slot] }));

  const setWeight = (kg: number) =>
    update((d) => ({
      ...d,
      weights: [...d.weights.filter((w) => w.date !== key), { date: key, kg: Math.round(kg * 10) / 10 }],
    }));

  const approve = () =>
    update((d) => ({
      ...d,
      planStatus: "approved",
      messages: [
        ...d.messages,
        { id: newId(), from: "coach", text: "Your plan is approved ✓ I've kept your favourites and balanced protein across the day. Tick meals off as you go and message me anytime.", at: Date.now() },
      ],
    }));

  const swapMeal = swapSlot ? meals.find((m) => m.slot === swapSlot)! : null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-stone">{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 text-[2.25rem] font-medium leading-[1] tracking-[-0.055em] text-ink sm:text-5xl">
            {greeting(now.getHours())}, <span className="font-serif italic text-brand">{user.name.split(" ")[0]}.</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-ink ring-1 ring-ink/[0.06]">
            Day {day} of {total}
          </span>
          <span className="rounded-full bg-white px-3.5 py-2 text-xs font-semibold capitalize text-ink ring-1 ring-ink/[0.06]">
            {profile.goal === "lose" ? "Fat loss" : profile.goal === "tone" ? "Tone up" : "Muscle gain"} · week {week + 1}
          </span>
        </div>
      </div>

      {/* Plan status */}
      <AnimatePresence mode="wait">
        {data.planStatus !== "approved" ? (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 flex flex-col gap-4 rounded-[1.75rem] bg-forest p-5 text-canvas sm:flex-row sm:items-center sm:p-6"
          >
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-canvas/10">
              <Clock size={22} className="text-sprout" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-warn ring-2 ring-forest" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">{coach.name} is reviewing your plan</p>
              <p className="mt-0.5 text-sm text-canvas/60">You&apos;re seeing the draft below. Most plans are approved within 24 hours.</p>
            </div>
            <button onClick={approve} className="inline-flex items-center justify-center gap-2 rounded-full bg-canvas/10 px-4 py-2.5 text-xs font-semibold text-canvas ring-1 ring-canvas/15 transition-colors hover:bg-canvas/15">
              <Sparkles size={14} className="text-sprout" /> Simulate approval (demo)
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Left: nutrition + meals */}
        <div className="space-y-4 lg:col-span-8 lg:space-y-6">
          <Card>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Ring value={kcal / t.kcal} size={140} stroke={14}>
                <span className="text-3xl font-semibold tabular-nums tracking-[-0.05em] text-ink">
                  <Num value={Math.max(0, t.kcal - kcal)} />
                </span>
                <span className="text-[0.6875rem] font-medium text-stone">kcal left</span>
              </Ring>
              <div className="flex-1 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-ink/45">Eaten today</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.04em]">
                      <Num value={kcal} /> <span className="text-base font-medium text-ink/40">/ {t.kcal.toLocaleString("en-IN")} kcal</span>
                    </p>
                  </div>
                  {data.planStatus === "approved" && (
                    <span className="hidden items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-brand-deep sm:inline-flex">
                      <ShieldCheck size={13} /> Coach-approved
                    </span>
                  )}
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-semibold text-ink">Protein</span>
                    <span className="tabular-nums text-stone">
                      <b className="text-ink">{protein}</b> / {t.protein}g
                    </span>
                  </div>
                  <Bar value={protein / t.protein} />
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-semibold text-ink">Meals</span>
                    <span className="tabular-nums text-stone">
                      <b className="text-ink">{eaten.length}</b> / {meals.length}
                    </span>
                  </div>
                  <Bar value={eaten.length / meals.length} className="bg-forest" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle action={<span className="text-xs text-stone">Tap ✓ when eaten · ⇄ to swap</span>}>Today&apos;s meals</CardTitle>
            <div className="space-y-2">
              {meals.map((m) => (
                <MealRow key={m.slot} meal={m} done={log.meals.includes(m.slot)} onToggle={() => toggleMeal(m.slot)} onSwap={() => setSwapSlot(m.slot)} />
              ))}
            </div>
            <AnimatePresence>
              {eaten.length === meals.length && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <span className="mt-4 flex items-center gap-2 rounded-2xl bg-mint px-4 py-3 text-sm font-semibold text-brand-deep">
                    <Check size={16} strokeWidth={3} /> All meals done today. Nice work!
                  </span>
                </motion.p>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* Right: trackers */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:gap-6">
          <Card>
            <CardTitle action={<Droplet size={16} className="text-sky-500" />}>Water</CardTitle>
            <p className="text-2xl font-semibold tabular-nums tracking-[-0.04em]">
              {log.water} <span className="text-base font-medium text-ink/40">/ 8 glasses</span>
            </p>
            <div className="mt-4 grid grid-cols-8 gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateDay(key, (d) => ({ ...d, water: d.water === i + 1 ? i : i + 1 }))}
                  aria-label={`${i + 1} glasses`}
                  className={`h-10 rounded-lg transition-colors duration-300 ${i < log.water ? "bg-sky-400" : "bg-ink/[0.06] hover:bg-sky-100"}`}
                />
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle action={<Footprints size={16} className="text-brand" />}>Steps</CardTitle>
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-semibold tabular-nums tracking-[-0.04em]">
                <Num value={log.steps} /> <span className="text-base font-medium text-ink/40">/ {steps.toLocaleString("en-IN")}</span>
              </p>
              <div className="flex gap-1.5">
                <button onClick={() => updateDay(key, (d) => ({ ...d, steps: Math.max(0, d.steps - 500) }))} aria-label="Remove 500 steps" className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.06]">
                  <Minus size={14} />
                </button>
                <button onClick={() => updateDay(key, (d) => ({ ...d, steps: d.steps + 500 }))} aria-label="Add 500 steps" className="flex h-9 items-center justify-center gap-1 rounded-full bg-ink px-3 text-xs font-semibold text-canvas">
                  <Plus size={13} /> 500
                </button>
              </div>
            </div>
            <div className="mt-4">
              <Bar value={log.steps / steps} />
            </div>
          </Card>

          <Card>
            <CardTitle action={<Scale size={16} className="text-brand" />}>Weight</CardTitle>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums tracking-[-0.04em]">
                  {(todayWeight ?? latestWeight)?.kg.toFixed(1) ?? profile.weight.toFixed(1)} <span className="text-base font-medium text-ink/40">kg</span>
                </p>
                {startWeight && latestWeight && startWeight.date !== latestWeight.date && (
                  <p className="text-xs font-semibold text-brand-deep">
                    {(latestWeight.kg - startWeight.kg > 0 ? "+" : "") + (latestWeight.kg - startWeight.kg).toFixed(1)} kg since start
                  </p>
                )}
                {!todayWeight && <p className="text-xs text-stone">Not logged today</p>}
              </div>
              <div className="flex gap-1.5">
                {[-0.1, 0.1].map((d) => (
                  <button
                    key={d}
                    onClick={() => setWeight(((todayWeight ?? latestWeight)?.kg ?? profile.weight) + d)}
                    aria-label={d < 0 ? "Decrease weight" : "Increase weight"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${d < 0 ? "bg-ink/[0.06]" : "bg-ink text-canvas"}`}
                  >
                    {d < 0 ? <Minus size={14} /> : <Plus size={14} />}
                  </button>
                ))}
              </div>
            </div>
            {!todayWeight && (
              <button onClick={() => setWeight(latestWeight?.kg ?? profile.weight)} className="mt-4 w-full rounded-full bg-mint py-2.5 text-xs font-semibold text-brand-deep">
                Log today&apos;s weight
              </button>
            )}
          </Card>

          {plan.kind === "meal-workout" && (
            <Link href="/dashboard/workout" className="group block">
              <Card className="transition-shadow group-hover:shadow-[0_20px_40px_-28px_rgba(14,26,19,0.5)]">
                <CardTitle action={<Dumbbell size={16} className="text-brand" />}>Workout</CardTitle>
                {session ? (
                  <>
                    <p className="text-lg font-semibold tracking-[-0.02em]">{session.title}</p>
                    <p className="text-sm text-stone">
                      {session.exercises.length} exercises · {session.minutes} min · {profile.workoutPlace === "gym" ? "Gym" : "Home"}
                    </p>
                    <div className="mt-4">
                      <Bar value={sessionDone / sessionSets} />
                    </div>
                    <p className="mt-2 flex items-center justify-between text-xs text-stone">
                      {sessionDone} / {sessionSets} sets <ArrowRight size={14} className="text-ink transition-transform group-hover:translate-x-1" />
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold tracking-[-0.02em]">Rest day</p>
                    <p className="text-sm text-stone">A 30-minute walk counts. Next session: {weekday(now) < 4 ? (weekday(now) < 2 ? "Wednesday" : "Friday") : "Monday"}.</p>
                  </>
                )}
              </Card>
            </Link>
          )}

          <Link href="/dashboard/coach" className="group block">
            <Card className="bg-forest text-canvas ring-0 transition-shadow group-hover:shadow-[0_20px_40px_-24px_rgba(14,26,19,0.9)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <CoachAvatar className="h-8 w-8" online ring="ring-forest" />
                  <span className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-canvas/50">From {coach.name}</span>
                </span>
                <MessageCircle size={16} className="text-sprout" />
              </div>
              <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-canvas/85">{lastCoach?.text ?? "Message your coach any time."}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sprout">
                Reply <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </p>
            </Card>
          </Link>
        </div>
      </div>

      <SwapSheet
        open={!!swapMeal}
        title={swapMeal ? `${swapMeal.label} · now ${swapMeal.dish?.name ?? "—"}` : ""}
        options={swapMeal ? swapOptions(profile, swapMeal.slot, swapMeal.dish, t.kcal * slotShare(swapMeal.slot)) : []}
        canReset={!!swapMeal?.swapped}
        onClose={() => setSwapSlot(null)}
        onPick={(id) => {
          if (swapSlot) updateDay(key, (d) => ({ ...d, swaps: { ...d.swaps, [swapSlot]: id } }));
          setSwapSlot(null);
        }}
        onReset={() => {
          if (swapSlot)
            updateDay(key, (d) => {
              const swaps = { ...d.swaps };
              delete swaps[swapSlot];
              return { ...d, swaps };
            });
          setSwapSlot(null);
        }}
      />
    </div>
  );
}
