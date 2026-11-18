/*
 * Plans — what's for sale. The coach edits them in Admin › Subscriptions
 * (stored in MongoDB, see lib/settings-core.ts); the defaults below are used
 * until she saves, and to convert the older two-plan settings.
 *
 * A client's plan is stored as a key "<plan id>-<days>", e.g. "meal-workout-90".
 */

/** "<plan id>-<days>", e.g. "meal-30" or "pcos-care-60". */
export type PlanId = string;

/** One way to buy a plan: a length and its price, plus an optional badge and extra perks. */
export type PlanOption = {
  days: number;
  /** One-time price in rupees. */
  price: number;
  /** Short highlight, e.g. "3rd month free". Empty = none. */
  badge: string;
  /** Extra perks for this length only, e.g. "1:1 video calls". */
  perks: string[];
  /** Client can book 1:1 video calls from the coach chat. */
  calls: boolean;
};

export type PlanDef = {
  /** Fixed once created: clients' plans point at it. Lowercase letters, digits and dashes. */
  id: string;
  name: string;
  tagline: string;
  features: string[];
  /** Includes a workout plan (adds the training questions and the Workout tab). */
  workouts: boolean;
  /** Shown on the website and at checkout. Hidden plans still work through a direct link. */
  visible: boolean;
  /** Highlighted as "Most popular". */
  featured: boolean;
  options: PlanOption[];
};

/** Legacy setting from the old checkout flow; plans now go straight to sign-up. */
export const CHECKOUT_MODE: "free" | "paid" = "free";

const ninety = ["1:1 video calls with your coach", "3rd month free"];

export const defaultPlans: PlanDef[] = [
  {
    id: "meal",
    name: "Meal Plan",
    tagline: "A personal diet plan from food you already eat.",
    features: ["Personalised meal plan", "Calorie & protein targets", "Daily tracking dashboard", "Chat with your coach", "Plan updates as you progress"],
    workouts: false,
    visible: true,
    featured: false,
    options: [
      { days: 30, price: 1499, badge: "", perks: [], calls: false },
      { days: 90, price: 2998, badge: "3rd month free", perks: ninety, calls: true },
    ],
  },
  {
    id: "meal-workout",
    name: "Meal + Workout",
    tagline: "Your diet plan plus training that gets harder each week.",
    features: ["Everything in Meal Plan", "Home or gym workout plan", "Workouts that progress weekly", "Form notes & swaps", "Workout logging in the app"],
    workouts: true,
    visible: true,
    featured: true,
    options: [
      { days: 30, price: 1999, badge: "", perks: [], calls: false },
      { days: 90, price: 3998, badge: "3rd month free", perks: ninety, calls: true },
    ],
  },
];

export const planKey = (id: string, days: number): PlanId => `${id}-${days}`;

export const PLAN_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "meal-workout-90" → { id: "meal-workout", days: 90 }. */
export function parsePlanKey(key: string | null | undefined): { id: string; days: number } | null {
  const m = key?.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)-(\d{1,4})$/);
  return m ? { id: m[1], days: Number(m[2]) } : null;
}

/** The plan and length for a key, only if both exist (for buying). */
export function findOption(plans: PlanDef[], key: string | null | undefined): { plan: PlanDef; option: PlanOption } | null {
  const k = parsePlanKey(key);
  const plan = k && plans.find((p) => p.id === k.id);
  const option = plan?.options.find((o) => o.days === k!.days);
  return plan && option ? { plan, option } : null;
}

export type PlanInfo = {
  key: PlanId;
  id: string;
  days: number;
  name: string;
  workouts: boolean;
  /** Current price for this length, or null if the coach removed it. */
  price: number | null;
  plan?: PlanDef;
  option?: PlanOption;
};

const titleCase = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Everything about a client's plan key, with sensible fallbacks if the coach has since removed it. */
export function planInfo(plans: PlanDef[], key: string | null | undefined): PlanInfo {
  const k = parsePlanKey(key) ?? { id: "meal-workout", days: 90 };
  const plan = plans.find((p) => p.id === k.id);
  const option = plan?.options.find((o) => o.days === k.days);
  return {
    key: planKey(k.id, k.days),
    id: k.id,
    days: k.days,
    name: plan?.name ?? titleCase(k.id),
    workouts: plan ? plan.workouts : /workout/.test(k.id),
    price: option?.price ?? null,
    plan,
    option,
  };
}

/** Plans shown on the website, in the coach's order. */
export const visiblePlans = (plans: PlanDef[]) => plans.filter((p) => p.visible && p.options.length);

/** Every length on offer (across the shown plans), shortest first. */
export const lengthsOf = (plans: PlanDef[]) => [...new Set(visiblePlans(plans).flatMap((p) => p.options.map((o) => o.days)))].sort((a, b) => a - b);

/** What a plan link without a valid key starts with: the "Most popular" plan's longest option. */
export function defaultPlanKey(plans: PlanDef[]): PlanId {
  const shown = visiblePlans(plans);
  const p = shown.find((x) => x.featured) ?? shown[0] ?? plans[0] ?? defaultPlans[1];
  const o = [...p.options].sort((a, b) => b.days - a.days)[0] ?? { days: 30 };
  return planKey(p.id, o.days);
}

/** A key that exists, or the default. */
export const validKeyOr = (plans: PlanDef[], key: string | null | undefined): PlanId => (findOption(plans, key) ? key! : defaultPlanKey(plans));

/** 30 → "30 days", 7 → "1 week", 365 → "1 year". */
export function lengthLabel(days: number) {
  if (days === 365) return "1 year";
  if (days % 7 === 0 && days <= 28) return days === 7 ? "1 week" : `${days / 7} weeks`;
  return days === 1 ? "1 day" : `${days} days`;
}

/** Rough per-month price, for comparing lengths. */
export const perMonth = (o: PlanOption) => Math.round((o.price / o.days) * 30);

/** Demo discount codes (defaults until the coach saves her own). */
export const discountCodes: Record<string, { pct: number; label: string }> = {
  EVO10: { pct: 10, label: "10% off" },
  WELCOME20: { pct: 20, label: "20% off" },
};

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
