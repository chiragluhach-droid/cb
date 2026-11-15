/*
 * The sample-day engine. A small rule-based drafter, the same idea as the
 * real first draft: work out calorie and protein targets, then fill each
 * meal with dishes that fit the diet, skip allergens and avoid foods
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
  /** Unsplash photo id (built-in dishes). */
  img?: string;
  /** Full photo URL (the coach's own recipes). */
  photo?: string;
  /** One of the coach's own recipes (from the Recipes section). */
  custom?: boolean;
  /** Custom recipes are only used when picked by hand, unless this is on. */
  auto?: boolean;
  /** How to make it — the coach's own recipes have this. */
  recipe?: RecipeDetails;
  /** Exactly what to eat in one serving, with grams. */
  items?: Item[];
  /** Built-in Indian dishes are tagged so they're only used for clients who want them. */
  cuisine?: "indian";
  /** A built-in dish the coach has edited. */
  edited?: boolean;
};

export type RecipeCategory = "breakfast" | "main" | "salad" | "soup" | "snack" | "smoothie" | "dessert";
export type RecipeDetails = {
  category: RecipeCategory;
  prepMins: number;
  steps: string[];
  notes: string;
  /** Shown in every client's Recipes tab. */
  shared: boolean;
};

/* ───────────── Amounts ───────────── */

export type Unit = "g" | "ml" | "piece" | "slice" | "tbsp" | "tsp" | "cup";
/** One thing on the plate: e.g. { food: "wholegrain toast", qty: 2, unit: "slice", g: 70 }. */
export type Item = { food: string; qty: number; unit: Unit; g: number };

const frac = (n: number) => {
  const w = Math.floor(n);
  const f = Math.round((n - w) * 4) / 4;
  const sym = f === 0.25 ? "¼" : f === 0.5 ? "½" : f === 0.75 ? "¾" : "";
  return `${w || (sym ? "" : "0")}${sym}`;
};
const r5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
const rHalf = (n: number) => Math.max(0.5, Math.round(n * 2) / 2);
const rQuarter = (n: number) => Math.max(0.25, Math.round(n * 4) / 4);

/** "2 slices wholegrain toast (70 g)", "150 g chicken breast", "½ avocado (70 g)" — scaled to the servings eaten. */
export function amountText(it: Item, servings = 1) {
  const g = r5(it.g * servings);
  if (it.unit === "g" || it.unit === "ml") return `${r5(it.qty * servings)} ${it.unit} ${it.food}`;
  const q = it.unit === "piece" || it.unit === "slice" ? rHalf(it.qty * servings) : rQuarter(it.qty * servings);
  const unit = it.unit === "piece" ? "" : it.unit === "slice" ? (q > 1 ? " slices" : " slice") : it.unit === "cup" ? (q > 1 ? " cups" : " cup") : ` ${it.unit}`;
  return `${frac(q)}${unit} ${it.food} (${g} g)`;
}

/** What to eat, one line per item. Falls back to the dish's serving note. */
export const amounts = (d: Dish, servings = 1) => (d.items?.length ? d.items.map((it) => amountText(it, servings)) : [d.serving]);

/* ───────────── Dish library ───────────── */

const I = (food: string, qty: number, unit: Unit, g?: number): Item => ({ food, qty, unit, g: g ?? qty });

/** Built-in dishes. The coach can edit any of them (Coach › Recipes › Dish library). */
const baseDishes: Dish[] = [
  // Breakfast
  { id: "avo-toast-eggs", name: "Avocado toast + 2 poached eggs", serving: "2 slices · ½ avocado · 2 eggs", slots: ["breakfast"], kcal: 430, protein: 21, type: "egg", allergens: ["gluten"], img: photos.avoToast,
    items: [I("wholegrain toast", 2, "slice", 70), I("avocado", 0.5, "piece", 70), I("eggs", 2, "piece", 100)] },
  { id: "greek-yogurt-bowl", name: "Greek yogurt, berries & granola", serving: "1 bowl", slots: ["breakfast", "snack"], kcal: 330, protein: 24, type: "veg", jain: true, allergens: ["dairy", "gluten"],
    items: [I("Greek yogurt (2% fat)", 200, "g"), I("mixed berries", 80, "g"), I("granola", 30, "g"), I("honey", 1, "tsp", 7)] },
  { id: "porridge-berries", name: "Porridge with berries & almond butter", serving: "1 bowl", slots: ["breakfast"], kcal: 420, protein: 17, type: "veg", jain: true, allergens: ["dairy", "nuts", "gluten"], img: photos.berryOats,
    items: [I("rolled oats", 50, "g"), I("semi-skimmed milk", 250, "ml"), I("mixed berries", 80, "g"), I("almond butter", 1, "tbsp", 15)] },
  { id: "spinach-omelette", name: "Spinach & feta omelette + toast", serving: "3 eggs · 1 slice", slots: ["breakfast", "dinner"], kcal: 410, protein: 29, type: "egg", allergens: ["dairy", "gluten"],
    items: [I("eggs", 3, "piece", 150), I("feta", 30, "g"), I("spinach", 1, "cup", 30), I("wholegrain toast", 1, "slice", 35)] },
  { id: "english-breakfast", name: "Lighter English breakfast", serving: "1 plate", slots: ["breakfast"], kcal: 480, protein: 33, type: "nonveg", allergens: ["gluten"], highSalt: true,
    items: [I("scrambled eggs", 2, "piece", 100), I("lean back bacon", 2, "slice", 50), I("baked beans", 100, "g"), I("grilled tomatoes", 100, "g"), I("wholegrain toast", 1, "slice", 35)] },
  { id: "overnight-oats", name: "Overnight oats with chia & banana", serving: "1 jar", slots: ["breakfast"], kcal: 400, protein: 22, type: "veg", jain: true, allergens: ["dairy", "gluten"],
    items: [I("rolled oats", 50, "g"), I("Greek yogurt", 150, "g"), I("chia seeds", 1, "tbsp", 12), I("banana", 0.5, "piece", 60), I("milk", 100, "ml")] },
  { id: "green-smoothie", name: "Green protein smoothie", serving: "1 large glass", slots: ["breakfast", "snack"], kcal: 360, protein: 30, type: "veg", jain: true, allergens: ["dairy", "nuts"],
    items: [I("banana", 1, "piece", 120), I("spinach", 1, "cup", 30), I("whey protein", 30, "g"), I("unsweetened almond milk", 250, "ml"), I("peanut butter", 1, "tbsp", 15)] },
  { id: "tofu-scramble", name: "Tofu scramble on sourdough", serving: "150g tofu · 1 slice", slots: ["breakfast"], kcal: 370, protein: 24, type: "veg", vegan: true, allergens: ["soy", "gluten"],
    items: [I("firm tofu", 150, "g"), I("sourdough", 1, "slice", 50), I("spinach", 1, "cup", 30), I("olive oil", 1, "tsp", 5)] },
  { id: "cottage-toast", name: "Cottage cheese & tomato on rye", serving: "2 slices", slots: ["breakfast", "snack"], kcal: 340, protein: 24, type: "veg", jain: true, allergens: ["dairy", "gluten"],
    items: [I("rye bread", 2, "slice", 60), I("cottage cheese", 150, "g"), I("tomato", 1, "piece", 100)] },
  { id: "salmon-bagel", name: "Smoked salmon & cream cheese bagel", serving: "1 bagel", slots: ["breakfast"], kcal: 420, protein: 26, type: "nonveg", allergens: ["dairy", "gluten"], highSalt: true,
    items: [I("wholegrain bagel", 1, "piece", 85), I("smoked salmon", 60, "g"), I("light cream cheese", 30, "g"), I("cucumber", 50, "g")] },
  { id: "pb-banana-toast", name: "Peanut butter & banana toast", serving: "2 slices", slots: ["breakfast"], kcal: 430, protein: 16, type: "veg", vegan: true, jain: true, allergens: ["nuts", "gluten"],
    items: [I("wholegrain toast", 2, "slice", 70), I("peanut butter", 1.5, "tbsp", 24), I("banana", 1, "piece", 100)] },

  // Lunch & dinner
  { id: "chicken-caesar", name: "Chicken Caesar salad (lighter)", serving: "1 big bowl", slots: ["lunch", "dinner"], kcal: 450, protein: 45, type: "nonveg", allergens: ["dairy", "gluten"],
    items: [I("grilled chicken breast", 150, "g"), I("romaine lettuce", 2, "cup", 100), I("parmesan", 15, "g"), I("croutons", 20, "g"), I("light Caesar dressing", 2, "tbsp", 30)] },
  { id: "greek-chicken-salad", name: "Greek salad with chicken", serving: "1 big bowl", slots: ["lunch", "dinner"], kcal: 470, protein: 44, type: "nonveg", allergens: ["dairy"], img: photos.greekSalad,
    items: [I("grilled chicken breast", 150, "g"), I("cucumber", 100, "g"), I("tomatoes", 100, "g"), I("feta", 40, "g"), I("olives", 30, "g"), I("olive oil", 1, "tbsp", 10)] },
  { id: "quinoa-chickpea", name: "Quinoa & chickpea power bowl", serving: "1 bowl", slots: ["lunch", "dinner"], kcal: 560, protein: 20, type: "veg", vegan: true, allergens: [], img: photos.quinoaBowl,
    items: [I("quinoa (dry weight)", 60, "g"), I("chickpeas (cooked)", 120, "g"), I("avocado", 0.5, "piece", 70), I("roasted vegetables", 100, "g"), I("tahini", 1, "tbsp", 15)] },
  { id: "caprese-quinoa", name: "Caprese quinoa salad", serving: "1 bowl", slots: ["lunch", "dinner"], kcal: 470, protein: 22, type: "veg", jain: true, allergens: ["dairy"], img: photos.berrySalad,
    items: [I("quinoa (dry weight)", 60, "g"), I("mozzarella", 60, "g"), I("cherry tomatoes", 100, "g"), I("rocket", 1, "cup", 25), I("olive oil", 1, "tbsp", 10)] },
  { id: "halloumi-salad", name: "Grilled halloumi & chickpea salad", serving: "1 big bowl", slots: ["lunch", "dinner"], kcal: 520, protein: 26, type: "veg", jain: true, allergens: ["dairy"],
    items: [I("halloumi", 60, "g"), I("chickpeas (cooked)", 120, "g"), I("cucumber", 100, "g"), I("cherry tomatoes", 100, "g"), I("lemon & olive oil dressing", 1, "tbsp", 15)] },
  { id: "cottage-quinoa-bowl", name: "Cottage cheese, quinoa & greens bowl", serving: "1 bowl", slots: ["lunch", "dinner"], kcal: 460, protein: 32, type: "veg", jain: true, allergens: ["dairy"],
    items: [I("cottage cheese", 150, "g"), I("quinoa (dry weight)", 50, "g"), I("spinach & rocket", 1, "cup", 30), I("cucumber", 80, "g"), I("pumpkin seeds", 1, "tbsp", 10)] },
  { id: "salmon-quinoa", name: "Baked salmon, quinoa & greens", serving: "150g salmon · 1 bowl", slots: ["lunch", "dinner"], kcal: 560, protein: 40, type: "nonveg", allergens: [], img: photos.salmonQuinoa,
    items: [I("salmon fillet", 150, "g"), I("quinoa (dry weight)", 60, "g"), I("green beans", 100, "g")] },
  { id: "turkey-wrap", name: "Turkey & hummus wholegrain wrap", serving: "1 wrap", slots: ["lunch"], kcal: 450, protein: 36, type: "nonveg", allergens: ["gluten"],
    items: [I("wholegrain wrap", 1, "piece", 60), I("turkey breast", 100, "g"), I("hummus", 40, "g"), I("salad leaves", 1, "cup", 30), I("peppers", 50, "g")] },
  { id: "tuna-jacket", name: "Jacket potato with tuna & sweetcorn", serving: "1 potato", slots: ["lunch", "dinner"], kcal: 480, protein: 36, type: "nonveg", allergens: ["dairy"], highGI: true,
    items: [I("baking potato", 1, "piece", 250), I("tuna in spring water", 110, "g"), I("Greek yogurt (instead of mayo)", 2, "tbsp", 30), I("sweetcorn", 50, "g"), I("side salad", 80, "g")] },
  { id: "chicken-rice-broccoli", name: "Chicken, rice & broccoli", serving: "150g chicken · 1 bowl", slots: ["lunch", "dinner"], kcal: 520, protein: 45, type: "nonveg", allergens: [],
    items: [I("chicken breast", 150, "g"), I("basmati rice (dry weight)", 60, "g"), I("broccoli", 150, "g"), I("olive oil", 1, "tsp", 5)] },
  { id: "steak-sweet-potato", name: "Lean steak, sweet potato & greens", serving: "150g steak", slots: ["dinner"], kcal: 560, protein: 42, type: "nonveg", allergens: [], img: photos.steak,
    items: [I("sirloin steak (trimmed)", 150, "g"), I("sweet potato", 200, "g"), I("spinach or kale", 100, "g")] },
  { id: "lentil-soup", name: "Red lentil soup + wholegrain bread", serving: "1 bowl · 1 slice", slots: ["lunch", "dinner"], kcal: 420, protein: 22, type: "veg", vegan: true, allergens: ["gluten"],
    items: [I("lentil soup (from 60 g dry lentils)", 350, "ml"), I("wholegrain bread", 1, "slice", 40)] },
  { id: "falafel-bowl", name: "Falafel & hummus buddha bowl", serving: "1 bowl", slots: ["lunch", "dinner"], kcal: 520, protein: 18, type: "veg", vegan: true, allergens: [], img: photos.buddhaBowl,
    items: [I("baked falafel", 4, "piece", 100), I("hummus", 40, "g"), I("brown rice (cooked)", 100, "g"), I("mixed salad", 100, "g"), I("pickled red onion", 20, "g")] },
  { id: "prawn-stirfry", name: "Prawn & veg stir-fry with noodles", serving: "1 plate", slots: ["dinner"], kcal: 470, protein: 36, type: "nonveg", allergens: ["soy", "gluten"], highSalt: true,
    items: [I("prawns", 150, "g"), I("wholewheat noodles (dry weight)", 60, "g"), I("stir-fry vegetables", 150, "g"), I("light soy sauce", 1, "tbsp", 15)] },
  { id: "fajita-bowl", name: "Chicken fajita burrito bowl", serving: "1 bowl", slots: ["lunch", "dinner"], kcal: 560, protein: 48, type: "nonveg", allergens: ["dairy"], img: photos.chickenBowl,
    items: [I("chicken breast", 150, "g"), I("black beans", 100, "g"), I("brown rice (cooked)", 100, "g"), I("salsa", 50, "g"), I("Greek yogurt", 30, "g")] },
  { id: "bean-chilli", name: "Three-bean chilli + brown rice", serving: "1 bowl", slots: ["lunch", "dinner"], kcal: 480, protein: 20, type: "veg", allergens: ["dairy"],
    items: [I("three-bean chilli", 200, "g"), I("brown rice (cooked)", 120, "g"), I("Greek yogurt", 30, "g")] },
  { id: "tofu-quinoa", name: "Tofu stir-fry + quinoa", serving: "120g tofu · 1 bowl", slots: ["dinner"], kcal: 450, protein: 27, type: "veg", vegan: true, allergens: ["soy"],
    items: [I("firm tofu", 120, "g"), I("quinoa (dry weight)", 60, "g"), I("stir-fry vegetables", 150, "g")] },
  { id: "egg-sandwich", name: "Egg & avocado sandwich", serving: "1 sandwich", slots: ["lunch"], kcal: 430, protein: 20, type: "egg", allergens: ["gluten"],
    items: [I("wholegrain bread", 2, "slice", 70), I("eggs", 2, "piece", 100), I("avocado", 0.25, "piece", 35), I("salad leaves", 1, "cup", 30)] },
  { id: "pesto-pasta", name: "Wholewheat chicken pesto pasta", serving: "1 bowl", slots: ["lunch", "dinner"], kcal: 560, protein: 42, type: "nonveg", allergens: ["dairy", "gluten", "nuts"],
    items: [I("wholewheat pasta (dry weight)", 70, "g"), I("chicken breast", 120, "g"), I("pesto", 1, "tbsp", 15), I("cherry tomatoes", 80, "g")] },
  { id: "shakshuka", name: "Shakshuka + sourdough", serving: "2 eggs · 1 slice", slots: ["lunch", "dinner"], kcal: 420, protein: 21, type: "egg", allergens: ["dairy", "gluten"],
    items: [I("eggs", 2, "piece", 100), I("tomato & pepper sauce", 200, "g"), I("feta", 20, "g"), I("sourdough", 1, "slice", 50)] },
  { id: "cod-potatoes", name: "Baked cod, new potatoes & roast veg", serving: "1 plate", slots: ["dinner"], kcal: 420, protein: 38, type: "nonveg", allergens: [], img: photos.salmon,
    items: [I("cod fillet", 180, "g"), I("new potatoes", 150, "g"), I("roasted vegetables", 150, "g")] },

  // Snacks
  { id: "apple-pb", name: "Apple + peanut butter", serving: "1 apple · 1 tbsp", slots: ["snack"], kcal: 190, protein: 5, type: "veg", vegan: true, jain: true, allergens: ["nuts"],
    items: [I("apple", 1, "piece", 150), I("peanut butter", 1, "tbsp", 16)] },
  { id: "yogurt-walnuts", name: "Greek yogurt with honey & walnuts", serving: "1 pot", slots: ["snack"], kcal: 200, protein: 16, type: "veg", jain: true, allergens: ["dairy", "nuts"],
    items: [I("Greek yogurt", 150, "g"), I("honey", 1, "tsp", 7), I("walnuts", 10, "g")] },
  { id: "boiled-eggs", name: "Boiled eggs + cherry tomatoes", serving: "2 eggs", slots: ["snack"], kcal: 170, protein: 13, type: "egg", allergens: [],
    items: [I("boiled eggs", 2, "piece", 100), I("cherry tomatoes", 80, "g")] },
  { id: "hummus-veg", name: "Hummus & veggie sticks", serving: "1 pot", slots: ["snack"], kcal: 190, protein: 6, type: "veg", vegan: true, allergens: [],
    items: [I("hummus", 60, "g"), I("carrot, cucumber & pepper sticks", 150, "g")] },
  { id: "protein-shake", name: "Protein shake + banana", serving: "1 shake", slots: ["snack"], kcal: 230, protein: 27, type: "veg", jain: true, allergens: ["dairy"],
    items: [I("whey protein", 30, "g"), I("skimmed milk", 250, "ml"), I("small banana", 1, "piece", 90)] },
  { id: "cottage-pineapple", name: "Cottage cheese & pineapple", serving: "1 pot", slots: ["snack"], kcal: 180, protein: 18, type: "veg", jain: true, allergens: ["dairy"],
    items: [I("cottage cheese", 150, "g"), I("pineapple", 80, "g")] },
  { id: "edamame", name: "Steamed edamame with sea salt", serving: "1 bowl", slots: ["snack"], kcal: 180, protein: 17, type: "veg", vegan: true, jain: true, allergens: ["soy"],
    items: [I("edamame (in pods)", 150, "g")] },
  { id: "almonds-choc", name: "Almonds + dark chocolate", serving: "1 small handful", slots: ["snack"], kcal: 180, protein: 5, type: "veg", vegan: true, jain: true, allergens: ["nuts"],
    items: [I("almonds", 20, "g"), I("dark chocolate (85%)", 10, "g")] },

  // Indian favourites — only for clients who chose Indian food
  { id: "moong-chilla", name: "Moong dal chilla + Greek yogurt dip", serving: "2 chilla", slots: ["breakfast"], kcal: 320, protein: 20, type: "veg", jain: true, allergens: ["dairy"], cuisine: "indian",
    items: [I("moong dal chilla", 2, "piece", 120), I("Greek yogurt", 80, "g")] },
  { id: "idli-sambar", name: "Idli + sambar + chutney", serving: "3 idli", slots: ["breakfast", "dinner"], kcal: 300, protein: 11, type: "veg", vegan: true, allergens: [], img: photos.idliLeaf, cuisine: "indian",
    items: [I("idli", 3, "piece", 120), I("sambar", 150, "ml"), I("coconut chutney", 2, "tbsp", 30)] },
  { id: "paneer-bhurji", name: "Paneer bhurji + multigrain roti", serving: "80g paneer · 1 roti", slots: ["breakfast", "dinner"], kcal: 380, protein: 24, type: "veg", allergens: ["dairy", "gluten"], cuisine: "indian",
    items: [I("paneer", 80, "g"), I("multigrain roti", 1, "piece", 30), I("onion, tomato & peppers", 80, "g")] },
  { id: "dal-roti", name: "Dal, roti & mixed veg sabzi", serving: "1 bowl dal · 2 roti", slots: ["lunch", "dinner"], kcal: 520, protein: 20, type: "veg", vegan: true, allergens: ["gluten"], img: photos.rotiSabzi, cuisine: "indian",
    items: [I("dal (cooked)", 150, "g"), I("wholewheat roti", 2, "piece", 60), I("mixed veg sabzi", 150, "g")] },
  { id: "palak-paneer", name: "Palak paneer + roti", serving: "1 bowl · 2 roti", slots: ["lunch", "dinner"], kcal: 540, protein: 26, type: "veg", allergens: ["dairy", "gluten"], img: photos.palakPaneer, cuisine: "indian",
    items: [I("palak paneer (80 g paneer)", 200, "g"), I("wholewheat roti", 2, "piece", 60)] },
  { id: "khichdi", name: "Moong dal khichdi + Greek yogurt", serving: "1 bowl", slots: ["lunch", "dinner"], kcal: 470, protein: 19, type: "veg", jain: true, allergens: ["dairy"], img: photos.khichdi, cuisine: "indian",
    items: [I("khichdi (cooked)", 300, "g"), I("Greek yogurt", 100, "g")] },
  { id: "chicken-curry", name: "Chicken curry + rice + salad", serving: "150g chicken · 1 bowl rice", slots: ["lunch", "dinner"], kcal: 560, protein: 38, type: "nonveg", allergens: [], highGI: true, img: photos.chickenCurry, cuisine: "indian",
    items: [I("chicken curry (150 g chicken)", 250, "g"), I("basmati rice (cooked)", 150, "g"), I("kachumber salad", 80, "g")] },
  { id: "rajma-rice", name: "Rajma + brown rice + salad", serving: "1 bowl", slots: ["lunch"], kcal: 540, protein: 20, type: "veg", vegan: true, allergens: [], cuisine: "indian",
    items: [I("rajma (cooked)", 200, "g"), I("brown rice (cooked)", 150, "g"), I("salad", 80, "g")] },
  { id: "roasted-chana", name: "Roasted chana + buttermilk", serving: "30g · 1 glass", slots: ["snack"], kcal: 200, protein: 11, type: "veg", jain: true, allergens: ["dairy"], cuisine: "indian",
    items: [I("roasted chana", 30, "g"), I("buttermilk", 250, "ml")] },
];

/** The live dish list: built-ins (with any coach edits applied) plus the coach's own recipes. */
export const dishes: Dish[] = [...baseDishes];
export const baseDishIds = new Set(baseDishes.map((d) => d.id));
export const originalDish = (id: string) => baseDishes.find((d) => d.id === id);

/**
 * Apply the coach's recipes and edits. A recipe whose id matches a built-in
 * dish replaces it (an edit); the rest are added as her own recipes. Called
 * whenever recipes load.
 */
export function registerRecipes(list: Dish[]) {
  const byId = new Map(list.map((d) => [d.id, d]));
  dishes.length = 0;
  for (const b of baseDishes) {
    const o = byId.get(b.id);
    dishes.push(o ? { ...b, ...o, id: b.id, cuisine: b.cuisine, img: o.photo ? undefined : b.img, custom: false, edited: true } : b);
  }
  for (const d of list) if (!baseDishIds.has(d.id)) dishes.push({ ...d, custom: true });
}

/** Indian dishes are only drafted for clients who said they like Indian food. */
const cuisineOk = (d: Dish, i: Inputs) => {
  if (d.cuisine !== "indian") return true;
  const life = (i as { life?: { cuisines: string[] } }).life;
  return !life || life.cuisines.includes("indian");
};

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
  return dishes.filter((d) => d.slots.includes(slot) && dietOk(d, i.diet) && cuisineOk(d, i) && !clash(d, i));
}

/** Scale a dish to a slot's calories, in quarter servings. */
export function portion(dish: Dish, slotKcal: number) {
  const servings = Math.min(2, Math.max(0.75, quarter(slotKcal / dish.kcal)));
  return { servings, kcal: Math.round(dish.kcal * servings), protein: Math.round(dish.protein * servings) };
}

/** Draft one day. `day` (0–6) rotates dishes so each day differs. */
export function draftDay(i: Inputs, day: number): Draft {
  const t = targets(i);
  // The coach's recipes only go into automatic drafts when she's allowed it.
  const allowedByDiet = dishes.filter((d) => dietOk(d, i.diet) && cuisineOk(d, i) && (!d.custom || d.auto));
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
