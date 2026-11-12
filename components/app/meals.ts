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

/** The day's meals from the plan engine, with any swaps the client made. */
export function dayMeals(profile: Profile, date: Date, log?: DayLog) {
  const draft = draftDay(profile, weekday(date));
  const meals: PlannedMeal[] = draft.meals.map((m) => {
    const swapId = log?.swaps[m.slot];
    const swapDish = swapId ? dishes.find((d) => d.id === swapId) : undefined;
    if (swapDish) {
      const share = slotSplit.find((s) => s.slot === m.slot)!.share;
      return { ...m, dish: swapDish, ...portion(swapDish, draft.targets.kcal * share), swapped: true };
    }
    return { ...m, swapped: false };
  });
  return { targets: draft.targets, meals, skipped: draft.skipped };
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
