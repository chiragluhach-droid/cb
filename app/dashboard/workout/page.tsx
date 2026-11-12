"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowUpRight, Check, Dumbbell, Footprints, Home, TrendingUp, Trophy } from "lucide-react";
import { Bar, Card, CardTitle } from "@/components/app/ui";
import { dayKey, emptyDay, useSession } from "@/lib/demo-store";
import { parsePlan } from "@/lib/plans";
import { dayNames, sessionFor, weekSince, workoutDays } from "@/lib/workouts";

const mondayOf = (d: Date) => {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
};

export default function WorkoutPage() {
  const { user, data, update, updateDay } = useSession();
  const today = useMemo(() => new Date(), []);
  const monday = useMemo(() => mondayOf(today), [today]);
  const todayIdx = (today.getDay() + 6) % 7;
  const [sel, setSel] = useState(todayIdx);

  if (!user || !data?.profile) return null;
  const profile = data.profile;
  const plan = parsePlan(user.plan);

  if (plan.kind !== "meal-workout") {
    return (
      <div>
        <h1 className="text-[2.25rem] font-medium leading-[1] tracking-[-0.055em] text-ink sm:text-5xl">
          <span className="font-serif italic text-brand">Workouts.</span>
        </h1>
        <Card className="mt-6 overflow-hidden bg-forest text-canvas ring-0 sm:p-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sprout text-forest">
            <Dumbbell size={26} />
          </span>
          <h2 className="mt-6 max-w-md text-3xl font-medium tracking-[-0.05em] sm:text-4xl">Add training to your plan.</h2>
          <p className="mt-3 max-w-md text-canvas/60">
            Meal + Workout adds three sessions a week — at home or the gym — that get a little harder every week, logged right here.
          </p>
          <Link href="/#pricing" className="mt-8 inline-flex items-center gap-2 rounded-full bg-sprout px-6 py-3.5 text-sm font-bold text-forest">
            See Meal + Workout <ArrowUpRight size={15} />
          </Link>
        </Card>
      </div>
    );
  }

  const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + sel);
  const key = dayKey(date);
  const log = data.days[key] ?? emptyDay();
  const session = sessionFor(profile.workoutPlace, sel);
  const week = weekSince(data.startDate, date);
  const total = session ? session.exercises.reduce((s, e) => s + e.sets, 0) : 0;
  const done = session ? session.exercises.reduce((s, e) => s + Math.min(e.sets, log.sets[e.id] ?? 0), 0) : 0;
  const complete = total > 0 && done === total;
  const future = date.getTime() > today.getTime() && key !== dayKey(today);

  const tapSet = (id: string, n: number) =>
    updateDay(key, (d) => {
      const cur = d.sets[id] ?? 0;
      return { ...d, sets: { ...d.sets, [id]: cur === n + 1 ? n : n + 1 } };
    });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-stone">Week {week + 1} · 3 sessions</p>
          <h1 className="mt-1 text-[2.25rem] font-medium leading-[1] tracking-[-0.055em] text-ink sm:text-5xl">
            <span className="font-serif italic text-brand">Workouts.</span>
          </h1>
        </div>
        <div className="inline-flex w-fit rounded-full bg-white p-1 ring-1 ring-ink/[0.06]">
          {(["home", "gym"] as const).map((p) => (
            <button
              key={p}
              onClick={() => update((d) => ({ ...d, profile: d.profile ? { ...d.profile, workoutPlace: p } : d.profile }))}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${profile.workoutPlace === p ? "bg-ink text-canvas" : "text-ink/55"}`}
            >
              {p === "home" ? <Home size={13} /> : <Dumbbell size={13} />}
              {p === "home" ? "Home" : "Gym"}
            </button>
          ))}
        </div>
      </div>

      <LayoutGroup id="wk-days">
        <div className="hide-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-7 sm:px-0">
          {dayNames.map((n, i) => {
            const on = i === sel;
            const train = workoutDays.includes(i);
            const dk = dayKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
            const s = sessionFor(profile.workoutPlace, i);
            const fin = s && s.exercises.every((e) => (data.days[dk]?.sets[e.id] ?? 0) >= e.sets);
            return (
              <button
                key={n}
                onClick={() => setSel(i)}
                aria-pressed={on}
                className={`relative flex min-w-[3.75rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl py-3 transition-colors ${on ? "text-canvas" : "bg-white text-ink ring-1 ring-ink/[0.06]"}`}
              >
                {on && <motion.span layoutId="wk-pill" className="absolute inset-0 rounded-2xl bg-forest" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
                <span className={`relative text-[11px] font-semibold ${on ? "text-canvas/60" : "text-ink/45"}`}>{n}</span>
                <span
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full ${
                    fin ? "bg-brand text-white" : train ? (on ? "bg-sprout text-forest" : "bg-mint text-brand") : on ? "bg-canvas/10 text-canvas/60" : "bg-ink/[0.04] text-ink/35"
                  }`}
                >
                  {fin ? <Check size={14} strokeWidth={3} /> : train ? <Dumbbell size={13} /> : <Footprints size={13} />}
                </span>
                {i === todayIdx && <span className={`relative h-1 w-1 rounded-full ${on ? "bg-sprout" : "bg-brand"}`} />}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <>
        <motion.div key={`${sel}-${profile.workoutPlace}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-6">
          {session ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
              <div className="space-y-3 lg:col-span-8">
                <Card className="bg-forest text-canvas ring-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-canvas/50">
                        {dayNames[sel]} · {session.minutes} min · {session.focus}
                      </p>
                      <h2 className="mt-2 text-3xl font-medium tracking-[-0.05em]">{session.title}</h2>
                    </div>
                    <AnimatePresence>
                      {complete && (
                        <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sprout text-forest">
                          <Trophy size={22} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="mt-5">
                    <Bar value={done / total} className="bg-sprout" track="bg-canvas/10" />
                  </div>
                  <p className="mt-2 text-sm tabular-nums text-canvas/60">
                    {complete ? "Session complete — great work." : `${done} / ${total} sets`}
                    {future && " · upcoming"}
                  </p>
                </Card>

                {session.exercises.map((e, i) => {
                  const n = log.sets[e.id] ?? 0;
                  return (
                    <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="!p-4 sm:!p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-base font-semibold tracking-[-0.02em] text-ink">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/[0.05] text-[11px] font-bold text-ink/50">{i + 1}</span>
                              {e.name}
                            </p>
                            <p className="mt-0.5 pl-8 text-sm text-stone">
                              {e.sets} × {e.reps(week)} · {e.cue}
                            </p>
                          </div>
                          <div className="flex gap-2 pl-8 sm:pl-0">
                            {Array.from({ length: e.sets }).map((_, s) => {
                              const on = s < n;
                              return (
                                <button
                                  key={s}
                                  disabled={future}
                                  onClick={() => tapSet(e.id, s)}
                                  aria-label={`${e.name} set ${s + 1}`}
                                  aria-pressed={on}
                                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-all active:scale-90 disabled:opacity-40 ${
                                    on ? "bg-brand text-white" : "bg-ink/[0.05] text-ink/50 hover:bg-ink/10"
                                  }`}
                                >
                                  {on ? <Check size={16} strokeWidth={3} /> : s + 1}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
              <div className="space-y-4 lg:col-span-4">
                <Card>
                  <CardTitle action={<TrendingUp size={16} className="text-brand" />}>Progression</CardTitle>
                  <p className="text-sm leading-relaxed text-stone">
                    Every week adds a rep or a few seconds. You&apos;re on <b className="text-ink">week {week + 1}</b>
                    {week > 0 ? ` — that's +${Math.min(6, week)} reps versus week 1.` : " — the baseline. It only goes up from here."}
                  </p>
                </Card>
                <Card>
                  <CardTitle>Form first</CardTitle>
                  <p className="text-sm leading-relaxed text-stone">Stop any exercise that hurts and tell your coach — they&apos;ll swap it. Mild soreness the next day is normal.</p>
                  <Link href="/dashboard/coach" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deep">
                    Ask your coach <ArrowUpRight size={14} />
                  </Link>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:p-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-brand">
                <Footprints size={26} />
              </span>
              <div>
                <h2 className="text-2xl font-medium tracking-[-0.04em] text-ink">Rest & recover</h2>
                <p className="mt-1 text-stone">No session today. A 30–40 minute walk keeps your steps up and helps recovery.</p>
              </div>
            </Card>
          )}
        </motion.div>
      </>
    </div>
  );
}
