/*
 * Admin › Subscriptions settings — prices, plan contents, discount codes and
 * checkout mode. DEMO: saved in this browser's localStorage, so a change made
 * in the admin panel shows on the public site in the same browser.
 *
 * Defaults come from lib/plans.ts. When a real backend arrives, load and save
 * these through an API instead; screens only use `useSettings()` and the
 * helpers below.
 */

import { useSyncExternalStore } from "react";
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

const KEY = "evowell.settings.v1";
let cache: Settings = defaultSettings;
let raw: string | null = null;
const listeners = new Set<() => void>();

function read(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  let r: string | null = null;
  try {
    r = window.localStorage.getItem(KEY);
  } catch {
    return cache;
  }
  if (r === raw) return cache;
  raw = r;
  try {
    const saved = r ? (JSON.parse(r) as Partial<Settings>) : {};
    cache = {
      ...defaultSettings,
      ...saved,
      plans: { ...defaultSettings.plans, ...(saved.plans ?? {}) },
    };
  } catch {
    cache = defaultSettings;
  }
  return cache;
}

function write(next: Settings) {
  cache = next;
  raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    // Storage blocked — keep the change in memory for this visit.
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

/** Current settings. Renders the defaults on the server, then the saved values. */
export function useSettings() {
  return useSyncExternalStore(subscribe, read, () => defaultSettings);
}

export function updateSettings(fn: (s: Settings) => Settings) {
  write(fn(read()));
}

export function resetSettings() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  raw = null;
  cache = defaultSettings;
  listeners.forEach((l) => l());
}

/** 90 days costs the same as two months, so the third month is free. */
export const priceFor = (s: Settings, kind: PlanKind, d: Duration) => (d === 30 ? s.plans[kind].monthly : s.plans[kind].monthly * 2);

/** An active discount code, matched case-insensitively. */
export const findCode = (s: Settings, code: string) => s.codes.find((c) => c.active && c.code === code.trim().toUpperCase()) ?? null;
