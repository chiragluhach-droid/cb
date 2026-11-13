/*
 * ADMIN (COACH) DATA LAYER — DEMO.
 *
 * Reads and writes the same browser store as the client dashboard
 * (lib/demo-store.ts), so when the coach approves a plan, edits a meal or
 * replies, the client sees it on their dashboard in this browser.
 *
 * Sample clients are added the first time the panel opens, so there is
 * something to review. They're clearly fake (example.com emails).
 */

import { useMemo } from "react";
import { DEMO_OTP, DayLog, Message, Profile, User, UserData, dayKey, newData, newId, readState, useDemo, useHydrated, writeState } from "@/lib/demo-store";
import { Slot, clash, dietOk, dishes, dislikeWords, slotSplit } from "@/lib/engine";

export { dislikeWords };
import { PlanId, parsePlan } from "@/lib/plans";
import { editKey, planWeekday, stepGoal } from "@/components/app/meals";

export const ADMIN_EMAIL = "coach@evowell.demo";
export const ADMIN_CODE = DEMO_OTP;

/* ───────────── Writes ───────────── */

const setData = (id: string, fn: (d: UserData) => UserData) => {
  const s = readState();
  writeState({ ...s, data: { ...s.data, [id]: fn(s.data[id] ?? newData()) } });
};

const coachMsg = (text: string): Message => ({ id: newId(), from: "coach", text, at: Date.now() });

export function adminSignIn(email: string, code: string) {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL || code.trim() !== ADMIN_CODE) return false;
  writeState({ ...readState(), admin: { signedIn: true } });
  return true;
}

export function adminSignOut() {
  writeState({ ...readState(), admin: { signedIn: false } });
}

/** Coach edit for one meal of the weekly plan. `dishId: null` restores the draft. */
export function setPlanEdit(id: string, day: number, slot: Slot, dishId: string | null) {
  setData(id, (d) => {
    const edits = { ...(d.planEdits ?? {}) };
    if (dishId) edits[editKey(day, slot)] = dishId;
    else delete edits[editKey(day, slot)];
    return { ...d, planEdits: edits };
  });
}

export function approvePlan(id: string, note: string) {
  setData(id, (d) => ({
    ...d,
    planStatus: "approved",
    approvedAt: Date.now(),
    messages: [...d.messages, coachMsg(note.trim() || "Your plan is approved ✓ Tick meals off as you go and message me anytime.")],
  }));
}

export function coachSend(id: string, text: string) {
  if (!text.trim()) return;
  setData(id, (d) => ({ ...d, messages: [...d.messages, coachMsg(text.trim())], coachReadAt: Date.now() }));
}

export function markRead(id: string) {
  setData(id, (d) => ({ ...d, coachReadAt: Date.now() }));
}

/** Put an AI-drafted week into the plan, keeping the previous version for undo. */
export function applyAiDraft(id: string, picks: Record<string, string>, meta: { model: string; note: string; instruction?: string }) {
  setData(id, (d) => ({
    ...d,
    planEdits: { ...picks },
    aiDraft: { at: Date.now(), ...meta, picks, prevEdits: d.aiDraft ? d.aiDraft.prevEdits : { ...(d.planEdits ?? {}) } },
  }));
}

/** Go back to the plan as it was before the first AI draft. */
export function undoAiDraft(id: string) {
  setData(id, (d) => ({ ...d, planEdits: { ...(d.aiDraft?.prevEdits ?? {}) }, aiDraft: undefined }));
}

export function saveCoachNotes(id: string, notes: string) {
  setData(id, (d) => ({ ...d, coachNotes: notes }));
}

/* ───────────── Plan review checks ───────────── */

export type Flag = { day: number; slot: Slot; dish: string; reason: string };

/** Check the 7-day plan: risky foods, dislikes, and days off target. */
export function reviewPlan(profile: Profile, edits?: Record<string, string>) {
  const words = dislikeWords(profile);
  const days = Array.from({ length: 7 }, (_, day) => planWeekday(profile, day, edits));
  const flags: Flag[] = [];
  days.forEach((d, day) =>
    d.meals.forEach((m) => {
      if (!m.dish) {
        flags.push({ day, slot: m.slot, dish: "No dish", reason: "nothing fits this meal" });
        return;
      }
      const why = !dietOk(m.dish, profile.diet) ? `not ${profile.diet === "nonveg" ? "suitable" : profile.diet}` : clash(m.dish, profile);
      if (why) flags.push({ day, slot: m.slot, dish: m.dish.name, reason: why });
      const hate = words.find((w) => m.dish!.name.toLowerCase().includes(w));
      if (hate) flags.push({ day, slot: m.slot, dish: m.dish.name, reason: `client dislikes ${hate}` });
    })
  );
  const totals = days.map((d) => {
    const kcal = d.meals.reduce((s, m) => s + m.kcal, 0);
    const protein = d.meals.reduce((s, m) => s + m.protein, 0);
    return { kcal, protein, kcalOk: Math.abs(kcal - d.targets.kcal) / d.targets.kcal <= 0.12, proteinOk: protein >= d.targets.protein * 0.85 };
  });
  return { days, flags, totals, targets: days[0].targets };
}

/** Every dish the coach could put in a slot, with a warning where it doesn't suit. */
export function dishChoices(profile: Profile, slot: Slot) {
  const words = dislikeWords(profile);
  return dishes
    .filter((d) => d.slots.includes(slot) && dietOk(d, profile.diet))
    .map((d) => ({ dish: d, warning: clash(d, profile) ?? (words.find((w) => d.name.toLowerCase().includes(w)) ? "client dislikes this" : null) }))
    .sort((a, b) => Number(!!a.warning) - Number(!!b.warning) || b.dish.protein / b.dish.kcal - a.dish.protein / a.dish.kcal);
}

/* ───────────── Derived client view ───────────── */

export type ClientStatus = "onboarding" | "review" | "active" | "attention";

export type ClientRow = {
  user: User;
  data: UserData;
  status: ClientStatus;
  reasons: string[];
  /** Share of meals ticked over the last 7 days (0–1). */
  adherence: number;
  lastActive: string | null;
  start: number | null;
  current: number | null;
  change: number | null;
  unread: number;
  lastMessage: Message | null;
  day: number;
  total: number;
  flags: number;
};

const DAY = 86400000;
const daysAgoKey = (n: number) => dayKey(new Date(Date.now() - n * DAY));
const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / DAY);

function toRow(user: User, data: UserData): ClientRow {
  const plan = parsePlan(user.plan);
  const startT = new Date(`${data.startDate}T00:00:00`).getTime();
  const day = Math.max(1, Math.min(plan.duration, Math.floor((Date.now() - startT) / DAY) + 1));

  const last7 = Array.from({ length: 7 }, (_, i) => data.days[daysAgoKey(i)]);
  const daysOnPlan = Math.min(7, day);
  const ticked = last7.slice(0, daysOnPlan).reduce((s, d) => s + (d?.meals.length ?? 0), 0);
  const adherence = data.planStatus === "approved" ? ticked / (daysOnPlan * slotSplit.length) : 0;

  const active = Object.entries(data.days)
    .filter(([, d]) => d.meals.length || d.water || d.steps)
    .map(([k]) => k)
    .sort();
  const lastActive = active.at(-1) ?? null;

  const w = [...data.weights].sort((a, b) => a.date.localeCompare(b.date));
  const start = w[0]?.kg ?? null;
  const current = w.at(-1)?.kg ?? null;
  const change = start !== null && current !== null ? Math.round((current - start) * 10) / 10 : null;

  const unreadMsgs = data.messages.filter((m) => m.from === "me" && m.at > (data.coachReadAt ?? 0));
  const flags = data.profile && data.planStatus !== "approved" ? reviewPlan(data.profile, data.planEdits).flags.length : 0;

  const reasons: string[] = [];
  if (data.profile && data.planStatus === "approved") {
    const today = dayKey();
    if (!lastActive || daysBetween(lastActive, today) >= 3) reasons.push(lastActive ? `No logs for ${daysBetween(lastActive, today)} days` : "Hasn't logged anything yet");
    const recent = w.filter((x) => daysBetween(x.date, today) <= 14);
    if (recent.length >= 3 && data.profile.goal !== "build") {
      const drop = recent[0].kg - recent.at(-1)!.kg;
      if (drop < 0.3) reasons.push("Weight flat for 2 weeks");
    }
    if (day > 3 && adherence < 0.6) reasons.push(`Only ${Math.round(adherence * 100)}% of meals ticked this week`);
  }

  const status: ClientStatus = !data.profile ? "onboarding" : data.planStatus !== "approved" ? "review" : reasons.length ? "attention" : "active";

  return {
    user,
    data,
    status,
    reasons,
    adherence,
    lastActive,
    start,
    current,
    change,
    unread: unreadMsgs.length,
    lastMessage: data.messages.at(-1) ?? null,
    day,
    total: plan.duration,
    flags,
  };
}

/** Admin session + every client, newest first. */
export function useAdmin() {
  const hydrated = useHydrated();
  const s = useDemo();
  const clients = useMemo(
    () => s.users.map((u) => toRow(u, s.data[u.id] ?? newData())).sort((a, b) => b.user.createdAt - a.user.createdAt),
    [s]
  );
  return { hydrated, signedIn: !!s.admin?.signedIn, seeded: !!s.seeded, clients };
}

/* ───────────── Sample clients ───────────── */

/** Small seeded random generator so sample data looks the same every time. */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

type Seed = {
  name: string;
  plan: PlanId;
  startedDaysAgo: number;
  status: UserData["planStatus"];
  profile?: Profile;
  weight?: { to: number; flatLastDays?: number };
  adherence?: number;
  idleDays?: number;
  edits?: Record<string, string>;
  /** [from, text, hours ago] */
  messages?: [Message["from"], string, number][];
};

const P = (p: Omit<Profile, "conditions" | "allergies" | "dislikes" | "workoutPlace"> & Partial<Profile>): Profile => ({
  conditions: [],
  allergies: [],
  dislikes: "",
  workoutPlace: "home",
  ...p,
});

const seeds: Seed[] = [
  {
    name: "Meera Sharma",
    plan: "meal-workout-90",
    startedDaysAgo: 34,
    status: "approved",
    profile: P({ goal: "lose", diet: "veg", sex: "female", weight: 78, height: 162, age: 31, activity: "light", conditions: ["pcos"], dislikes: "karela" }),
    weight: { to: 74.6 },
    adherence: 0.86,
    messages: [
      ["coach", "Great first month, Meera — 3.4 kg down and your energy's up. Keeping the plan as is.", 50],
      ["me", "Thank you!! Had a family dinner last night and went over a bit. Should I eat less today?", 3],
    ],
  },
  {
    name: "Arjun Nair",
    plan: "meal-workout-30",
    startedDaysAgo: 18,
    status: "approved",
    profile: P({ goal: "build", diet: "nonveg", sex: "male", weight: 70, height: 178, age: 27, activity: "moderate", workoutPlace: "gym" }),
    weight: { to: 71.4 },
    adherence: 0.8,
    messages: [
      ["me", "Can I have the grilled chicken dinner more often? Easy to prep.", 30],
      ["coach", "Yes — I've added it to three dinners this week.", 28],
    ],
  },
  {
    name: "Simran Kaur",
    plan: "meal-90",
    startedDaysAgo: 1,
    status: "review",
    profile: P({ goal: "lose", diet: "egg", sex: "female", weight: 69, height: 158, age: 35, activity: "sedentary", conditions: ["thyroid"] }),
    // She asked for her usual soya pulao — clashes with thyroid, for the coach to catch.
    edits: { [editKey(0, "lunch")]: "soya-pulao" },
    messages: [["me", "Hi! Is soya okay for me? I usually have soya pulao twice a week.", 20]],
  },
  {
    name: "Dev Patel",
    plan: "meal-30",
    startedDaysAgo: 0,
    status: "review",
    profile: P({ goal: "lose", diet: "veg", sex: "male", weight: 88, height: 172, age: 42, activity: "light", conditions: ["diabetes"], dislikes: "lauki" }),
    edits: { [editKey(1, "breakfast")]: "poha" },
    messages: [["me", "Poha is my daily breakfast, please keep it in if you can 🙏", 5]],
  },
  {
    name: "Rohan Gupta",
    plan: "meal-workout-90",
    startedDaysAgo: 2,
    status: "review",
    profile: P({ goal: "lose", diet: "nonveg", sex: "male", weight: 92, height: 170, age: 38, activity: "sedentary", conditions: ["bp"], workoutPlace: "gym" }),
    edits: { [editKey(2, "snack")]: "masala-papad" },
  },
  {
    name: "Kabir Mehta",
    plan: "meal-workout-90",
    startedDaysAgo: 40,
    status: "approved",
    profile: P({ goal: "tone", diet: "veg", sex: "male", weight: 82, height: 175, age: 30, activity: "light", allergies: ["nuts"], workoutPlace: "gym" }),
    weight: { to: 80.2, flatLastDays: 16 },
    adherence: 0.55,
    idleDays: 4,
    messages: [["coach", "How's the week going, Kabir? Haven't seen logs for a few days.", 26]],
  },
  {
    name: "Ananya Iyer",
    plan: "meal-30",
    startedDaysAgo: 12,
    status: "approved",
    profile: P({ goal: "tone", diet: "vegan", sex: "female", weight: 60, height: 165, age: 26, activity: "moderate" }),
    weight: { to: 59.3 },
    adherence: 0.92,
    messages: [["me", "Loving the tofu stir-fry dinners!", 40]],
  },
  { name: "Priya Reddy", plan: "meal-30", startedDaysAgo: 1, status: "none" },
];

function buildSeed(seed: Seed, i: number): { user: User; data: UserData } {
  const r = rng(seed.name);
  const first = seed.name.split(" ")[0].toLowerCase();
  const last = seed.name.split(" ")[1].toLowerCase();
  const created = Date.now() - seed.startedDaysAgo * DAY - (i + 1) * 3600000;
  const user: User = {
    id: `demo-${first}`,
    name: seed.name,
    email: `${first}.${last}@example.com`,
    phone: `+9190000000${String(i + 10).slice(-2)}`,
    plan: seed.plan,
    createdAt: created,
    seeded: true,
  };

  const data: UserData = { ...newData(), startDate: daysAgoKey(seed.startedDaysAgo), planStatus: seed.status, profile: seed.profile ?? null, planEdits: seed.edits };
  if (!seed.profile) return { user, data };
  const p = seed.profile;

  // Daily logs since the plan started (approved clients only), stopping `idleDays` ago.
  if (seed.status === "approved") {
    data.approvedAt = created + DAY;
    const days: Record<string, DayLog> = {};
    for (let n = seed.startedDaysAgo; n >= (seed.idleDays ?? 0); n--) {
      const meals = slotSplit.map((s) => s.slot).filter(() => r() < (seed.adherence ?? 0.8));
      days[daysAgoKey(n)] = {
        meals: n === 0 ? meals.slice(0, 2) : meals,
        swaps: {},
        water: n === 0 ? 3 : 5 + Math.floor(r() * 4),
        steps: Math.round((stepGoal(p.activity) * (0.6 + r() * 0.55)) / 10) * 10,
        sets: {},
      };
    }
    data.days = days;
  }

  // Weigh-ins every 2–3 days, trending to the target, optionally flat at the end.
  const weights: { date: string; kg: number }[] = [];
  if (seed.weight) {
    const flat = seed.weight.flatLastDays ?? 0;
    const trendDays = Math.max(1, seed.startedDaysAgo - flat);
    for (let n = seed.startedDaysAgo; n >= (seed.idleDays ?? 0); n -= 2 + Math.floor(r() * 2)) {
      const t = Math.min(1, (seed.startedDaysAgo - n) / trendDays);
      const noise = n === seed.startedDaysAgo ? 0 : (r() - 0.5) * 0.5;
      weights.push({ date: daysAgoKey(n), kg: Math.round((p.weight + (seed.weight.to - p.weight) * t + noise) * 10) / 10 });
    }
  } else {
    weights.push({ date: daysAgoKey(seed.startedDaysAgo), kg: p.weight });
  }
  data.weights = weights;

  const welcome: Message = {
    id: newId(),
    from: "coach",
    text: `Hi ${seed.name.split(" ")[0]}! I'm your Evowell coach. I've got your answers and I'm reviewing your first plan now.`,
    at: created + 600000,
  };
  data.messages = [welcome, ...(seed.messages ?? []).map(([from, text, h]) => ({ id: newId(), from, text, at: Date.now() - h * 3600000 }))];
  // Everything except the latest client message counts as read.
  const lastClient = [...data.messages].reverse().find((m) => m.from === "me");
  data.coachReadAt = lastClient ? lastClient.at - 1 : Date.now();
  return { user, data };
}

/** Add the sample clients once. Real sign-ups in this browser are kept. */
export function ensureSeeded() {
  const s = readState();
  if (s.seeded) return;
  const built = seeds.map(buildSeed).filter((b) => !s.users.some((u) => u.id === b.user.id || u.email === b.user.email));
  writeState({
    ...s,
    seeded: true,
    users: [...s.users, ...built.map((b) => b.user)],
    data: { ...s.data, ...Object.fromEntries(built.map((b) => [b.user.id, b.data])) },
  });
}

/** Put the sample clients back to how they started. */
export function resetSampleClients() {
  const s = readState();
  const keep = s.users.filter((u) => !u.seeded);
  const data = Object.fromEntries(Object.entries(s.data).filter(([id]) => keep.some((u) => u.id === id)));
  writeState({ ...s, users: keep, data, seeded: false });
  ensureSeeded();
}
