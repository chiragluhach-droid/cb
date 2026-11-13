"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Beef,
  Check,
  Dumbbell,
  Egg,
  Flame,
  Home,
  Leaf,
  Loader2,
  Salad,
  Sparkles,
  Sprout,
  TrendingDown,
  Wheat,
} from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { SealLogo } from "@/components/brand/SealLogo";
import { ChoiceCard, Chips, RangeField, Segmented } from "@/components/app/ui";
import { Activity, Allergen, Condition, Diet, Goal, defaultInputs, targets } from "@/lib/engine";
import { Profile, dayKey, newId, useSession } from "@/lib/demo-store";
import { parsePlan } from "@/lib/plans";

const EASE = [0.16, 1, 0.3, 1] as const;

const goals: { v: Goal; t: string; b: string; icon: typeof Flame }[] = [
  { v: "lose", t: "Lose fat", b: "Steady fat loss without crash dieting", icon: TrendingDown },
  { v: "tone", t: "Tone up", b: "Lose a little, firm up, feel stronger", icon: Sparkles },
  { v: "build", t: "Build muscle", b: "Eat enough to grow — with protein at every meal", icon: Dumbbell },
];
const diets: { v: Diet; t: string; b: string; icon: typeof Flame }[] = [
  { v: "veg", t: "Vegetarian", b: "Dairy is fine, no eggs or meat", icon: Salad },
  { v: "jain", t: "Jain", b: "No onion, garlic or root vegetables", icon: Sprout },
  { v: "egg", t: "Eggetarian", b: "Vegetarian plus eggs", icon: Egg },
  { v: "nonveg", t: "Non-vegetarian", b: "Chicken, fish, eggs and everything else", icon: Beef },
  { v: "vegan", t: "Vegan", b: "No dairy, eggs or meat", icon: Leaf },
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
  { v: "diabetes", l: "Diabetes / pre-diabetes" },
  { v: "bp", l: "High blood pressure" },
];
const allergens: { v: Allergen; l: string }[] = [
  { v: "dairy", l: "Dairy" },
  { v: "gluten", l: "Gluten" },
  { v: "nuts", l: "Nuts" },
  { v: "soy", l: "Soy" },
];

const drafting = ["Working out your calories", "Setting your protein target", "Matching Indian dishes to your diet", "Removing allergens & risky foods", "Sending the draft to your coach"];

export default function Onboarding() {
  const router = useRouter();
  const { hydrated, user, data, update } = useSession();
  const withWorkout = user ? parsePlan(user.plan).kind === "meal-workout" : true;

  const [p, setP] = useState<Profile>({ ...defaultInputs, workoutPlace: "home", dislikes: "" });
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [phase, setPhase] = useState<"form" | "drafting" | "sent">("form");
  const [tick, setTick] = useState(0);

  // Guard + prefill from an earlier questionnaire.
  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login?mode=signup");
      return;
    }
    if (!loaded) {
      if (data?.profile) setP(data.profile);
      setLoaded(true);
    }
  }, [hydrated, user, data, loaded, router]);

  const steps = useMemo(() => ["About you", "Your goal", "What you eat", ...(withWorkout ? ["Training"] : []), "Review"], [withWorkout]);
  const last = steps.length - 1;
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const t = targets(p);

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    setPhase("drafting");
    setTick(0);
  };

  // Drafting animation, then save.
  useEffect(() => {
    if (phase !== "drafting") return;
    if (tick < drafting.length) {
      const id = setTimeout(() => setTick((n) => n + 1), 550);
      return () => clearTimeout(id);
    }
    update((d) => ({
      ...d,
      profile: p,
      planStatus: "review",
      weights: d.weights.length ? d.weights : [{ date: dayKey(), kg: p.weight }],
      messages: d.messages.length
        ? [...d.messages, { id: newId(), from: "coach", text: "Thanks for updating your answers — I'm reworking your plan now.", at: Date.now() }]
        : [
            {
              id: newId(),
              from: "coach",
              text: `Hi ${user?.name.split(" ")[0] ?? "there"}! I'm your Evowell coach. I've got your answers and I'm reviewing your first plan now — you'll see it in Today shortly. Ask me anything here.`,
              at: Date.now(),
            },
          ],
    }));
    const id = setTimeout(() => setPhase("sent"), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tick]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-canvas">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  if (phase !== "form") {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center bg-forest px-6 text-canvas">
        <div className="w-full max-w-md">
          <SealLogo tone="dark" alwaysWordmark />
          <h1 className="mt-10 text-4xl font-medium tracking-[-0.055em] sm:text-5xl">
            {phase === "sent" ? (
              <>
                Sent to your <span className="font-serif italic text-sprout">coach.</span>
              </>
            ) : (
              <>
                Drafting your <span className="font-serif italic text-sprout">plan…</span>
              </>
            )}
          </h1>
          <ul className="mt-8 space-y-3">
            {drafting.map((d, i) => {
              const done = i < tick;
              return (
                <motion.li
                  key={d}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: i <= tick ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 text-[0.9375rem]"
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-sprout text-forest" : "bg-canvas/10"}`}>
                    {done ? <Check size={13} strokeWidth={3.5} /> : i === tick ? <Loader2 size={13} className="animate-spin" /> : null}
                  </span>
                  {d}
                </motion.li>
              );
            })}
          </ul>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-canvas/[0.06] p-4 ring-1 ring-canvas/10">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-canvas/45">Daily target</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.05em] text-sprout">{t.kcal.toLocaleString("en-IN")}</p>
              <p className="text-xs text-canvas/50">kcal</p>
            </div>
            <div className="rounded-2xl bg-canvas/[0.06] p-4 ring-1 ring-canvas/10">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-canvas/45">Protein</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.05em]">{t.protein}g</p>
              <p className="text-xs text-canvas/50">per day</p>
            </div>
          </div>
          <AnimatePresence>
            {phase === "sent" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mt-8 text-sm leading-relaxed text-canvas/60">
                  Your coach reviews every plan before it goes live — usually within 24 hours. You can preview the draft in your dashboard now.
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-sprout py-4 text-sm font-bold text-forest transition-colors hover:bg-canvas"
                >
                  Open my dashboard <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-canvas">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-ink/[0.06] bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <SealLogo />
          <span className="text-sm font-semibold tabular-nums text-ink/50">
            {step + 1} / {steps.length}
          </span>
        </div>
        <div className="mx-auto flex max-w-3xl gap-1.5 px-5 pb-3 sm:px-8">
          {steps.map((s, i) => (
            <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.07]">
              <motion.span className="block h-full rounded-full bg-brand" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.4, ease: EASE }} />
            </span>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-36 pt-8 sm:px-8 sm:pt-12">
        <p className="text-sm font-semibold text-brand">{steps[step]}</p>
        <>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -30 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {steps[step] === "About you" && (
              <>
                <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">Let&apos;s start with you.</h1>
                <p className="mt-2 text-stone">Used to work out your calories and protein. Only your coach sees this.</p>
                <div className="mt-8 space-y-3">
                  <div className="rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
                    <p className="mb-3 text-sm font-semibold text-ink">Sex</p>
                    <Segmented id="ob-sex" options={[{ v: "female", l: "Female" }, { v: "male", l: "Male" }]} value={p.sex} onChange={(v) => set("sex", v)} />
                  </div>
                  <RangeField label="Age" unit="yrs" min={16} max={70} value={p.age} onChange={(v) => set("age", v)} />
                  <RangeField label="Height" unit="cm" min={140} max={200} value={p.height} onChange={(v) => set("height", v)} />
                  <RangeField label="Current weight" unit="kg" min={40} max={140} value={p.weight} onChange={(v) => set("weight", v)} />
                </div>
              </>
            )}

            {steps[step] === "Your goal" && (
              <>
                <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">What do you want?</h1>
                <p className="mt-2 text-stone">You can switch goals later — your coach will move you between stages.</p>
                <div className="mt-8 space-y-3">
                  {goals.map((g) => (
                    <ChoiceCard key={g.v} icon={g.icon} title={g.t} body={g.b} on={p.goal === g.v} onClick={() => set("goal", g.v)} />
                  ))}
                </div>
                <div className="mt-6 rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
                  <p className="text-sm font-semibold text-ink">How active is a normal day?</p>
                  <p className="mb-3 mt-0.5 text-xs text-stone">Not counting workouts.</p>
                  <Segmented id="ob-act" options={activities} value={p.activity} onChange={(v) => set("activity", v)} />
                </div>
              </>
            )}

            {steps[step] === "What you eat" && (
              <>
                <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">How do you eat?</h1>
                <p className="mt-2 text-stone">Your plan is built only from food that fits.</p>
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {diets.map((d) => (
                    <ChoiceCard key={d.v} icon={d.icon} title={d.t} body={d.b} on={p.diet === d.v} onClick={() => set("diet", d.v)} />
                  ))}
                </div>
                <div className="mt-6 space-y-6 rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-ink">Any health conditions?</p>
                    <Chips options={conditions} value={p.conditions} onChange={(v) => set("conditions", v)} />
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-semibold text-ink">Allergies or intolerances?</p>
                    <Chips options={allergens} value={p.allergies} onChange={(v) => set("allergies", v)} />
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-ink">Foods you dislike</span>
                    <input
                      value={p.dislikes}
                      onChange={(e) => set("dislikes", e.target.value)}
                      placeholder="e.g. karela, mushrooms"
                      className="h-12 w-full rounded-2xl bg-canvas px-4 text-[0.9375rem] outline-none ring-1 ring-ink/10 placeholder:text-ink/30 focus:ring-2 focus:ring-brand"
                    />
                  </label>
                </div>
                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink/45">
                  <Wheat size={14} className="mt-0.5 shrink-0" /> We coach food and training, not medicine. Keep your doctor in the loop about any condition.
                </p>
              </>
            )}

            {steps[step] === "Training" && (
              <>
                <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">Where will you train?</h1>
                <p className="mt-2 text-stone">Three sessions a week that get a little harder every week.</p>
                <div className="mt-8 space-y-3">
                  <ChoiceCard icon={Home} title="At home" body="A mat, and a pair of dumbbells or a backpack" on={p.workoutPlace === "home"} onClick={() => set("workoutPlace", "home")} />
                  <ChoiceCard icon={Dumbbell} title="At the gym" body="Barbells, machines and cardio equipment" on={p.workoutPlace === "gym"} onClick={() => set("workoutPlace", "gym")} />
                </div>
              </>
            )}

            {steps[step] === "Review" && (
              <>
                <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">Looks right?</h1>
                <p className="mt-2 text-stone">Your coach checks all of this before your plan goes live.</p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="col-span-2 rounded-[1.5rem] bg-forest p-5 text-canvas sm:col-span-1">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-canvas/50">Daily target</p>
                    <p className="mt-1 text-4xl font-semibold tabular-nums tracking-[-0.05em] text-sprout">{t.kcal.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-canvas/55">kcal · {t.protein}g protein · {t.carbs}g carbs · {t.fat}g fat</p>
                  </div>
                  <div className="col-span-2 rounded-[1.5rem] bg-white p-5 ring-1 ring-ink/10 sm:col-span-1">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-ink/45">Plan</p>
                    <p className="mt-1 text-lg font-semibold tracking-[-0.02em]">{withWorkout ? "Meal + Workout" : "Meal Plan"}</p>
                    <p className="text-sm text-stone">{parsePlan(user.plan).duration}-day programme</p>
                  </div>
                </div>
                <dl className="mt-3 divide-y divide-ink/[0.06] rounded-[1.5rem] bg-white px-5 ring-1 ring-ink/10">
                  {[
                    ["You", `${p.sex === "female" ? "Female" : "Male"} · ${p.age} yrs · ${p.height} cm · ${p.weight} kg`, 0],
                    ["Goal", `${goals.find((g) => g.v === p.goal)!.t} · ${activities.find((a) => a.v === p.activity)!.l}`, 1],
                    ["Diet", diets.find((d) => d.v === p.diet)!.t, 2],
                    ["Health", p.conditions.length ? p.conditions.map((c) => conditions.find((x) => x.v === c)!.l).join(", ") : "None", 2],
                    ["Allergies", p.allergies.length ? p.allergies.map((a) => allergens.find((x) => x.v === a)!.l).join(", ") : "None", 2],
                    ...(withWorkout ? [["Training", p.workoutPlace === "gym" ? "At the gym" : "At home", 3] as const] : []),
                  ].map(([k, v, s]) => (
                    <div key={k as string} className="flex items-start justify-between gap-4 py-3.5">
                      <dt className="text-sm text-stone">{k}</dt>
                      <dd className="flex items-center gap-3 text-right text-sm font-semibold text-ink">
                        {v}
                        <button type="button" onClick={() => go(s as number)} className="text-xs font-semibold text-brand-deep hover:underline">
                          Edit
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </motion.div>
        </>
      </main>

      {/* Bottom actions */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/[0.06] bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-ink transition-opacity disabled:opacity-0"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            type="button"
            onClick={() => (step === last ? submit() : go(step + 1))}
            className="group inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(22,163,74,0.8)] transition-colors hover:bg-brand-deep"
          >
            {step === last ? "Send to my coach" : "Continue"}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
