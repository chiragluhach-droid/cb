/*
 * Admin › Subscriptions settings — types, defaults and helpers shared by the
 * server (API routes) and the browser (lib/settings.ts). No React here.
 */

import { CHECKOUT_MODE, PLAN_ID_RE, PlanDef, PlanOption, defaultPlans, discountCodes, findOption } from "@/lib/plans";

export type { PlanDef, PlanOption };
export type DiscountCode = { code: string; pct: number; active: boolean };
export type Settings = {
  checkout: "free" | "paid";
  /** In display order. */
  plans: PlanDef[];
  codes: DiscountCode[];
};

const clonePlans = (ps: PlanDef[]) => ps.map((p) => ({ ...p, features: [...p.features], options: p.options.map((o) => ({ ...o, perks: [...o.perks] })) }));

export const defaultSettings: Settings = {
  checkout: CHECKOUT_MODE,
  plans: clonePlans(defaultPlans),
  codes: Object.entries(discountCodes).map(([code, c]) => ({ code, pct: c.pct, active: true })),
};

/** Price of a plan key, or null if that plan/length doesn't exist. */
export const priceFor = (s: Settings, key: string) => findOption(s.plans, key)?.option.price ?? null;

/** An active discount code, matched case-insensitively. */
export const findCode = (s: Settings, code: string) => s.codes.find((c) => c.active && c.code === code.trim().toUpperCase()) ?? null;

/* ───────────── Cleaning (server PUT + reading the database) ───────────── */

type Raw = Record<string, unknown>;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v) : null);
const list = (a: unknown, n: number, len: number) =>
  Array.isArray(a) ? a.filter((s): s is string => typeof s === "string").map((s) => s.trim().slice(0, len)).filter(Boolean).slice(0, n) : [];

/** Settings saved before plans were editable: two fixed plans with a monthly price and shared 90-day extras. */
function fromOldShape(x: Raw): PlanDef[] | null {
  const old = x.plans as Record<string, Raw> | undefined;
  if (!old || Array.isArray(old) || typeof old !== "object") return null;
  const extras = list(x.ninetyDayExtras, 8, 120);
  return defaultPlans.map((d) => {
    const o = old[d.id] ?? {};
    const monthly = int(o.monthly, 0, 1000000) ?? d.options[0].price;
    return {
      ...d,
      tagline: str(o.tagline, 200) || d.tagline,
      features: Array.isArray(o.features) ? list(o.features, 15, 120) : [...d.features],
      options: [
        { days: 30, price: monthly, badge: "", perks: [], calls: false },
        { days: 90, price: monthly * 2, badge: "3rd month free", perks: extras, calls: true },
      ],
    };
  });
}

function readOption(v: unknown): PlanOption | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Raw;
  const days = int(o.days, 1, 730);
  const price = int(o.price, 0, 1000000);
  if (days === null || price === null) return null;
  return { days, price, badge: str(o.badge, 40), perks: list(o.perks, 8, 120), calls: o.calls === true };
}

function readPlan(v: unknown): PlanDef | null {
  if (!v || typeof v !== "object") return null;
  const p = v as Raw;
  const id = str(p.id, 40).toLowerCase();
  if (!PLAN_ID_RE.test(id)) return null;
  // A name being retyped mustn't drop the plan.
  const name = str(p.name, 60) || id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const opts = Array.isArray(p.options) ? p.options.map(readOption).filter((o): o is PlanOption => !!o) : [];
  const options = [...new Map(opts.map((o) => [o.days, o])).values()].sort((a, b) => a.days - b.days).slice(0, 6);
  return {
    id,
    name,
    tagline: str(p.tagline, 200),
    features: list(p.features, 15, 120),
    workouts: p.workouts === true,
    visible: p.visible !== false,
    featured: p.featured === true,
    options,
  };
}

/**
 * Cleaned settings from anything (the coach's PUT, or the database). Unknown
 * fields are dropped; the old two-plan shape is converted. Null = unusable.
 */
export function readSettings(v: unknown): Settings | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Raw;
  let plans: PlanDef[] = Array.isArray(x.plans) ? x.plans.map(readPlan).filter((p): p is PlanDef => !!p) : fromOldShape(x) ?? [];
  plans = [...new Map(plans.map((p) => [p.id, p])).values()].slice(0, 12);
  if (!plans.length) plans = clonePlans(defaultPlans);
  // Only one "Most popular".
  const star = plans.findIndex((p) => p.featured);
  plans = plans.map((p, i) => ({ ...p, featured: i === star }));
  const codes = Array.isArray(x.codes)
    ? x.codes
        .map((c) => c as Raw)
        .filter((c) => typeof c?.code === "string" && /^[A-Z0-9]{3,16}$/.test(c.code as string) && int(c.pct, 1, 90) !== null)
        .map((c) => ({ code: c.code as string, pct: Math.round(c.pct as number), active: c.active !== false }))
        .slice(0, 60)
    : [];
  return {
    checkout: x.checkout === "paid" ? "paid" : "free",
    plans,
    codes: [...new Map(codes.map((c) => [c.code, c])).values()],
  };
}
