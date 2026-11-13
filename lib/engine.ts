/*
 * The sample-day engine. A small rule-based drafter, the same idea as the
 * real first draft: work out calorie and protein targets, then fill each
 * meal with Indian dishes that fit the diet, skip allergens and avoid foods
 * that clash with health conditions. No AI service or API key involved.
 *
 * Numbers are rough per-serving estimates for a preview, not medical advice.
 */

import { photos } from "@/lib/site";

export type Goal = "lose" | "tone" | "build";
export type Diet = "veg" | "jain" | "egg" | "nonveg" | "vegan";
export type Sex = "female" | "male";
export type Activity = "sedentary" | "light" | "moderate" | "very";
export type Condition = "pcos" | "thyroid" | "diabetes" | "bp";
export type Allergen = "dairy" | "gluten" | "nuts" | "soy";
export type Slot = "breakfast" | "lunch" | "snack" | "dinner";

export type Dish = {
  id: string;
  name: string;
  serving: string;
  slots: Slot[];
  kcal: number;
  protein: number;
  /** veg = lacto-vegetarian base; egg / nonveg need those diets. */
  type: "veg" | "egg" | "nonveg";
  /** Has no dairy, egg or meat — fine for vegans. */
  vegan?: boolean;
  /** Made without onion, garlic or root veg. */
  jain?: boolean;
  allergens: Allergen[];
  highGI?: boolean;
  highSalt?: boolean;
  img?: string;
};

export const dishes: Dish[] = [
  // Breakfast
  { id: "moong-chilla", name: "Moong dal chilla + hung curd dip", serving: "2 chilla · ½ katori curd", slots: ["breakfast"], kcal: 320, protein: 20, type: "veg", jain: true, allergens: ["dairy"] },
  { id: "besan-chilla", name: "Besan chilla + mint chutney", serving: "2 chilla", slots: ["breakfast"], kcal: 290, protein: 14, type: "veg", vegan: true, allergens: [] },
  { id: "idli-sambar", name: "Idli + sambar + chutney", serving: "3 idli · 1 katori sambar", slots: ["breakfast", "dinner"], kcal: 300, protein: 11, type: "veg", vegan: true, allergens: [], img: photos.idliLeaf },
  { id: "poha", name: "Vegetable poha with peanuts", serving: "1½ bowls", slots: ["breakfast"], kcal: 310, protein: 8, type: "veg", vegan: true, allergens: ["nuts"], highGI: true },
  { id: "ragi-dosa", name: "Ragi dosa + coconut chutney", serving: "2 dosa", slots: ["breakfast"], kcal: 300, protein: 8, type: "veg", vegan: true, jain: true, allergens: [], img: photos.dosa },
  { id: "masala-oats", name: "Masala oats upma", serving: "1 bowl", slots: ["breakfast"], kcal: 280, protein: 10, type: "veg", vegan: true, allergens: [], highSalt: true },
  { id: "paneer-bhurji", name: "Paneer bhurji + multigrain roti", serving: "80g paneer · 1 roti", slots: ["breakfast"], kcal: 380, protein: 24, type: "veg", allergens: ["dairy", "gluten"] },
  { id: "egg-bhurji", name: "Egg bhurji + roti", serving: "3 eggs · 1 roti", slots: ["breakfast", "dinner"], kcal: 360, protein: 22, type: "egg", allergens: ["gluten"] },
  { id: "tofu-bhurji", name: "Tofu bhurji + roti", serving: "120g tofu · 1 roti", slots: ["breakfast"], kcal: 330, protein: 20, type: "veg", vegan: true, allergens: ["soy", "gluten"] },
  { id: "curd-bowl", name: "Hung curd fruit bowl with seeds", serving: "1 katori curd · ½ bowl fruit", slots: ["breakfast", "snack"], kcal: 240, protein: 17, type: "veg", jain: true, allergens: ["dairy"] },
  { id: "sprouts-chaat", name: "Sprouts chaat + chaas", serving: "1 bowl · 1 glass", slots: ["breakfast", "snack"], kcal: 230, protein: 13, type: "veg", allergens: ["dairy"] },

  // Lunch
  { id: "dal-roti", name: "Dal, roti & mixed veg sabzi", serving: "1 katori dal · 2 roti · 1 katori sabzi", slots: ["lunch", "dinner"], kcal: 520, protein: 20, type: "veg", vegan: true, allergens: ["gluten"], img: photos.rotiSabzi },
  { id: "rajma-rice", name: "Rajma + brown rice + salad", serving: "1 katori rajma · 1 bowl rice", slots: ["lunch"], kcal: 540, protein: 20, type: "veg", vegan: true, allergens: [] },
  { id: "chole-roti", name: "Chole + roti + kachumber", serving: "1 katori chole · 2 roti", slots: ["lunch"], kcal: 540, protein: 19, type: "veg", vegan: true, allergens: ["gluten"] },
  { id: "palak-paneer", name: "Palak paneer + roti", serving: "1 katori · 2 roti", slots: ["lunch", "dinner"], kcal: 540, protein: 26, type: "veg", allergens: ["dairy", "gluten"], img: photos.palakPaneer },
  { id: "khichdi", name: "Moong dal khichdi + curd", serving: "1½ bowls · 1 katori curd", slots: ["lunch", "dinner"], kcal: 470, protein: 19, type: "veg", jain: true, allergens: ["dairy"], img: photos.khichdi },
  { id: "lauki-chana", name: "Lauki chana dal + bajra roti", serving: "1 katori · 2 bajra roti", slots: ["lunch", "dinner"], kcal: 470, protein: 19, type: "veg", vegan: true, jain: true, allergens: [] },
  { id: "thali", name: "Home thali: dal, sabzi, roti, salad", serving: "1 plate", slots: ["lunch"], kcal: 560, protein: 21, type: "veg", allergens: ["dairy", "gluten"], img: photos.thali },
  { id: "chicken-curry", name: "Chicken curry + jeera rice + salad", serving: "150g chicken · 1 bowl rice", slots: ["lunch", "dinner"], kcal: 560, protein: 38, type: "nonveg", allergens: [], highGI: true, img: photos.chickenCurry },
  { id: "fish-curry", name: "Fish curry + rice", serving: "150g fish · 1 bowl rice", slots: ["lunch"], kcal: 520, protein: 34, type: "nonveg", allergens: [], highGI: true },
  { id: "egg-curry", name: "Egg curry + roti", serving: "2 eggs · 2 roti", slots: ["lunch", "dinner"], kcal: 500, protein: 24, type: "egg", allergens: ["gluten"] },
  { id: "soya-pulao", name: "Soya chunk pulao + raita", serving: "1½ bowls · 1 katori raita", slots: ["lunch"], kcal: 520, protein: 32, type: "veg", allergens: ["soy", "dairy"] },
  { id: "curd-rice", name: "Curd rice + kachumber", serving: "1½ bowls", slots: ["lunch"], kcal: 430, protein: 12, type: "veg", jain: true, allergens: ["dairy"], highGI: true },

  // Snacks
  { id: "makhana", name: "Roasted makhana + green tea", serving: "1 bowl", slots: ["snack"], kcal: 160, protein: 5, type: "veg", vegan: true, jain: true, allergens: [] },
  { id: "chana-chaas", name: "Roasted chana + chaas", serving: "30g · 1 glass", slots: ["snack"], kcal: 200, protein: 11, type: "veg", jain: true, allergens: ["dairy"] },
  { id: "fruit-almonds", name: "Seasonal fruit + almonds", serving: "1 fruit · 8 almonds", slots: ["snack"], kcal: 190, protein: 5, type: "veg", vegan: true, jain: true, allergens: ["nuts"] },
  { id: "boiled-eggs", name: "Boiled eggs + black coffee", serving: "2 eggs", slots: ["snack"], kcal: 160, protein: 12, type: "egg", allergens: [] },
  { id: "paneer-tikka", name: "Paneer tikka", serving: "100g", slots: ["snack", "dinner"], kcal: 270, protein: 18, type: "veg", allergens: ["dairy"], img: photos.paneerTikka },
  { id: "chai-biscuit", name: "Masala chai + biscuits", serving: "1 cup · 2 biscuits", slots: ["snack"], kcal: 180, protein: 4, type: "veg", jain: true, allergens: ["dairy", "gluten"], highGI: true },
  { id: "masala-papad", name: "Masala papad + chaas", serving: "2 papad · 1 glass", slots: ["snack"], kcal: 170, protein: 7, type: "veg", allergens: ["dairy"], highSalt: true },

  // Dinner
  { id: "grilled-chicken", name: "Grilled chicken + sautéed veg + roti", serving: "150g · 1 roti", slots: ["dinner"], kcal: 450, protein: 40, type: "nonveg", allergens: ["gluten"] },
  { id: "tofu-quinoa", name: "Tofu stir-fry + quinoa", serving: "120g tofu · 1 bowl", slots: ["dinner"], kcal: 430, protein: 26, type: "veg", vegan: true, allergens: ["soy"] },
  { id: "thepla-curd", name: "Methi thepla + curd", serving: "2 thepla · 1 katori curd", slots: ["dinner"], kcal: 420, protein: 14, type: "veg", allergens: ["dairy", "gluten"] },
  { id: "dal-jowar", name: "Dal + jowar roti + bhindi", serving: "1 katori · 2 roti", slots: ["dinner"], kcal: 450, protein: 18, type: "veg", vegan: true, allergens: [] },
  { id: "daliya", name: "Vegetable daliya + curd", serving: "1½ bowls", slots: ["dinner"], kcal: 390, protein: 14, type: "veg", jain: true, allergens: ["dairy", "gluten"] },
  { id: "fish-tikka", name: "Fish tikka + big salad", serving: "150g", slots: ["dinner"], kcal: 380, protein: 36, type: "nonveg", allergens: [] },
];

export type Inputs = {
  goal: Goal;
  diet: Diet;
  sex: Sex;
  weight: number;
  height: number;
  age: number;
  activity: Activity;
  conditions: Condition[];
  allergies: Allergen[];
};

export const defaultInputs: Inputs = {
  goal: "lose",
  diet: "veg",
  sex: "female",
  weight: 72,
  height: 162,
  age: 29,
  activity: "light",
  conditions: [],
  allergies: [],
};

const activityFactor: Record<Activity, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725 };
const goalFactor: Record<Goal, number> = { lose: 0.8, tone: 0.9, build: 1.1 };
const proteinPerKg: Record<Goal, number> = { lose: 1.5, tone: 1.6, build: 1.8 };

export const slotSplit: { slot: Slot; label: string; time: string; share: number }[] = [
  { slot: "breakfast", label: "Breakfast", time: "8:30 am", share: 0.25 },
  { slot: "lunch", label: "Lunch", time: "1:30 pm", share: 0.32 },
  { slot: "snack", label: "Evening snack", time: "5:30 pm", share: 0.13 },
  { slot: "dinner", label: "Dinner", time: "8:00 pm", share: 0.3 },
];

export function targets(i: Inputs) {
  // Mifflin–St Jeor BMR × activity × goal, with a sensible floor.
  const bmr = 10 * i.weight + 6.25 * i.height - 5 * i.age + (i.sex === "male" ? 5 : -161);
  const floor = i.sex === "male" ? 1500 : 1200;
  const kcal = Math.max(floor, Math.round((bmr * activityFactor[i.activity] * goalFactor[i.goal]) / 10) * 10);
  const protein = Math.min(160, Math.round(i.weight * proteinPerKg[i.goal]));
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, fat, carbs };
}

export const dietOk = (d: Dish, diet: Diet) => {
  if (diet === "nonveg") return true;
  if (diet === "egg") return d.type !== "nonveg";
  if (diet === "veg") return d.type === "veg";
  if (diet === "jain") return d.type === "veg" && !!d.jain;
  return d.type === "veg" && !!d.vegan; // vegan
};

const conditionLabel: Record<Condition, string> = { pcos: "PCOS", thyroid: "thyroid", diabetes: "diabetes", bp: "blood pressure" };
const allergenLabel: Record<Allergen, string> = { dairy: "dairy", gluten: "gluten", nuts: "nuts", soy: "soy" };

/** Why a dish clashes with these health conditions / allergies, or null. */
export function clash(d: Dish, i: Inputs): string | null {
  const hit = d.allergens.find((a) => i.allergies.includes(a));
  if (hit) return `contains ${allergenLabel[hit]}`;
  if (d.highGI && (i.conditions.includes("diabetes") || i.conditions.includes("pcos")))
    return `high-GI carbs (${conditionLabel[i.conditions.includes("diabetes") ? "diabetes" : "pcos"]})`;
  if (d.allergens.includes("soy") && i.conditions.includes("thyroid")) return "soy (thyroid)";
  if (d.highSalt && i.conditions.includes("bp")) return "high salt (blood pressure)";
  return null;
}

/** Words from the client's "foods you dislike" answer. */
export const dislikeWords = (p: { dislikes: string }) =>
  p.dislikes
    .toLowerCase()
    .split(/[,;/\n]| and /)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3);

export type Meal = {
  slot: Slot;
  label: string;
  time: string;
  dish: Dish | null;
  servings: number;
  kcal: number;
  protein: number;
};

export type Draft = {
  targets: ReturnType<typeof targets>;
  meals: Meal[];
  total: { kcal: number; protein: number };
  skipped: { name: string; reason: string }[];
};

const quarter = (n: number) => Math.round(n * 4) / 4;

/** Dishes that fit this person for a slot (diet, allergies and conditions). */
export function optionsFor(i: Inputs, slot: Slot) {
  return dishes.filter((d) => d.slots.includes(slot) && dietOk(d, i.diet) && !clash(d, i));
}

/** Scale a dish to a slot's calories, in quarter servings. */
export function portion(dish: Dish, slotKcal: number) {
  const servings = Math.min(2, Math.max(0.75, quarter(slotKcal / dish.kcal)));
  return { servings, kcal: Math.round(dish.kcal * servings), protein: Math.round(dish.protein * servings) };
}

/** Draft one day. `day` (0–6) rotates dishes so each day differs. */
export function draftDay(i: Inputs, day: number): Draft {
  const t = targets(i);
  const allowedByDiet = dishes.filter((d) => dietOk(d, i.diet));
  const skipped = allowedByDiet
    .map((d) => ({ name: d.name, reason: clash(d, i) }))
    .filter((x): x is { name: string; reason: string } => !!x.reason);
  const pool = allowedByDiet.filter((d) => !clash(d, i));

  const used = new Set<string>();
  const meals: Meal[] = slotSplit.map(({ slot, label, time, share }, si) => {
    const options = pool.filter((d) => d.slots.includes(slot));
    const slotKcal = t.kcal * share;
    if (!options.length) return { slot, label, time, dish: null, servings: 0, kcal: 0, protein: 0 };
    // Rotate by day, prefer higher-protein dishes first, and don't repeat a dish in one day.
    const ranked = [...options].sort((a, b) => b.protein / b.kcal - a.protein / a.kcal);
    let k = (day * 3 + si) % ranked.length;
    for (let n = 0; n < ranked.length && used.has(ranked[k].id); n++) k = (k + 1) % ranked.length;
    const dish = ranked[k];
    used.add(dish.id);
    const servings = Math.min(2, Math.max(0.75, quarter(slotKcal / dish.kcal)));
    return { slot, label, time, dish, servings, kcal: Math.round(dish.kcal * servings), protein: Math.round(dish.protein * servings) };
  });

  const total = meals.reduce((s, m) => ({ kcal: s.kcal + m.kcal, protein: s.protein + m.protein }), { kcal: 0, protein: 0 });
  return { targets: t, meals, total, skipped };
}

export const servingsLabel = (n: number) => {
  const whole = Math.floor(n);
  const frac = n - whole;
  const f = frac === 0.25 ? "¼" : frac === 0.5 ? "½" : frac === 0.75 ? "¾" : "";
  if (n === 1) return "1 serving";
  return `${whole || ""}${f} servings`;
};
