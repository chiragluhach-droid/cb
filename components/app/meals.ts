import { Dish, Slot, dishes, draftDay, optionsFor, portion, slotSplit } from "@/lib/engine";
import type { DayLog, Profile } from "@/lib/demo-store";
import { weekday } from "@/lib/demo-store";

export type PlannedMeal = {
  slot: Slot;
  label: string;
  time: string;
  dish: Dish | null;
  servings: number;
  kcal: number;
  protein: number;
  swapped: boolean;
};

export const editKey = (day: number, slot: Slot) => `${day}-${slot}`;

/** One weekday (0 = Monday) of the plan: the engine's draft with the coach's edits applied. */
export function planWeekday(profile: Profile, day: number, edits?: Record<string, string>) {
  const draft = draftDay(profile, day);
  const meals = draft.meals.map((m) => {
    const id = edits?.[editKey(day, m.slot)];
    const dish = id ? dishes.find((d) => d.id === id) : undefined;
    if (!dish) return { ...m, edited: false };
    return { ...m, dish, ...portion(dish, draft.targets.kcal * slotShare(m.slot)), edited: true };
  });
  return { ...draft, meals };
}

/** The day's meals: the coach-approved plan, with any swaps the client made. */
export function dayMeals(profile: Profile, date: Date, log?: DayLog, edits?: Record<string, string>) {
  const plan = planWeekday(profile, weekday(date), edits);
  const meals: PlannedMeal[] = plan.meals.map(({ edited: _edited, ...m }) => {
    const swapId = log?.swaps[m.slot];
    const swapDish = swapId ? dishes.find((d) => d.id === swapId) : undefined;
    if (swapDish) {
      return { ...m, dish: swapDish, ...portion(swapDish, plan.targets.kcal * slotShare(m.slot)), swapped: true };
    }
    return { ...m, swapped: false };
  });
  return { targets: plan.targets, meals, skipped: plan.skipped };
}

/** Alternatives for a slot, closest in protein first. */
export function swapOptions(profile: Profile, slot: Slot, current: Dish | null, slotKcal: number) {
  return optionsFor(profile, slot)
    .filter((d) => d.id !== current?.id)
    .map((d) => ({ dish: d, ...portion(d, slotKcal) }))
    .sort((a, b) => Math.abs(a.protein - (current ? portion(current, slotKcal).protein : 0)) - Math.abs(b.protein - (current ? portion(current, slotKcal).protein : 0)));
}

export const slotShare = (slot: Slot) => slotSplit.find((s) => s.slot === slot)!.share;

export const stepGoal = (activity: Profile["activity"]) => ({ sedentary: 7000, light: 8000, moderate: 9000, very: 10000 })[activity];
