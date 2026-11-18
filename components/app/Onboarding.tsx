"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Beef,
  Eye,
  EyeOff,
  Briefcase,
  Check,
  ChefHat,
  Clock,
  Dumbbell,
  Egg,
  Flame,
  Footprints,
  GlassWater,
  Home,
  Leaf,
  Loader2,
  Mail,
  Moon,
  Salad,
  Sparkles,
  Sprout,
  Sun,
  TrendingDown,
  Truck,
  UsersRound,
  Wheat,
} from "lucide-react";
import { SealLogo } from "@/components/brand/SealLogo";
import { ChoiceCard, Chips, RangeField, Segmented } from "@/components/app/ui";
import { Activity, Allergen, Condition, Diet, Goal, defaultInputs, targets } from "@/lib/engine";
import { Profile, canUseApp, dayKey, newId, startAuth, useSession, verifyAuth } from "@/lib/demo-store";
import {
  Lifestyle,
  cookTimeOptions,
  cookingOptions,
  cuisineOptions,
  defaultLifestyle,
  experienceOptions,
  fmtClock,
  levelOptions,
  mealTimes,
  motivationOptions,
  sleepHours,
  sleepQualityOptions,
  trainTimeOptions,
  workDays,
} from "@/lib/lifestyle";
import { PlanId, defaultPlanKey, findOption, inr, lengthLabel, perMonth, planInfo, planKey, validKeyOr, visiblePlans } from "@/lib/plans";
import { useSettings } from "@/lib/settings";
import { coach } from "@/lib/site";

/*
 * The questionnaire. It now comes BEFORE payment: new clients answer first,
 * then pay, and only then does the coach see their answers.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const goals: { v: Goal; t: string; b: string; icon: typeof Flame }[] = [
  { v: "lose", t: "Lose fat", b: "Steady fat loss without crash dieting", icon: TrendingDown },
  { v: "tone", t: "Tone up", b: "Lose a little, firm up, feel stronger", icon: Sparkles },
  { v: "build", t: "Build muscle", b: "Eat enough to grow, with protein at every meal", icon: Dumbbell },
];
const diets: { v: Diet; t: string; b: string; icon: typeof Flame }[] = [
  { v: "nonveg", t: "I eat everything", b: "Meat, fish, eggs and dairy", icon: Beef },
  { v: "egg", t: "Vegetarian + eggs", b: "No meat or fish, eggs are fine", icon: Egg },
  { v: "veg", t: "Vegetarian", b: "Dairy is fine, no eggs or meat", icon: Salad },
  { v: "vegan", t: "Vegan", b: "No dairy, eggs or meat", icon: Leaf },
  { v: "jain", t: "Jain", b: "No onion, garlic or root vegetables", icon: Sprout },
];
const activities: { v: Activity; l: string }[] = [
  { v: "sedentary", l: "Mostly sitting" },
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
const workIcons = { desk: Briefcase, feet: Footprints, shift: Moon, home: Home } as const;
const cookIcons = { self: ChefHat, family: UsersRound, out: Truck } as const;

type StepId = "details" | "you" | "goal" | "day" | "food" | "habits" | "training" | "review" | "plan";
const stepLabel: Record<StepId, string> = {
  you: "About you",
  goal: "Your goal",
  day: "Your day",
  food: "Food & taste",
  habits: "Kitchen & habits",
  training: "Training",
  review: "Review",
  details: "Your details",
  plan: "Your plan",
};

/* Half-finished answers are kept on this device (per account), so leaving midway doesn't lose them. */
const DRAFT_KEY = "evo_questionnaire";
type Draft = { p: Profile; hasTarget: boolean; step: number; plan: PlanId; uid?: string };
const loadDraft = (): Draft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
};
const saveDraft = (d: Draft) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* private mode — fine */
  }
};
const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
};

const dials = [
  { code: "+1", label: "US / CA" },
  { code: "+44", label: "UK" },
  { code: "+61", label: "AU" },
  { code: "+971", label: "UAE" },
  { code: "+65", label: "SG" },
  { code: "+91", label: "IN" },
];
const okEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const okPhone = (dial: string, n: string) => (dial === "+91" ? /^[6-9]\d{9}$/.test(n) : /^\d{7,11}$/.test(n));

const field =
  "h-12 w-full rounded-2xl bg-canvas px-4 text-base outline-none ring-1 ring-ink/10 placeholder:text-ink/30 focus:ring-2 focus:ring-brand";

/* ───────────── Small pieces ───────────── */

function Panel({ title, hint, children }: { title?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
      {title && <p className="text-sm font-semibold text-ink">{title}</p>}
      {hint && <p className="mt-0.5 text-xs text-stone">{hint}</p>}
      <div className={title || hint ? "mt-3" : ""}>{children}</div>
    </div>
  );
}

/** A friendly live reaction to an answer. */
function Insight({ icon: Icon, children, tone = "mint" }: { icon: typeof Flame; children: ReactNode; tone?: "mint" | "warn" }) {
  return (
    <motion.p
      key={String(children)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm leading-snug ${tone === "warn" ? "bg-warn/15 text-[#7A4F00]" : "bg-mint text-brand-deep"}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </motion.p>
  );
}

function TimeField({ label, icon: Icon, value, onChange }: { label: string; icon: typeof Sun; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon size={16} className="text-brand" /> {label}
      </span>
      <input
        type="time"
        value={value}
        step={900}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="mt-3 w-full rounded-2xl bg-canvas px-4 py-3 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-ink outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-brand"
        aria-label={label}
      />
    </label>
  );
}

function WaterPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 12 }, (_, i) => {
          const on = i < value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(value === i + 1 ? i : i + 1)}
              aria-label={`${i + 1} glasses`}
              className={`flex h-10 w-8 items-end justify-center rounded-b-xl rounded-t-md border-2 transition-colors ${on ? "border-sky-400 bg-sky-100" : "border-ink/10 bg-canvas"}`}
            >
              <motion.span className="mb-0.5 block w-5 rounded-b-lg bg-sky-400" initial={false} animate={{ height: on ? 26 : 0 }} transition={{ duration: 0.25 }} />
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm font-semibold tabular-nums text-ink">
        {value} glass{value === 1 ? "" : "es"} a day
      </p>
    </div>
  );
}

/* ───────────── Questionnaire ───────────── */

export default function Onboarding() {
  const router = useRouter();
  const { hydrated, user, data, update, updateUser } = useSession();
  // The plan picked on the website (?plan=…); a signed-in client's own plan wins.
  const { plans } = useSettings();
  const [urlPlan, setUrlPlan] = useState<PlanId>(() => defaultPlanKey(plans));
  const planId: PlanId = user?.plan ?? urlPlan;
  const withWorkout = planInfo(plans, planId).workouts;
  const anonymous = hydrated && !user;
  // Plan picked at the end (before paying). Starts on the one from the website link.
  const [chosen, setChosen] = useState<PlanId | null>(null);
  const pick = validKeyOr(plans, chosen ?? planId);

  const [p, setP] = useState<Profile>({ ...defaultInputs, workoutPlace: "home", dislikes: "", life: { ...defaultLifestyle } });
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [phase, setPhase] = useState<"form" | "drafting" | "sent">("form");
  const [tick, setTick] = useState(0);
  const [hasTarget, setHasTarget] = useState(false);
  // Contact details + email code (only when there's no account yet).
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dial, setDial] = useState("+1");
  const [num, setNum] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fieldErr, setFieldErr] = useState<{ name?: string; email?: string; phone?: string; password?: string; code?: string }>({});
  const [formErr, setFormErr] = useState<{ text: string; login?: boolean } | null>(null);

  // Prefill: an earlier questionnaire on the account, or answers saved on this device.
  useEffect(() => {
    if (!hydrated || loaded) return;
    const q = new URLSearchParams(window.location.search).get("plan");
    const fromUrl = validKeyOr(plans, q);
    const draft = loadDraft();
    if (data?.profile) {
      const life = { ...defaultLifestyle, ...(data.profile.life ?? {}) };
      setP({ ...data.profile, life });
      setHasTarget(life.targetWeight > 0);
    } else if (draft && user && draft.uid === user.id) {
      setP({ ...draft.p, life: { ...defaultLifestyle, ...(draft.p.life ?? {}) } });
      setHasTarget(draft.hasTarget);
      setStep(Math.max(0, draft.step));
    }
    setUrlPlan(q ? fromUrl : validKeyOr(plans, draft?.plan));
    setLoaded(true);
  }, [hydrated, user, data, loaded, plans]);

  // Keep a copy on this device until the answers are saved to the account.
  useEffect(() => {
    if (loaded && user && !data?.profile && phase === "form") saveDraft({ p, hasTarget, step, plan: pick, uid: user.id });
  }, [loaded, user, data?.profile, p, hasTarget, step, pick, phase]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const paid = user ? canUseApp(user) : false;
  // The plan is chosen after the questions, so training is asked unless a paid plan has no workouts.
  const askTraining = withWorkout || !paid;
  const steps = useMemo<StepId[]>(
    () => [
      // Name, email, phone and the email code come first: the account exists from here on.
      ...(anonymous ? (["details"] as StepId[]) : []),
      "you",
      "goal",
      "day",
      "food",
      "habits",
      ...(askTraining ? (["training"] as StepId[]) : []),
      "review",
      ...(!paid ? (["plan"] as StepId[]) : []),
    ],
    [askTraining, anonymous, paid],
  );
  const last = steps.length - 1;
  const life = p.life ?? defaultLifestyle;
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const setLife = <K extends keyof Lifestyle>(k: K, v: Lifestyle[K]) => setP((x) => ({ ...x, life: { ...(x.life ?? defaultLifestyle), [k]: v } }));
  const t = targets(p);
  const times = mealTimes(life);
  const sleepH = sleepHours(life.wake, life.sleep);
  const first = user?.name.split(" ")[0] ?? "";

  const drafting = [
    "Working out your calories",
    "Setting your protein target",
    "Timing meals around your day",
    "Matching dishes to your diet and taste",
    "Removing allergens and risky foods",
    paid ? `Sending it to ${coach.name}` : "Saving your answers",
  ];

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finalProfile = (): Profile => ({ ...p, life: { ...life, targetWeight: hasTarget ? life.targetWeight : 0 } });

  const submit = () => {
    setPhase("drafting");
    setTick(0);
  };

  /* ── Contact details → email code → account (with the answers) ── */
  const sendCode = async () => {
    const er: typeof fieldErr = {};
    if (name.trim().length < 2) er.name = "Please enter your full name.";
    if (!okEmail(email)) er.email = "Enter a valid email address.";
    if (!okPhone(dial, num)) er.phone = "Enter a valid mobile number.";
    if (pw.length < 8) er.password = "Use at least 8 characters.";
    setFieldErr(er);
    setFormErr(null);
    if (Object.keys(er).length) return;
    setBusy(true);
    const res = await startAuth({ mode: "signup", name: name.trim(), email: email.trim(), phone: `${dial}${num}`, plan: planId });
    setBusy(false);
    if (!res.ok) {
      if (res.field) setFieldErr({ [res.field]: res.error });
      setFormErr({ text: res.error, login: res.error.includes("Log in") });
      if (res.wait) setResendIn(res.wait);
      return;
    }
    setDevCode(res.devCode ?? null);
    setCodeSent(true);
    setCode("");
    setResendIn(30);
  };

  const verify = async (c = code) => {
    if (!/^\d{6}$/.test(c) || busy) return;
    if (pw.length < 8) return setFieldErr({ password: "Use at least 8 characters." });
    setBusy(true);
    setFieldErr({});
    const res = await verifyAuth(email.trim(), c, { password: pw });
    if (!res.ok) {
      setBusy(false);
      setFieldErr(res.field === "password" ? { password: res.error } : { code: res.error });
      return;
    }
    // Signed in: on to the questions (the details step drops out of the list).
    setBusy(false);
    setDir(1);
    setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Drafting animation, then save.
  useEffect(() => {
    if (phase !== "drafting") return;
    if (tick < drafting.length) {
      const id = setTimeout(() => setTick((n) => n + 1), 550);
      return () => clearTimeout(id);
    }
    clearDraft();
    if (user && !paid && pick !== user.plan) updateUser({ plan: pick });
    const profile = finalProfile();
    update((d) => ({
      ...d,
      profile,
      weights: d.weights.length ? d.weights : [{ date: dayKey(), kg: p.weight }],
      // Paid clients go straight to the coach; unpaid answers wait for payment.
      ...(paid
        ? {
            planStatus: "review" as const,
            messages: d.messages.length
              ? [...d.messages, { id: newId(), from: "coach" as const, text: "Thanks for updating your answers — I'm reworking your plan now.", at: Date.now() }]
              : [
                  {
                    id: newId(),
                    from: "coach" as const,
                    text: `Hi ${first || "there"}! I'm your Evowell coach. I've got your answers and I'm building your first plan now. You'll see it in Today as soon as it's ready.`,
                    at: Date.now(),
                  },
                ],
          }
        : {}),
    }));
    const id = setTimeout(() => setPhase("sent"), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tick]);

  if (!hydrated || !loaded) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-canvas">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  /* ───────────── Drafting / done ───────────── */

  if (phase !== "form") {
    const done = phase === "sent";
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center bg-forest px-6 py-10 text-canvas">
        <div className="w-full max-w-md">
          <SealLogo tone="dark" alwaysWordmark />
          <h1 className="mt-10 text-4xl font-medium tracking-[-0.055em] sm:text-5xl">
            {!done ? (
              <>
                Building your <span className="font-serif italic text-sprout">plan…</span>
              </>
            ) : paid ? (
              <>
                Sent to your <span className="font-serif italic text-sprout">coach.</span>
              </>
            ) : (
              <>
                Your plan is <span className="font-serif italic text-sprout">ready to build.</span>
              </>
            )}
          </h1>
          <ul className="mt-8 space-y-3">
            {drafting.map((d, i) => {
              const ok = i < tick;
              return (
                <motion.li
                  key={d}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: i <= tick ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 text-[0.9375rem]"
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${ok ? "bg-sprout text-forest" : "bg-canvas/10"}`}>
                    {ok ? <Check size={13} strokeWidth={3.5} /> : i === tick ? <Loader2 size={13} className="animate-spin" /> : null}
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
            {done && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mt-3 rounded-2xl bg-canvas/[0.06] p-4 text-sm ring-1 ring-canvas/10">
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-canvas/45">Your meal times</p>
                  <p className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 tabular-nums text-canvas/80">
                    <span>Breakfast · {times.breakfast}</span>
                    <span>Lunch · {times.lunch}</span>
                    <span>Snack · {times.snack}</span>
                    <span>Dinner · {times.dinner}</span>
                  </p>
                </div>
                <p className="mt-6 text-sm leading-relaxed text-canvas/60">
                  {paid
                    ? `${coach.name} reviews every plan by hand, usually within 24 hours. It appears in your dashboard as soon as it's approved.`
                    : `One last step: payment. ${coach.name} then builds and checks your first week by hand, usually within 24 hours.`}
                </p>
                <button
                  onClick={() => router.push(paid ? "/dashboard" : `/checkout?plan=${pick}`)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-sprout py-4 text-sm font-bold text-forest transition-colors hover:bg-canvas"
                >
                  {paid ? "Open my dashboard" : "Continue to payment"} <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  /* ───────────── Form ───────────── */

  const id = steps[Math.min(step, last)];
  const goalDelta = hasTarget && life.targetWeight ? Math.round((p.weight - life.targetWeight) * 10) / 10 : 0;
  const weeks = goalDelta > 0 ? Math.ceil(goalDelta / 0.5) : goalDelta < 0 ? Math.ceil(-goalDelta / 0.25) : 0;

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
        <p className="text-sm font-semibold text-brand">
          {stepLabel[id]}
          {step === 0 && <span className="font-medium text-stone"> · about 3 minutes</span>}
        </p>
        <motion.div key={step} initial={{ opacity: 0, x: dir * 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: EASE }}>
          {id === "you" && (
            <>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">
                {first ? `Hi ${first}, ` : ""}
                <span className={first ? "font-serif italic text-brand" : ""}>{first ? "let's start with you." : "Let's start with you."}</span>
              </h1>
              <p className="mt-2 text-stone">We use this to work out your calories and protein. Only your coach sees it.</p>
              <div className="mt-8 space-y-3">
                <Panel title="Sex">
                  <Segmented id="ob-sex" options={[{ v: "female", l: "Female" }, { v: "male", l: "Male" }]} value={p.sex} onChange={(v) => set("sex", v)} />
                </Panel>
                <RangeField label="Age" unit="yrs" min={16} max={70} value={p.age} onChange={(v) => set("age", v)} />
                <RangeField label="Height" unit="cm" min={140} max={200} value={p.height} onChange={(v) => set("height", v)} />
                <RangeField label="Current weight" unit="kg" min={40} max={140} value={p.weight} onChange={(v) => set("weight", v)} />
              </div>
            </>
          )}

          {id === "goal" && (
            <>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">What do you want?</h1>
              <p className="mt-2 text-stone">You can change goals later. Your coach moves you between stages.</p>
              <div className="mt-8 space-y-3">
                {goals.map((g) => (
                  <ChoiceCard key={g.v} icon={g.icon} title={g.t} body={g.b} on={p.goal === g.v} onClick={() => set("goal", g.v)} />
                ))}
              </div>
              <div className="mt-4 space-y-3">
                <Panel title="Do you have a goal weight?" hint="Optional. It helps your coach pace your plan.">
                  <Segmented
                    id="ob-target"
                    options={[
                      { v: "no", l: "Not really" },
                      { v: "yes", l: "Yes" },
                    ]}
                    value={hasTarget ? "yes" : "no"}
                    onChange={(v) => {
                      setHasTarget(v === "yes");
                      if (v === "yes" && !life.targetWeight) setLife("targetWeight", p.goal === "build" ? p.weight + 4 : Math.max(40, p.weight - 6));
                    }}
                  />
                </Panel>
                {hasTarget && (
                  <>
                    <RangeField label="Goal weight" unit="kg" min={40} max={140} value={life.targetWeight || p.weight} onChange={(v) => setLife("targetWeight", v)} />
                    {goalDelta !== 0 && (
                      <Insight icon={Flame}>
                        {goalDelta > 0 ? `${goalDelta} kg to lose` : `${-goalDelta} kg to gain`}. At a healthy pace that&apos;s about <b>{weeks} weeks</b>. Your coach will keep you on track.
                      </Insight>
                    )}
                  </>
                )}
                <Panel title="What's driving you?" hint="Pick any that fit.">
                  <Chips options={motivationOptions} value={life.motivation} onChange={(v) => setLife("motivation", v)} />
                </Panel>
              </div>
            </>
          )}

          {id === "day" && (
            <>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">Walk us through your day.</h1>
              <p className="mt-2 text-stone">Your meals get timed around when you wake up and go to bed.</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <TimeField label="Wake up" icon={Sun} value={life.wake} onChange={(v) => setLife("wake", v)} />
                <TimeField label="Go to bed" icon={Moon} value={life.sleep} onChange={(v) => setLife("sleep", v)} />
              </div>
              <div className="mt-3 space-y-3">
                <Insight icon={Moon} tone={sleepH < 6.5 ? "warn" : "mint"}>
                  {sleepH < 6.5
                    ? `That's about ${sleepH} hours of sleep. Short sleep makes cravings harder, so your coach will factor it in.`
                    : `About ${sleepH} hours of sleep, nice. Here's when you'll eat: breakfast ${times.breakfast}, lunch ${times.lunch}, snack ${times.snack}, dinner ${times.dinner}.`}
                </Insight>
                <Panel title="How well do you sleep?">
                  <Segmented id="ob-sleepq" options={sleepQualityOptions} value={life.sleepQuality} onChange={(v) => setLife("sleepQuality", v)} />
                </Panel>
                <Panel title="Where do you spend most of your day?">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {workDays.map((w) => (
                      <ChoiceCard key={w.v} icon={workIcons[w.v]} title={w.l} body={w.b} on={life.work === w.v} onClick={() => setLife("work", w.v)} />
                    ))}
                  </div>
                </Panel>
                <Panel title="How active is a normal day?" hint="Not counting workouts.">
                  <Segmented id="ob-act" options={activities} value={p.activity} onChange={(v) => set("activity", v)} />
                </Panel>
                <Panel title="Stress lately?">
                  <Segmented id="ob-stress" options={levelOptions} value={life.stress} onChange={(v) => setLife("stress", v)} />
                </Panel>
              </div>
            </>
          )}

          {id === "food" && (
            <>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">How do you like to eat?</h1>
              <p className="mt-2 text-stone">Your plan is built only from food that fits you.</p>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {diets.map((d) => (
                  <ChoiceCard key={d.v} icon={d.icon} title={d.t} body={d.b} on={p.diet === d.v} onClick={() => set("diet", d.v)} />
                ))}
              </div>
              <div className="mt-4 space-y-3">
                <Panel title="Food you love" hint="Pick your favourite cuisines.">
                  <Chips options={cuisineOptions} value={life.cuisines} onChange={(v) => setLife("cuisines", v)} />
                </Panel>
                <Panel>
                  <div className="space-y-6">
                    <div>
                      <p className="mb-3 text-sm font-semibold text-ink">Any health conditions?</p>
                      <Chips options={conditions} value={p.conditions} onChange={(v) => set("conditions", v)} />
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-semibold text-ink">Allergies or intolerances?</p>
                      <Chips options={allergens} value={p.allergies} onChange={(v) => set("allergies", v)} />
                    </div>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-ink">Foods you won&apos;t eat</span>
                      <input value={p.dislikes} onChange={(e) => set("dislikes", e.target.value)} placeholder="e.g. mushrooms, tuna, olives" className={field} />
                    </label>
                  </div>
                </Panel>
                <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-ink/45">
                  <Wheat size={14} className="mt-0.5 shrink-0" /> We coach food and training, not medicine. Keep your doctor in the loop about any condition.
                </p>
              </div>
            </>
          )}

          {id === "habits" && (
            <>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">Your kitchen and habits.</h1>
              <p className="mt-2 text-stone">So your plan fits real life, not an ideal week.</p>
              <div className="mt-8 space-y-3">
                {cookingOptions.map((c) => (
                  <ChoiceCard key={c.v} icon={cookIcons[c.v]} title={c.l} body={c.b} on={life.cooking === c.v} onClick={() => setLife("cooking", c.v)} />
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {life.cooking !== "out" && (
                  <Panel title="Time for cooking a meal?">
                    <Segmented id="ob-cooktime" options={cookTimeOptions} value={life.cookTime} onChange={(v) => setLife("cookTime", v)} />
                  </Panel>
                )}
                <RangeField label="Meals out or ordered in" unit="/ week" min={0} max={14} value={life.eatingOut} onChange={(v) => setLife("eatingOut", v)} />
                {life.eatingOut >= 5 && <Insight icon={Sparkles}>No problem. Your coach will show you smart picks for eating out, not just home cooking.</Insight>}
                <Panel title="Water right now" hint="Tap the glasses you drink on a normal day.">
                  <WaterPicker value={life.water} onChange={(n) => setLife("water", n)} />
                </Panel>
                {life.water < 6 && (
                  <Insight icon={GlassWater} tone="warn">
                    We&apos;ll nudge you towards 8 glasses. Easy win for energy and hunger.
                  </Insight>
                )}
              </div>
            </>
          )}

          {id === "training" && (
            <>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">Let&apos;s plan your training.</h1>
              <p className="mt-2 text-stone">Three sessions a week that get a little harder every week.</p>
              <div className="mt-8 space-y-3">
                <ChoiceCard icon={Home} title="At home" body="A mat, and a pair of dumbbells or a backpack" on={p.workoutPlace === "home"} onClick={() => set("workoutPlace", "home")} />
                <ChoiceCard icon={Dumbbell} title="At the gym" body="Barbells, machines and cardio equipment" on={p.workoutPlace === "gym"} onClick={() => set("workoutPlace", "gym")} />
              </div>
              <div className="mt-4 space-y-3">
                <Panel title="Your experience">
                  <Segmented id="ob-exp" options={experienceOptions} value={life.experience} onChange={(v) => setLife("experience", v)} />
                </Panel>
                <Panel title="Best time to train">
                  <Segmented id="ob-train" options={trainTimeOptions} value={life.trainTime} onChange={(v) => setLife("trainTime", v)} />
                </Panel>
              </div>
            </>
          )}

          {id === "review" && (
            <>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">Looks right{first ? `, ${first}` : ""}?</h1>
              <p className="mt-2 text-stone">{coach.name} checks all of this before your plan goes live.</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="col-span-2 rounded-[1.5rem] bg-forest p-5 text-canvas sm:col-span-1">
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-canvas/50">Daily target</p>
                  <p className="mt-1 text-4xl font-semibold tabular-nums tracking-[-0.05em] text-sprout">{t.kcal.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-canvas/55">
                    kcal · {t.protein}g protein · {t.carbs}g carbs · {t.fat}g fat
                  </p>
                </div>
                <div className="col-span-2 rounded-[1.5rem] bg-white p-5 ring-1 ring-ink/10 sm:col-span-1">
                  <p className="flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-ink/45">
                    <Clock size={12} /> Meal times
                  </p>
                  <p className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-sm tabular-nums text-ink">
                    <span>Breakfast {times.breakfast}</span>
                    <span>Lunch {times.lunch}</span>
                    <span>Snack {times.snack}</span>
                    <span>Dinner {times.dinner}</span>
                  </p>
                </div>
              </div>
              <dl className="mt-3 divide-y divide-ink/[0.06] rounded-[1.5rem] bg-white px-5 ring-1 ring-ink/10">
                {(
                  [
                    ["You", `${p.sex === "female" ? "Female" : "Male"} · ${p.age} yrs · ${p.height} cm · ${p.weight} kg`, "you"],
                    ["Goal", `${goals.find((g) => g.v === p.goal)!.t}${hasTarget && life.targetWeight ? ` · to ${life.targetWeight} kg` : ""}`, "goal"],
                    ["Day", `Up ${fmtClock(life.wake)} · bed ${fmtClock(life.sleep)} · ${workDays.find((w) => w.v === life.work)!.l.toLowerCase()}`, "day"],
                    ["Diet", diets.find((d) => d.v === p.diet)!.t, "food"],
                    ["Cuisines", life.cuisines.length ? life.cuisines.map((c) => cuisineOptions.find((o) => o.v === c)!.l).join(", ") : "Open to anything", "food"],
                    ["Health", p.conditions.length ? p.conditions.map((c) => conditions.find((x) => x.v === c)!.l).join(", ") : "None", "food"],
                    ["Allergies", p.allergies.length ? p.allergies.map((a) => allergens.find((x) => x.v === a)!.l).join(", ") : "None", "food"],
                    ["Kitchen", `${cookingOptions.find((c) => c.v === life.cooking)!.l} · out ${life.eatingOut}× a week · ${life.water} glasses water`, "habits"],
                    ...(askTraining ? ([["Training", `${p.workoutPlace === "gym" ? "Gym" : "Home"} · ${experienceOptions.find((e) => e.v === life.experience)!.l.toLowerCase()} · ${life.trainTime}`, "training"]] as const) : []),
                  ] as const
                ).map(([k, v, s]) => (
                  <div key={k} className="flex items-start justify-between gap-4 py-3.5">
                    <dt className="text-sm text-stone">{k}</dt>
                    <dd className="flex items-center gap-3 text-right text-sm font-semibold text-ink">
                      {v}
                      <button type="button" onClick={() => go(steps.indexOf(s as StepId))} className="text-xs font-semibold text-brand-deep hover:underline">
                        Edit
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
              <label className="mt-3 block rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
                <span className="text-sm font-semibold text-ink">Anything else {coach.name} should know?</span>
                <span className="mt-0.5 block text-xs text-stone">Injuries, medications, a holiday coming up, foods you miss… optional.</span>
                <textarea
                  value={life.notes}
                  onChange={(e) => setLife("notes", e.target.value.slice(0, 600))}
                  rows={3}
                  placeholder="e.g. I travel for work twice a month"
                  className="mt-3 w-full resize-none rounded-2xl bg-canvas px-4 py-3 text-[0.9375rem] outline-none ring-1 ring-ink/10 placeholder:text-ink/30 focus:ring-2 focus:ring-brand"
                />
              </label>
            </>
          )}

          {id === "plan" && (
            <>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">
                Choose your <span className="font-serif italic text-brand">plan.</span>
              </h1>
              <p className="mt-2 text-stone">Pick a plan and a length. You pay once, and nothing renews.</p>
              <div className="mt-8 space-y-3" role="radiogroup" aria-label="Plan">
                {[...visiblePlans(plans), ...(findOption(plans, pick) && !findOption(plans, pick)!.plan.visible ? [findOption(plans, pick)!.plan] : [])].map((pl) => {
                  const on = findOption(plans, pick)?.plan.id === pl.id;
                  const sel = on ? findOption(plans, pick)!.option : null;
                  return (
                    <div
                      key={pl.id}
                      className={`rounded-[1.5rem] p-5 transition-colors duration-300 ${on ? "bg-forest text-canvas" : "bg-white text-ink ring-1 ring-ink/10"}`}
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => !on && setChosen(planKey(pl.id, [...pl.options].sort((a, b) => b.days - a.days)[0].days))}
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-xl font-semibold tracking-[-0.03em]">{pl.name}</span>
                            {pl.featured && <span className="rounded-full bg-sprout px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-forest">Most popular</span>}
                          </span>
                          {pl.tagline && <span className={`mt-1 block text-sm ${on ? "text-canvas/60" : "text-stone"}`}>{pl.tagline}</span>}
                        </span>
                        <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-sprout bg-sprout text-forest" : "border-ink/20"}`}>
                          {on && <Check size={12} strokeWidth={3.5} />}
                        </span>
                      </button>
                      {pl.features.length > 0 && (
                        <ul className={`mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2 ${on ? "text-canvas/75" : "text-ink/65"}`}>
                          {pl.features.slice(0, 4).map((f) => (
                            <li key={f} className="flex items-center gap-2">
                              <Check size={13} className={on ? "text-sprout" : "text-brand"} /> {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {pl.options.map((o) => {
                          const picked = on && sel?.days === o.days;
                          return (
                            <button
                              key={o.days}
                              type="button"
                              onClick={() => setChosen(planKey(pl.id, o.days))}
                              className={`rounded-2xl px-4 py-2.5 text-left transition-colors ${
                                picked ? "bg-sprout text-forest" : on ? "bg-canvas/[0.08] text-canvas ring-1 ring-canvas/15 hover:bg-canvas/15" : "bg-[#F4F5F1] text-ink hover:bg-mint"
                              }`}
                            >
                              <span className="block text-xs font-semibold opacity-70">{lengthLabel(o.days)}</span>
                              <span className="block text-lg font-semibold tabular-nums tracking-[-0.03em]">{inr(o.price)}</span>
                              {(o.badge || o.days > 31) && <span className="block text-[0.6875rem] font-semibold opacity-75">{o.badge || `${inr(perMonth(o))}/month`}</span>}
                            </button>
                          );
                        })}
                      </div>
                      {on && sel && sel.perks.length > 0 && <p className="mt-3 text-xs font-semibold text-sprout">Includes: {sel.perks.join(" · ")}</p>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {id === "details" && (
            <>
              <h1 className="mt-2 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">
                First, <span className="font-serif italic text-brand">your details.</span>
              </h1>
              <p className="mt-2 text-stone">So {coach.name} can reach you and your answers are saved as you go. We&apos;ll email you a code to confirm it&apos;s you.</p>
              <div className="mt-8 space-y-3">
                <label className="block rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
                  <span className="text-sm font-semibold text-ink">Full name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} disabled={codeSent} autoComplete="name" placeholder="Jane Smith" className={`${field} mt-2`} />
                  {fieldErr.name && <span className="mt-1.5 block text-xs font-medium text-red-600">{fieldErr.name}</span>}
                </label>
                <label className="block rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
                  <span className="text-sm font-semibold text-ink">Email</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={codeSent} autoComplete="email" inputMode="email" placeholder="you@example.com" className={`${field} mt-2`} />
                  {fieldErr.email && <span className="mt-1.5 block text-xs font-medium text-red-600">{fieldErr.email}</span>}
                </label>
                <label className="block rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
                  <span className="text-sm font-semibold text-ink">Create a password</span>
                  <span className="relative mt-2 block">
                    <input
                      type={showPw ? "text" : "password"}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className={`${field} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-ink/40 hover:text-ink"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                  {fieldErr.password ? (
                    <span className="mt-1.5 block text-xs font-medium text-red-600">{fieldErr.password}</span>
                  ) : (
                    <span className="mt-1.5 block text-xs text-ink/45">You&apos;ll log in with your email and this password.</span>
                  )}
                </label>
                <div className="rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
                  <span className="text-sm font-semibold text-ink">Mobile number</span>
                  <div className="mt-2 flex gap-2">
                    <select value={dial} onChange={(e) => setDial(e.target.value)} disabled={codeSent} aria-label="Country code" className="h-12 w-[6.75rem] shrink-0 rounded-2xl bg-canvas px-3 text-base outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-brand">
                      {dials.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.label} {d.code}
                        </option>
                      ))}
                    </select>
                    <input
                      value={num}
                      onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      disabled={codeSent}
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="Mobile number"
                      className="h-12 min-w-0 flex-1 rounded-2xl bg-canvas px-4 text-base outline-none ring-1 ring-ink/10 placeholder:text-ink/30 focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  {fieldErr.phone && <span className="mt-1.5 block text-xs font-medium text-red-600">{fieldErr.phone}</span>}
                </div>

                {formErr && (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {formErr.text}{" "}
                    {formErr.login && (
                      <Link href="/login?next=/onboarding" className="font-semibold underline underline-offset-2">
                        Log in instead
                      </Link>
                    )}
                  </p>
                )}

                {codeSent && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.5rem] bg-forest p-4 text-canvas sm:p-5">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Mail size={16} className="text-sprout" /> Enter the 6-digit code we sent to {email.trim().toLowerCase()}
                    </p>
                    <input
                      value={code}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setCode(v);
                        if (v.length === 6) verify(v);
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      placeholder="••••••"
                      className="mt-3 w-full rounded-2xl bg-canvas/10 px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-canvas outline-none ring-1 ring-canvas/15 placeholder:text-canvas/30 focus:ring-2 focus:ring-sprout"
                      aria-label="6-digit code"
                    />
                    {fieldErr.code && <p className="mt-2 text-sm font-medium text-warn">{fieldErr.code}</p>}
                    {devCode && (
                      <p className="mt-2 text-xs text-canvas/60">
                        Email isn&apos;t connected yet — your code is <b className="tracking-widest text-sprout">{devCode}</b>
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-canvas/60">
                      <span>Can&apos;t see it? Check spam or Promotions.</span>
                      <span className="flex gap-3">
                        <button type="button" onClick={() => setCodeSent(false)} className="font-semibold text-canvas/80 hover:text-canvas">
                          Change details
                        </button>
                        <button type="button" disabled={resendIn > 0 || busy} onClick={sendCode} className="font-semibold text-sprout disabled:text-canvas/40">
                          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                        </button>
                      </span>
                    </div>
                  </motion.div>
                )}
                <p className="px-1 text-xs leading-relaxed text-ink/45">
                  By continuing you agree to our{" "}
                  <Link href="/terms" className="underline underline-offset-2">
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline underline-offset-2">
                    privacy policy
                  </Link>
                  . Already have an account?{" "}
                  <Link href="/login?next=/onboarding" className="font-semibold text-brand-deep underline underline-offset-2">
                    Log in
                  </Link>
                </p>
              </div>
            </>
          )}
        </motion.div>
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
            disabled={busy || (id === "details" && codeSent && code.length < 6)}
            onClick={() => (id === "details" ? (codeSent ? verify() : sendCode()) : step === last ? submit() : go(step + 1))}
            className="group inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(22,163,74,0.8)] transition-colors hover:bg-brand-deep disabled:opacity-60"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {id === "details" ? (codeSent ? "Confirm & continue" : "Email me a code") : step === last ? (paid ? `Send to ${coach.name}` : "Build my plan") : "Continue"}
            {!busy && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
