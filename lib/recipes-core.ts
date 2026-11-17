/*
 * The coach's recipe book — labels and input checks shared by the browser and
 * the server. No React here.
 */

import type { Allergen, Item, RecipeCategory, Slot, Unit } from "@/lib/engine";

export const recipeCategories: { v: RecipeCategory; l: string }[] = [
  { v: "breakfast", l: "Breakfast" },
  { v: "main", l: "Main meal" },
  { v: "salad", l: "Salad" },
  { v: "soup", l: "Soup" },
  { v: "snack", l: "Snack" },
  { v: "smoothie", l: "Smoothie" },
  { v: "dessert", l: "Dessert" },
];
export const slotOptions: { v: Slot; l: string }[] = [
  { v: "breakfast", l: "Breakfast" },
  { v: "lunch", l: "Lunch" },
  { v: "snack", l: "Snack" },
  { v: "dinner", l: "Dinner" },
];
export const allergenOptions: { v: Allergen; l: string }[] = [
  { v: "dairy", l: "Dairy" },
  { v: "gluten", l: "Gluten" },
  { v: "nuts", l: "Nuts" },
  { v: "soy", l: "Soy" },
];
/** Which meals a category usually fits — used to pre-tick the meal slots. */
export const categorySlots: Record<RecipeCategory, Slot[]> = {
  breakfast: ["breakfast"],
  main: ["lunch", "dinner"],
  salad: ["lunch", "dinner"],
  soup: ["lunch", "dinner"],
  snack: ["snack"],
  smoothie: ["breakfast", "snack"],
  dessert: ["snack"],
};

export type RecipeInput = {
  name: string;
  serving: string;
  slots: Slot[];
  kcal: number;
  protein: number;
  type: "veg" | "egg" | "nonveg";
  vegan: boolean;
  jain: boolean;
  allergens: Allergen[];
  category: RecipeCategory;
  prepMins: number;
  /** What's in one serving, with grams. */
  items: Item[];
  steps: string[];
  notes: string;
  shared: boolean;
  auto: boolean;
  /** Has its own public page at /recipes/<slug>, for sharing on Instagram etc. */
  public: boolean;
};

export const unitOptions: { v: Unit; l: string }[] = [
  { v: "g", l: "g" },
  { v: "ml", l: "ml" },
  { v: "piece", l: "pieces" },
  { v: "slice", l: "slices" },
  { v: "tbsp", l: "tbsp" },
  { v: "tsp", l: "tsp" },
  { v: "cup", l: "cups" },
];

export const emptyRecipe: RecipeInput = {
  name: "",
  serving: "1 bowl",
  slots: ["lunch", "dinner"],
  kcal: 400,
  protein: 20,
  type: "veg",
  vegan: false,
  jain: false,
  allergens: [],
  category: "main",
  prepMins: 20,
  items: [],
  steps: [],
  notes: "",
  shared: true,
  auto: false,
  public: true,
};

const lines = (v: unknown, max: number, len: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, len)).filter(Boolean).slice(0, max) : [];
const n = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v) : null);
const pick = <T extends string>(v: unknown, opts: { v: T }[]): T | null => (opts.some((o) => o.v === v) ? (v as T) : null);

/** A cleaned-up recipe, or an error message for the coach. */
export function readRecipe(b: unknown): { ok: true; recipe: RecipeInput } | { ok: false; error: string } {
  if (!b || typeof b !== "object") return { ok: false, error: "Bad request." };
  const x = b as Record<string, unknown>;
  const name = typeof x.name === "string" ? x.name.trim().slice(0, 80) : "";
  if (name.length < 2) return { ok: false, error: "Give the recipe a name." };
  const slots = Array.isArray(x.slots) ? [...new Set(x.slots.map((s) => pick(s, slotOptions)).filter((s): s is Slot => !!s))] : [];
  if (!slots.length) return { ok: false, error: "Pick at least one meal it suits." };
  const kcal = n(x.kcal, 20, 2000);
  const protein = n(x.protein, 0, 200);
  if (kcal === null) return { ok: false, error: "Calories must be between 20 and 2000." };
  if (protein === null) return { ok: false, error: "Protein must be between 0 and 200 g." };
  const category = pick(x.category, recipeCategories) ?? "main";
  const type = x.type === "nonveg" || x.type === "egg" ? x.type : "veg";
  return {
    ok: true,
    recipe: {
      name,
      serving: typeof x.serving === "string" && x.serving.trim() ? x.serving.trim().slice(0, 60) : "1 serving",
      slots,
      kcal,
      protein,
      type,
      vegan: type === "veg" && x.vegan === true,
      jain: x.jain === true,
      allergens: Array.isArray(x.allergens) ? [...new Set(x.allergens.map((a) => pick(a, allergenOptions)).filter((a): a is Allergen => !!a))] : [],
      category,
      prepMins: n(x.prepMins, 0, 600) ?? 0,
      items: readItems(x.items),
      steps: lines(x.steps, 30, 400),
      notes: typeof x.notes === "string" ? x.notes.trim().slice(0, 600) : "",
      shared: x.shared !== false,
      auto: x.auto === true,
      public: x.public !== false,
    },
  };
}

/** Ingredient rows: food, amount, unit and grams (grams = amount for g/ml). */
function readItems(v: unknown): Item[] {
  if (!Array.isArray(v)) return [];
  const out: Item[] = [];
  for (const raw of v.slice(0, 40)) {
    if (!raw || typeof raw !== "object") continue;
    const x = raw as Record<string, unknown>;
    const food = typeof x.food === "string" ? x.food.trim().slice(0, 60) : "";
    const unit = unitOptions.find((u) => u.v === x.unit)?.v;
    const qty = typeof x.qty === "number" && Number.isFinite(x.qty) && x.qty > 0 && x.qty <= 5000 ? Math.round(x.qty * 100) / 100 : null;
    if (!food || !unit || qty === null) continue;
    const g = unit === "g" || unit === "ml" ? qty : typeof x.g === "number" && Number.isFinite(x.g) && x.g >= 0 && x.g <= 5000 ? Math.round(x.g) : 0;
    out.push({ food, qty, unit, g });
  }
  return out;
}

/** "Weight-loss Dahi Bhalla!" → "weight-loss-dahi-bhalla" (for /recipes/<slug>). */
export function slugify(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "recipe"
  );
}
