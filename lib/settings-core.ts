/*
 * Admin › Subscriptions settings — types, defaults and helpers shared by the
 * server (API routes) and the browser (lib/settings.ts). No React here.
 */

import { CHECKOUT_MODE, Duration, PlanKind, discountCodes, ninetyDayExtras, plans } from "@/lib/plans";

export type DiscountCode = { code: string; pct: number; active: boolean };
export type PlanSettings = { name: string; tagline: string; monthly: number; features: string[] };
export type Settings = {
  checkout: "free" | "paid";
  plans: Record<PlanKind, PlanSettings>;
  ninetyDayExtras: string[];
  codes: DiscountCode[];
};

export const defaultSettings: Settings = {
  checkout: CHECKOUT_MODE,
  plans: {
    meal: { ...plans.meal, features: [...plans.meal.features] },
    "meal-workout": { ...plans["meal-workout"], features: [...plans["meal-workout"].features] },
  },
  ninetyDayExtras: [...ninetyDayExtras],
  codes: Object.entries(discountCodes).map(([code, c]) => ({ code, pct: c.pct, active: true })),
};

/** 90 days costs the same as two months, so the third month is free. */
export const priceFor = (s: Settings, kind: PlanKind, d: Duration) => (d === 30 ? s.plans[kind].monthly : s.plans[kind].monthly * 2);

/** An active discount code, matched case-insensitively. */
export const findCode = (s: Settings, code: string) => s.codes.find((c) => c.active && c.code === code.trim().toUpperCase()) ?? null;
