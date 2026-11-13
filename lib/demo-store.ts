/*
 * DEMO DATA LAYER — accounts, sessions and dashboard data saved in this
 * browser's localStorage. Nothing leaves the device.
 *
 * When a real backend arrives, replace the functions in this file
 * (signup / login / update / logout) with API calls; the screens only talk
 * to this module.
 */

import { useSyncExternalStore } from "react";
import type { Inputs, Slot } from "@/lib/engine";
import type { PlanId } from "@/lib/plans";

export const DEMO_OTP = "123456";

export type User = {
  id: string;
  name: string;
  email: string;
  /** E.164-ish, e.g. "+919876543210". */
  phone: string;
  plan: PlanId;
  createdAt: number;
  /** Sample client created for the admin demo. */
  seeded?: boolean;
};

export type Profile = Inputs & { workoutPlace: "home" | "gym"; dislikes: string };

export type DayLog = {
  meals: Slot[];
  swaps: Partial<Record<Slot, string>>;
  water: number;
  steps: number;
  /** exercise id → sets done */
  sets: Record<string, number>;
};

export type Message = { id: string; from: "me" | "coach"; text: string; at: number };

export type UserData = {
  profile: Profile | null;
  planStatus: "none" | "review" | "approved";
  startDate: string;
  days: Record<string, DayLog>;
  weights: { date: string; kg: number }[];
  photos: { id: string; date: string; src: string }[];
  messages: Message[];
  /** Coach's edits to the draft: `${weekday}-${slot}` → dish id. Applied before the client's own swaps. */
  planEdits?: Record<string, string>;
  /** When the coach approved the current plan. */
  approvedAt?: number;
  /** Private coach notes about this client. */
  coachNotes?: string;
  /** Last time the coach read this client's messages. */
  coachReadAt?: number;
  /** Latest AI-drafted week (coach panel). `picks` uses the same keys as planEdits. */
  aiDraft?: { at: number; model: string; note: string; instruction?: string; picks: Record<string, string>; prevEdits?: Record<string, string> };
};

export type DemoState = {
  users: User[];
  session: string | null;
  data: Record<string, UserData>;
  /** Coach panel sign-in (demo). */
  admin?: { signedIn: boolean };
  /** Sample clients have been added for the admin demo. */
  seeded?: boolean;
};

const KEY = "evowell.demo.v1";
const EMPTY: DemoState = { users: [], session: null, data: {} };

let cache: DemoState = EMPTY;
let raw: string | null = null;
const listeners = new Set<() => void>();

function read(): DemoState {
  if (typeof window === "undefined") return EMPTY;
  let r: string | null = null;
  try {
    r = window.localStorage.getItem(KEY);
  } catch {
    return cache;
  }
  if (r === raw) return cache;
  raw = r;
  try {
    cache = r ? { ...EMPTY, ...(JSON.parse(r) as DemoState) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: DemoState) {
  cache = next;
  raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    // Storage full or blocked — keep working in memory.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDemo() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** False during server render / hydration, true once running in the browser. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/* ───────────── Helpers ───────────── */

export const dayKey = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

/** Monday = 0 … Sunday = 6 (matches the plan engine's day rotation). */
export const weekday = (d = new Date()) => (d.getDay() + 6) % 7;

export const emptyDay = (): DayLog => ({ meals: [], swaps: {}, water: 0, steps: 0, sets: {} });

export const newData = (): UserData => ({
  profile: null,
  planStatus: "none",
  startDate: dayKey(),
  days: {},
  weights: [],
  photos: [],
  messages: [],
});

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const normEmail = (e: string) => e.trim().toLowerCase();

/** "+919876543210" → "+91 98765 43210". */
export const formatPhone = (p: string) => {
  const code = ["+971", "+91", "+44", "+61", "+65", "+1"].find((c) => p.startsWith(c));
  if (!code) return p;
  const rest = p.slice(code.length);
  return `${code} ${rest.slice(0, 5)} ${rest.slice(5)}`.trim();
};

export const maskPhone = (dial: string, num: string) => `${dial} ${num.slice(0, 2)}•••••${num.slice(-3)}`;

/* ───────────── Auth ───────────── */

export type AuthResult = { ok: true } | { ok: false; error: string; field?: "email" | "phone" };

/** Check a sign-up before sending the code. */
export function checkSignup(email: string, phone: string): AuthResult {
  const s = read();
  if (s.users.some((u) => u.email === normEmail(email))) return { ok: false, field: "email", error: "An account with this email already exists. Log in instead." };
  if (s.users.some((u) => u.phone === phone)) return { ok: false, field: "phone", error: "This phone number is already registered. Log in instead." };
  return { ok: true };
}

export function completeSignup(input: { name: string; email: string; phone: string; plan: PlanId }) {
  const s = read();
  const user: User = { id: uid(), name: input.name.trim(), email: normEmail(input.email), phone: input.phone, plan: input.plan, createdAt: Date.now() };
  write({ users: [...s.users, user], session: user.id, data: { ...s.data, [user.id]: newData() } });
  return user;
}

/** Both email and phone must belong to the same account. */
export function checkLogin(email: string, phone: string): AuthResult {
  const s = read();
  const byEmail = s.users.find((u) => u.email === normEmail(email));
  if (!byEmail) {
    if (s.users.some((u) => u.phone === phone)) return { ok: false, field: "email", error: "That email doesn't match the account for this phone number." };
    return { ok: false, error: "No account found with this email and phone. Sign up first?" };
  }
  if (byEmail.phone !== phone) return { ok: false, field: "phone", error: "This phone number doesn't match the account for that email." };
  return { ok: true };
}

export function completeLogin(email: string) {
  const s = read();
  const u = s.users.find((x) => x.email === normEmail(email));
  if (u) write({ ...s, session: u.id });
  return u ?? null;
}

export function logout() {
  write({ ...read(), session: null });
}

/* ───────────── Session hook ───────────── */

export function useSession() {
  const hydrated = useHydrated();
  const s = useDemo();
  const user = s.users.find((u) => u.id === s.session) ?? null;
  const data = user ? s.data[user.id] ?? newData() : null;

  const update = (fn: (d: UserData) => UserData) => {
    const cur = read();
    const id = cur.session;
    if (!id) return;
    write({ ...cur, data: { ...cur.data, [id]: fn(cur.data[id] ?? newData()) } });
  };

  const updateDay = (key: string, fn: (d: DayLog) => DayLog) =>
    update((d) => ({ ...d, days: { ...d.days, [key]: fn(d.days[key] ?? emptyDay()) } }));

  const updateUser = (patch: Partial<Pick<User, "name" | "plan">>) => {
    const cur = read();
    write({ ...cur, users: cur.users.map((u) => (u.id === cur.session ? { ...u, ...patch } : u)) });
  };

  /** Wipe this account's dashboard data (keeps the account). */
  const resetData = () => {
    const cur = read();
    if (!cur.session) return;
    write({ ...cur, data: { ...cur.data, [cur.session]: newData() } });
  };

  return { hydrated, user, data, update, updateDay, updateUser, resetData };
}

export const newId = uid;

/** Low-level access for the admin panel (lib/admin.ts). Screens should use the hooks. */
export const readState = read;
export const writeState = write;
