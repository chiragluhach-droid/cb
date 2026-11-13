/*
 * Input checks for every API route — SERVER ONLY. Nothing from the browser is
 * stored without passing through one of these.
 */

import type { DayLog, Profile } from "@/lib/demo-store";
import { dishes, slotSplit } from "@/lib/engine";
import { PlanId, planIds } from "@/lib/plans";
import { Settings, defaultSettings } from "@/lib/settings-core";

const SLOTS = slotSplit.map((s) => s.slot) as string[];
const DISH_IDS = new Set(dishes.map((d) => d.id));

export const oneOf = <T extends string>(v: unknown, list: readonly T[]): v is T => typeof v === "string" && (list as readonly string[]).includes(v);
const num = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export const isDayKey = (k: unknown): k is string => typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k);
export const normEmail = (e: string) => e.trim().toLowerCase();
export const validEmail = (e: unknown): e is string => typeof e === "string" && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
/** "+919876543210" style: + then 8–15 digits. */
export const validPhone = (p: unknown): p is string => typeof p === "string" && /^\+\d{8,15}$/.test(p);
export const validPlan = (p: unknown): p is PlanId => oneOf(p, planIds);
export const validName = (n: unknown): n is string => typeof n === "string" && n.trim().length >= 2 && n.trim().length <= 80;

/** A well-formed questionnaire, or null. */
export function readProfile(p: unknown): Profile | null {
  if (!p || typeof p !== "object") return null;
  const x = p as Record<string, unknown>;
  const conditions = Array.isArray(x.conditions) ? [...new Set(x.conditions.filter((c) => oneOf(c, ["pcos", "thyroid", "diabetes", "bp"] as const)))] : [];
  const allergies = Array.isArray(x.allergies) ? [...new Set(x.allergies.filter((c) => oneOf(c, ["dairy", "gluten", "nuts", "soy"] as const)))] : [];
  if (
    !oneOf(x.goal, ["lose", "tone", "build"] as const) ||
    !oneOf(x.diet, ["veg", "jain", "egg", "nonveg", "vegan"] as const) ||
    !oneOf(x.sex, ["female", "male"] as const) ||
    !oneOf(x.activity, ["sedentary", "light", "moderate", "very"] as const) ||
    !num(x.weight, 30, 250) ||
    !num(x.height, 120, 230) ||
    !num(x.age, 14, 100)
  )
    return null;
  return {
    goal: x.goal,
    diet: x.diet,
    sex: x.sex,
    activity: x.activity,
    weight: x.weight as number,
    height: x.height as number,
    age: x.age as number,
    conditions,
    allergies,
    dislikes: str(x.dislikes, 200),
    workoutPlace: x.workoutPlace === "gym" ? "gym" : "home",
  };
}

export function readDayLog(v: unknown): DayLog | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  const meals = Array.isArray(x.meals) ? [...new Set(x.meals.filter((m) => oneOf(m, SLOTS)))] : [];
  const swaps: Record<string, string> = {};
  if (x.swaps && typeof x.swaps === "object")
    for (const [k, id] of Object.entries(x.swaps as Record<string, unknown>)) if (SLOTS.includes(k) && typeof id === "string" && DISH_IDS.has(id)) swaps[k] = id;
  const sets: Record<string, number> = {};
  if (x.sets && typeof x.sets === "object")
    for (const [k, n] of Object.entries(x.sets as Record<string, unknown>)) if (/^[a-z0-9-]{1,40}$/.test(k) && num(n, 0, 20)) sets[k] = Math.round(n as number);
  return {
    meals: meals as DayLog["meals"],
    swaps,
    water: num(x.water, 0, 30) ? Math.round(x.water as number) : 0,
    steps: num(x.steps, 0, 200000) ? Math.round(x.steps as number) : 0,
    sets,
  };
}

export function readWeights(v: unknown) {
  if (!Array.isArray(v)) return null;
  const out = new Map<string, number>();
  for (const w of v.slice(0, 800)) {
    const x = w as Record<string, unknown>;
    if (isDayKey(x?.date) && num(x?.kg, 25, 300)) out.set(x.date as string, Math.round((x.kg as number) * 10) / 10);
  }
  return [...out].map(([date, kg]) => ({ date, kg })).sort((a, b) => a.date.localeCompare(b.date));
}

export const readText = (v: unknown, max = 2000) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Coach plan edits / AI picks: "0-breakfast" → known dish id. */
export function readPicks(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!v || typeof v !== "object") return out;
  for (const [k, id] of Object.entries(v as Record<string, unknown>)) if (/^[0-6]-(breakfast|lunch|snack|dinner)$/.test(k) && typeof id === "string" && DISH_IDS.has(id)) out[k] = id;
  return out;
}

export const isDishId = (v: unknown): v is string => typeof v === "string" && DISH_IDS.has(v);

/** Admin › Subscriptions. Unknown fields dropped; plan names stay fixed. */
export function readSettings(v: unknown): Settings | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  const plans = x.plans as Record<string, Record<string, unknown>> | undefined;
  const list = (a: unknown, n: number, len: number) => (Array.isArray(a) ? a.filter((s) => typeof s === "string").map((s) => (s as string).slice(0, len)).slice(0, n) : []);
  const plan = (k: "meal" | "meal-workout") => {
    const p = plans?.[k] ?? {};
    return {
      name: defaultSettings.plans[k].name,
      tagline: str(p.tagline, 200) || defaultSettings.plans[k].tagline,
      monthly: num(p.monthly, 0, 1000000) ? Math.round(p.monthly as number) : defaultSettings.plans[k].monthly,
      features: list(p.features, 15, 120),
    };
  };
  const codes = Array.isArray(x.codes)
    ? x.codes
        .map((c) => c as Record<string, unknown>)
        .filter((c) => typeof c?.code === "string" && /^[A-Z0-9]{3,16}$/.test(c.code as string) && num(c.pct, 1, 90))
        .map((c) => ({ code: c.code as string, pct: Math.round(c.pct as number), active: c.active !== false }))
        .slice(0, 60)
    : [];
  return {
    checkout: x.checkout === "paid" ? "paid" : "free",
    plans: { meal: plan("meal"), "meal-workout": plan("meal-workout") },
    ninetyDayExtras: list(x.ninetyDayExtras, 8, 120),
    codes: [...new Map(codes.map((c) => [c.code, c])).values()],
  };
}
