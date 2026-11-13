/*
 * Plans and checkout settings. Later these move to Admin › Subscriptions;
 * for now they live here so the public site and the demo checkout agree.
 *
 * PRICES ARE PLACEHOLDERS — Meal + Workout matches the live site
 * (₹1,999 / ₹3,998); Meal Plan is a guess. Change them here.
 */

export type PlanKind = "meal" | "meal-workout";
export type Duration = 30 | 90;
export type PlanId = `${PlanKind}-${Duration}`;

/** Legacy setting from the old checkout flow; plans now go straight to sign-up. */
export const CHECKOUT_MODE: "free" | "paid" = "free";

export const plans: Record<
  PlanKind,
  { name: string; tagline: string; monthly: number; features: string[] }
> = {
  meal: {
    name: "Meal Plan",
    tagline: "A personal diet plan from food you already eat.",
    monthly: 1499,
    features: [
      "Personal Indian meal plan",
      "Calorie & protein targets",
      "Daily tracking dashboard",
      "Chat with your coach",
      "Plan updates as you progress",
    ],
  },
  "meal-workout": {
    name: "Meal + Workout",
    tagline: "Your diet plan plus training that gets harder each week.",
    monthly: 1999,
    features: [
      "Everything in Meal Plan",
      "Home or gym workout plan",
      "Workouts that progress weekly",
      "Form notes & swaps",
      "Workout logging in the app",
    ],
  },
};

/** Extras only the 90-day plans include. */
export const ninetyDayExtras = ["1:1 video calls with your coach", "3rd month free"];

/** 90 days costs the same as two months, so the third month is free. */
export const priceOf = (kind: PlanKind, d: Duration) => (d === 30 ? plans[kind].monthly : plans[kind].monthly * 2);

export const planIds: PlanId[] = ["meal-30", "meal-90", "meal-workout-30", "meal-workout-90"];

export const parsePlan = (id: string | null | undefined): { kind: PlanKind; duration: Duration } => {
  const m = id?.match(/^(meal|meal-workout)-(30|90)$/);
  if (!m) return { kind: "meal-workout", duration: 90 };
  return { kind: m[1] as PlanKind, duration: Number(m[2]) as Duration };
};

/** Demo discount codes. Real codes will come from the admin panel. */
export const discountCodes: Record<string, { pct: number; label: string }> = {
  EVO10: { pct: 10, label: "10% off" },
  WELCOME20: { pct: 20, label: "20% off" },
};

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
