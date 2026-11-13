/*
 * CLIENT DATA LAYER — accounts and dashboard data, stored in MongoDB via the
 * /api routes. (The file keeps its old name so screens don't need new imports.)
 *
 * Screens use `useSession()` exactly as before. Changes show instantly
 * (optimistic) and are saved in the background, in order. Only the fields that
 * changed are sent, so the coach's edits and messages are never overwritten.
 * Data refreshes every 20s and when the tab regains focus, so coach replies and
 * plan approvals appear without a reload.
 */

import { useEffect, useSyncExternalStore } from "react";
import type { Inputs, Slot } from "@/lib/engine";
import type { PlanId } from "@/lib/plans";

export type User = {
  id: string;
  name: string;
  email: string;
  /** E.164-ish, e.g. "+919876543210". */
  phone: string;
  plan: PlanId;
  createdAt: number;
  /**
   * Whether the dashboard is unlocked. "open" means online payments aren't
   * switched on yet, so everyone gets in; "unpaid"/"expired" go to checkout.
   */
  access: "open" | "active" | "unpaid" | "expired";
  /** The latest paid period, when there is one. */
  subscription?: { plan: PlanId; paidAt: number; expiresAt: number; amount: number };
};

/** True when the client can use the dashboard. */
export const canUseApp = (u: Pick<User, "access">) => u.access === "open" || u.access === "active";

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
export const newId = uid;

export const normEmail = (e: string) => e.trim().toLowerCase();

/** "+919876543210" → "+91 98765 43210". */
export const formatPhone = (p: string) => {
  const code = ["+971", "+91", "+44", "+61", "+65", "+1"].find((c) => p.startsWith(c));
  if (!code) return p;
  const rest = p.slice(code.length);
  return `${code} ${rest.slice(0, 5)} ${rest.slice(5)}`.trim();
};

export const maskPhone = (dial: string, num: string) => `${dial} ${num.slice(0, 2)}•••••${num.slice(-3)}`;

/** False during server render / hydration, true once running in the browser. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/* ───────────── Store ───────────── */

type MeState = { status: "idle" | "loading" | "ready" | "anon" | "error"; user: User | null; data: UserData | null };
const SERVER: MeState = { status: "idle", user: null, data: null };
let me: MeState = SERVER;
const listeners = new Set<() => void>();
const emit = (next: MeState) => {
  me = next;
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

let pending = 0;
let queue: Promise<unknown> = Promise.resolve();

async function refresh() {
  if (pending) return; // don't overwrite changes that are still saving
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (pending) return;
    if (res.status === 401) return emit({ status: "anon", user: null, data: null });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as { user: User; data: UserData };
    emit({ status: "ready", user: j.user, data: j.data });
  } catch {
    if (me.status !== "ready") emit({ ...me, status: "error" });
  }
}

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  emit({ ...me, status: me.status === "idle" ? "loading" : me.status });
  refresh();
  const tick = () => document.visibilityState === "visible" && me.status !== "anon" && refresh();
  window.setInterval(tick, 20000);
  window.addEventListener("focus", tick);
  document.addEventListener("visibilitychange", tick);
}

/** Run saves one after another; apply the server's copy once nothing else is waiting. */
function enqueue(job: () => Promise<{ user: User; data: UserData } | null>) {
  pending++;
  queue = queue
    .then(job)
    .then((res) => {
      pending--;
      if (res && pending === 0) emit({ status: "ready", user: res.user, data: res.data });
    })
    .catch(() => {
      pending--;
      if (pending === 0) refresh(); // fall back to the server's truth
    });
}

async function patchMe(body: unknown) {
  const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as { user: User; data: UserData };
}

/** Work out what changed between two copies of the data and send just that. */
function save(prev: UserData, next: UserData) {
  const body: Record<string, unknown> = {};
  if (next.profile !== prev.profile && next.profile) body.profile = next.profile;
  if (next.weights !== prev.weights) body.weights = next.weights;
  const days: Record<string, DayLog> = {};
  for (const [k, v] of Object.entries(next.days)) if (v !== prev.days[k]) days[k] = v;
  if (Object.keys(days).length) body.days = days;
  const seen = new Set(prev.messages.map((m) => m.id));
  const msgs = next.messages.filter((m) => !seen.has(m.id) && m.from === "me");
  if (msgs.length) body.messages = msgs.map((m) => ({ id: m.id, text: m.text }));

  const oldPhotos = new Set(prev.photos.map((p) => p.id));
  const newPhotos = new Set(next.photos.map((p) => p.id));
  const added = next.photos.filter((p) => !oldPhotos.has(p.id) && p.src.startsWith("data:"));
  const removed = prev.photos.filter((p) => !newPhotos.has(p.id));

  if (!Object.keys(body).length && !added.length && !removed.length) return;
  enqueue(async () => {
    for (const p of added) {
      const r = await fetch("/api/me/photos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, date: p.date, dataUrl: p.src }) });
      if (!r.ok) throw new Error("photo");
    }
    for (const p of removed) await fetch(`/api/me/photos/${encodeURIComponent(p.id)}`, { method: "DELETE" });
    return patchMe(body); // returns the fresh copy (also when only photos changed)
  });
}

/* ───────────── Auth ───────────── */

export type StartResult = { ok: true; devCode?: string } | { ok: false; error: string; field?: "email" | "phone" | "name"; wait?: number };

/** Check the details and send a sign-in code. In dummy mode the code comes back as `devCode`. */
export async function startAuth(input: { mode: "signup" | "login"; name?: string; email: string; phone: string; plan?: PlanId }): Promise<StartResult> {
  try {
    const res = await fetch("/api/auth/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    return (await res.json()) as StartResult;
  } catch {
    return { ok: false, error: "Couldn't reach the server. Check your connection." };
  }
}

export type VerifyResult = { ok: true; isNew: boolean; user: User } | { ok: false; error: string; wrong?: boolean };

export async function verifyAuth(email: string, code: string): Promise<VerifyResult> {
  try {
    const res = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
    const j = (await res.json()) as VerifyResult;
    if (j.ok) {
      emit({ status: "loading", user: null, data: null });
      await refresh();
    }
    return j;
  } catch {
    return { ok: false, error: "Couldn't reach the server. Check your connection." };
  }
}

/** Re-read the account from the server (e.g. right after a payment). */
export const reloadSession = () => refresh();

export async function logout() {
  emit({ status: "anon", user: null, data: null });
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // cookie clears on the next successful request
  }
}

/* ───────────── Session hook ───────────── */

export function useSession() {
  const s = useSyncExternalStore(subscribe, () => me, () => SERVER);
  useEffect(start, []);
  const hydrated = s.status === "ready" || s.status === "anon";
  const { user, data } = s;

  const update = (fn: (d: UserData) => UserData) => {
    if (!me.data) return;
    const prev = me.data;
    const next = fn(prev);
    emit({ ...me, data: next });
    save(prev, next);
  };

  const updateDay = (key: string, fn: (d: DayLog) => DayLog) =>
    update((d) => ({ ...d, days: { ...d.days, [key]: fn(d.days[key] ?? emptyDay()) } }));

  const updateUser = (patch: Partial<Pick<User, "name" | "plan">>) => {
    if (!me.user) return;
    emit({ ...me, user: { ...me.user, ...patch } });
    enqueue(() => patchMe({ user: patch }));
  };

  /** Wipe this account's dashboard data (keeps the account). */
  const resetData = () => {
    if (!me.data) return;
    emit({ ...me, data: newData() });
    enqueue(() => patchMe({ reset: true }));
  };

  return { hydrated, user, data, update, updateDay, updateUser, resetData };
}
