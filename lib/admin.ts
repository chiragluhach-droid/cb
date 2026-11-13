/*
 * COACH (ADMIN) DATA LAYER — talks to /api/admin/* (MongoDB).
 *
 * The coach panel loads every client once, refreshes every 15s (and when the
 * tab regains focus) so new sign-ups and messages appear, and applies each
 * coach action instantly on screen while it saves.
 */

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Message, Profile, User, UserData, dayKey, newData, newId } from "@/lib/demo-store";
import { Slot, clash, dietOk, dishes, dislikeWords, slotSplit } from "@/lib/engine";
import { parsePlan } from "@/lib/plans";
import { editKey, planWeekday } from "@/components/app/meals";

export { dislikeWords };

/* ───────────── Store ───────────── */

type Client = { user: User; data: UserData };
type AdminState = { status: "idle" | "loading" | "ready" | "signedOut" | "error"; clients: Client[] };
const SERVER: AdminState = { status: "idle", clients: [] };
let st: AdminState = SERVER;
const listeners = new Set<() => void>();
const emit = (next: AdminState) => {
  st = next;
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

let saving = 0;

export async function refreshClients() {
  if (saving) return;
  try {
    const res = await fetch("/api/admin/clients", { cache: "no-store" });
    if (saving) return;
    if (res.status === 401) return emit({ status: "signedOut", clients: [] });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as { clients: Client[] };
    emit({ status: "ready", clients: j.clients });
  } catch {
    if (st.status !== "ready") emit({ ...st, status: "error" });
  }
}

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  emit({ ...st, status: "loading" });
  refreshClients();
  const tick = () => document.visibilityState === "visible" && st.status === "ready" && refreshClients();
  window.setInterval(tick, 15000);
  window.addEventListener("focus", tick);
}

/** Apply a change to one client on screen now, then save it with the given action. */
function act(id: string, local: (d: UserData) => UserData, body: Record<string, unknown>) {
  emit({ ...st, clients: st.clients.map((c) => (c.user.id === id ? { ...c, data: local(c.data) } : c)) });
  saving++;
  fetch(`/api/admin/clients/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then(async (res) => {
      saving--;
      if (res.status === 401) return emit({ status: "signedOut", clients: [] });
      if (!res.ok) throw new Error(String(res.status));
      const fresh = (await res.json()) as Client;
      if (saving === 0) emit({ ...st, clients: st.clients.map((c) => (c.user.id === id ? fresh : c)) });
    })
    .catch(() => {
      if (saving === 0) refreshClients();
    });
}

const coachMsg = (text: string): Message => ({ id: newId(), from: "coach", text, at: Date.now() });

/* ───────────── Sign in / out ───────────── */

export async function adminSignIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const j = await res.json();
    if (j.ok) {
      emit({ status: "loading", clients: [] });
      started ? await refreshClients() : start();
    }
    return j;
  } catch {
    return { ok: false, error: "Couldn't reach the server. Check your connection." };
  }
}

export async function adminSignOut() {
  emit({ status: "signedOut", clients: [] });
  try {
    await fetch("/api/admin/logout", { method: "POST" });
  } catch {
    // ignore
  }
}

/* ───────────── Coach actions ───────────── */

/** Permanently delete a client and all their data. */
export async function deleteClient(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/clients/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.status === 401) {
      emit({ status: "signedOut", clients: [] });
      return { ok: false, error: "Sign in again." };
    }
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok && res.status !== 404) return { ok: false, error: j.error ?? "Couldn't delete. Try again." };
    emit({ ...st, clients: st.clients.filter((c) => c.user.id !== id) });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server." };
  }
}

/** Coach edit for one meal of the weekly plan. `dishId: null` restores the draft. */
export function setPlanEdit(id: string, day: number, slot: Slot, dishId: string | null) {
  act(
    id,
    (d) => {
      const edits = { ...(d.planEdits ?? {}) };
      if (dishId) edits[editKey(day, slot)] = dishId;
      else delete edits[editKey(day, slot)];
      return { ...d, planEdits: edits };
    },
    { op: "planEdit", day, slot, dishId }
  );
}

export function approvePlan(id: string, note: string) {
  const text = note.trim() || "Your plan is approved ✓ Tick meals off as you go and message me anytime.";
  act(id, (d) => ({ ...d, planStatus: "approved", approvedAt: Date.now(), messages: [...d.messages, coachMsg(text)] }), { op: "approve", note: text });
}

export function coachSend(id: string, text: string) {
  if (!text.trim()) return;
  act(id, (d) => ({ ...d, messages: [...d.messages, coachMsg(text.trim())], coachReadAt: Date.now() }), { op: "message", text: text.trim() });
}

export function markRead(id: string) {
  const c = st.clients.find((x) => x.user.id === id);
  const lastClient = c?.data.messages.filter((m) => m.from === "me").at(-1);
  if (!c || !lastClient || (c.data.coachReadAt ?? 0) >= lastClient.at) return; // nothing new to mark
  act(id, (d) => ({ ...d, coachReadAt: Date.now() }), { op: "read" });
}

/** Put an AI-drafted week into the plan, keeping the previous version for undo. */
export function applyAiDraft(id: string, picks: Record<string, string>, meta: { model: string; note: string; instruction?: string }) {
  act(
    id,
    (d) => ({ ...d, planEdits: { ...picks }, aiDraft: { at: Date.now(), ...meta, picks, prevEdits: d.aiDraft ? d.aiDraft.prevEdits : { ...(d.planEdits ?? {}) } } }),
    { op: "aiDraft", picks, ...meta }
  );
}

/** Go back to the plan as it was before the first AI draft. */
export function undoAiDraft(id: string) {
  act(id, (d) => ({ ...d, planEdits: { ...(d.aiDraft?.prevEdits ?? {}) }, aiDraft: undefined }), { op: "undoAi" });
}

export function saveCoachNotes(id: string, notes: string) {
  act(id, (d) => ({ ...d, coachNotes: notes }), { op: "notes", text: notes });
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

/** Coach session + every client, newest first. */
export function useAdmin() {
  const s = useSyncExternalStore(subscribe, () => st, () => SERVER);
  useEffect(start, []);
  const clients = useMemo(() => s.clients.map((c) => toRow(c.user, c.data ?? newData())), [s.clients]);
  return { hydrated: s.status === "ready" || s.status === "signedOut", signedIn: s.status === "ready", status: s.status, clients };
}
