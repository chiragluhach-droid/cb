// Per-serving macros for everyday Indian foods.
// type: vegan < veg (dairy) < egg < nonveg  — a diet can eat its own level and below.
// flags: highGI (limit for PCOS/diabetes), soy (limit for thyroid), dairy, refined
export const FOODS = {
  roti:        { name: "Phulka roti", unit: "roti", per: 1, kcal: 85, p: 3, c: 18, f: 0.5, type: "vegan" },
  bajraRoti:   { name: "Bajra / jowar roti", unit: "roti", per: 1, kcal: 95, p: 3, c: 19, f: 1, type: "vegan" },
  rice:        { name: "Steamed rice", unit: "katori", per: 1, kcal: 195, p: 4, c: 43, f: 0.4, type: "vegan", flags: ["highGI"] },
  brownRice:   { name: "Brown rice", unit: "katori", per: 1, kcal: 165, p: 3.5, c: 34, f: 1.3, type: "vegan" },
  quinoa:      { name: "Quinoa", unit: "katori", per: 1, kcal: 180, p: 6.5, c: 32, f: 3, type: "vegan" },
  dal:         { name: "Dal (toor/moong)", unit: "katori", per: 1, kcal: 150, p: 9, c: 20, f: 4, type: "vegan" },
  rajma:       { name: "Rajma", unit: "katori", per: 1, kcal: 180, p: 10, c: 28, f: 3, type: "vegan" },
  chole:       { name: "Chole", unit: "katori", per: 1, kcal: 210, p: 10, c: 30, f: 6, type: "vegan" },
  sambar:      { name: "Sambar", unit: "katori", per: 1, kcal: 110, p: 5, c: 16, f: 3, type: "vegan" },
  sabzi:       { name: "Mixed veg sabzi", unit: "katori", per: 1, kcal: 100, p: 3, c: 12, f: 5, type: "vegan" },
  palak:       { name: "Palak / methi sabzi", unit: "katori", per: 1, kcal: 90, p: 4, c: 8, f: 5, type: "vegan" },
  salad:       { name: "Kachumber salad", unit: "bowl", per: 1, kcal: 40, p: 2, c: 8, f: 0, type: "vegan" },
  paneer:      { name: "Paneer", unit: "g", per: 50, kcal: 135, p: 9, c: 2, f: 10, type: "veg", flags: ["dairy"] },
  tofu:        { name: "Tofu", unit: "g", per: 100, kcal: 120, p: 13, c: 3, f: 7, type: "vegan", flags: ["soy"] },
  soya:        { name: "Soya chunks (dry)", unit: "g", per: 30, kcal: 105, p: 16, c: 10, f: 0.2, type: "vegan", flags: ["soy"] },
  curd:        { name: "Curd", unit: "katori", per: 1, kcal: 90, p: 5, c: 7, f: 5, type: "veg", flags: ["dairy"] },
  hungCurd:    { name: "Hung curd / Greek yogurt", unit: "g", per: 150, kcal: 110, p: 15, c: 6, f: 3, type: "veg", flags: ["dairy"] },
  milk:        { name: "Toned milk", unit: "ml", per: 200, kcal: 120, p: 6.5, c: 9.5, f: 6, type: "veg", flags: ["dairy"] },
  buttermilk:  { name: "Chaas", unit: "glass", per: 1, kcal: 40, p: 2, c: 5, f: 1, type: "veg", flags: ["dairy"] },
  whey:        { name: "Whey protein", unit: "scoop", per: 1, kcal: 120, p: 24, c: 3, f: 1.5, type: "veg", flags: ["dairy"] },
  plantProtein:{ name: "Plant protein (pea)", unit: "scoop", per: 1, kcal: 115, p: 22, c: 3, f: 2, type: "vegan" },
  egg:         { name: "Whole egg", unit: "egg", per: 1, kcal: 75, p: 6, c: 0.5, f: 5, type: "egg" },
  eggWhite:    { name: "Egg whites", unit: "whites", per: 3, kcal: 50, p: 11, c: 1, f: 0, type: "egg" },
  chicken:     { name: "Chicken breast (cooked)", unit: "g", per: 100, kcal: 165, p: 31, c: 0, f: 3.6, type: "nonveg" },
  chickenCurry:{ name: "Home-style chicken curry", unit: "katori", per: 1, kcal: 240, p: 25, c: 6, f: 13, type: "nonveg" },
  fish:        { name: "Fish (grilled/curry)", unit: "g", per: 100, kcal: 140, p: 24, c: 0, f: 4, type: "nonveg" },
  poha:        { name: "Poha", unit: "plate", per: 1, kcal: 250, p: 5, c: 45, f: 6, type: "vegan", flags: ["highGI"] },
  upma:        { name: "Upma", unit: "plate", per: 1, kcal: 230, p: 6, c: 35, f: 7, type: "vegan", flags: ["refined"] },
  oats:        { name: "Oats", unit: "g", per: 40, kcal: 150, p: 5, c: 27, f: 3, type: "vegan" },
  dalia:       { name: "Dalia", unit: "bowl", per: 1, kcal: 170, p: 6, c: 32, f: 2, type: "vegan" },
  besanChilla: { name: "Besan chilla", unit: "chilla", per: 1, kcal: 120, p: 6, c: 14, f: 4, type: "vegan" },
  moongChilla: { name: "Moong dal chilla", unit: "chilla", per: 1, kcal: 110, p: 7, c: 14, f: 3, type: "vegan" },
  idli:        { name: "Idli", unit: "idli", per: 1, kcal: 40, p: 1.5, c: 8, f: 0.2, type: "vegan", flags: ["highGI"] },
  dosa:        { name: "Plain dosa", unit: "dosa", per: 1, kcal: 130, p: 3, c: 22, f: 3.5, type: "vegan", flags: ["highGI"] },
  khichdi:     { name: "Moong dal khichdi", unit: "bowl", per: 1, kcal: 220, p: 8, c: 38, f: 4, type: "vegan" },
  bread:       { name: "Multigrain bread", unit: "slice", per: 1, kcal: 70, p: 3, c: 12, f: 1, type: "vegan", flags: ["refined"] },
  peanutButter:{ name: "Peanut butter", unit: "tbsp", per: 1, kcal: 95, p: 4, c: 3, f: 8, type: "vegan" },
  banana:      { name: "Banana", unit: "banana", per: 1, kcal: 105, p: 1.3, c: 27, f: 0.4, type: "vegan" },
  apple:       { name: "Apple", unit: "apple", per: 1, kcal: 95, p: 0.5, c: 25, f: 0.3, type: "vegan" },
  fruit:       { name: "Seasonal fruit bowl", unit: "bowl", per: 1, kcal: 90, p: 1, c: 22, f: 0.3, type: "vegan" },
  chana:       { name: "Roasted chana", unit: "g", per: 30, kcal: 110, p: 6, c: 18, f: 2, type: "vegan" },
  peanuts:     { name: "Roasted peanuts", unit: "g", per: 20, kcal: 115, p: 5, c: 3, f: 10, type: "vegan" },
  almonds:     { name: "Almonds", unit: "almonds", per: 10, kcal: 70, p: 2.5, c: 2.5, f: 6, type: "vegan" },
  sprouts:     { name: "Sprouts chaat", unit: "bowl", per: 1, kcal: 120, p: 9, c: 20, f: 1, type: "vegan" },
  makhana:     { name: "Roasted makhana", unit: "g", per: 25, kcal: 90, p: 2.5, c: 19, f: 0.1, type: "vegan" },
  ghee:        { name: "Ghee", unit: "tsp", per: 1, kcal: 45, p: 0, c: 0, f: 5, type: "veg", flags: ["dairy"] },
  coconutWater:{ name: "Coconut water", unit: "glass", per: 1, kcal: 45, p: 0.5, c: 11, f: 0, type: "vegan" },
};

// Dish templates per meal slot: [foodKey, servings]
export const TEMPLATES = {
  breakfast: [
    { name: "Besan chilla + curd", items: [["besanChilla", 2], ["curd", 1]] },
    { name: "Moong dal chilla + hung curd dip", items: [["moongChilla", 2], ["hungCurd", 0.5]] },
    { name: "Overnight oats with banana & almonds", items: [["oats", 1], ["milk", 1], ["banana", 0.5], ["almonds", 1]] },
    { name: "Veggie poha + peanuts", items: [["poha", 1], ["peanuts", 0.5]] },
    { name: "Idli sambar", items: [["idli", 3], ["sambar", 1]] },
    { name: "Paneer stuffed roti + curd", items: [["roti", 2], ["paneer", 1], ["curd", 0.5]] },
    { name: "Tofu bhurji toast", items: [["tofu", 1], ["bread", 2]] },
    { name: "Masala dalia", items: [["dalia", 1], ["peanuts", 0.5]] },
    { name: "Egg bhurji + toast", items: [["egg", 2], ["eggWhite", 1], ["bread", 2]] },
    { name: "Masala omelette + roti", items: [["egg", 2], ["roti", 1], ["salad", 0.5]] },
  ],
  lunch: [
    { name: "Dal, roti, sabzi & salad", items: [["dal", 1], ["roti", 2], ["sabzi", 1], ["salad", 1]] },
    { name: "Rajma chawal + salad", items: [["rajma", 1], ["rice", 1], ["salad", 1]] },
    { name: "Chole + roti + kachumber", items: [["chole", 1], ["roti", 2], ["salad", 1]] },
    { name: "Paneer sabzi, dal & roti", items: [["paneer", 1], ["dal", 0.5], ["roti", 2], ["salad", 1]] },
    { name: "Soya pulao + raita", items: [["soya", 1], ["brownRice", 1], ["curd", 1]] },
    { name: "Sambar rice + palak", items: [["sambar", 1], ["brownRice", 1], ["palak", 1]] },
    { name: "Chicken curry + rice + salad", items: [["chickenCurry", 1], ["rice", 1], ["salad", 1]] },
    { name: "Fish curry + brown rice", items: [["fish", 1.5], ["brownRice", 1], ["sabzi", 0.5]] },
    { name: "Egg curry + roti", items: [["egg", 2], ["roti", 2], ["sabzi", 0.5], ["salad", 1]] },
  ],
  snack: [
    { name: "Sprouts chaat", items: [["sprouts", 1]] },
    { name: "Roasted chana + chaas", items: [["chana", 1], ["buttermilk", 1]] },
    { name: "Makhana + almonds", items: [["makhana", 1], ["almonds", 1]] },
    { name: "Hung curd fruit bowl", items: [["hungCurd", 1], ["fruit", 0.5]] },
    { name: "Fruit + peanut butter", items: [["apple", 1], ["peanutButter", 1]] },
    { name: "Protein shake + banana", items: [["whey", 1], ["banana", 1]] },
    { name: "Plant protein smoothie", items: [["plantProtein", 1], ["banana", 0.5], ["peanutButter", 0.5]] },
    { name: "Boiled eggs + fruit", items: [["egg", 2], ["fruit", 0.5]] },
  ],
  dinner: [
    { name: "Dal, 2 roti & palak", items: [["dal", 1], ["roti", 2], ["palak", 1]] },
    { name: "Paneer bhurji + roti", items: [["paneer", 1.5], ["roti", 2], ["salad", 1]] },
    { name: "Moong dal khichdi + curd", items: [["khichdi", 1], ["curd", 1]] },
    { name: "Tofu stir-fry + quinoa", items: [["tofu", 1.5], ["quinoa", 1], ["salad", 1]] },
    { name: "Bajra roti + sabzi + dal", items: [["bajraRoti", 2], ["sabzi", 1], ["dal", 0.5]] },
    { name: "Grilled chicken + roti + salad", items: [["chicken", 1.5], ["roti", 2], ["salad", 1]] },
    { name: "Fish + sabzi + roti", items: [["fish", 1.5], ["sabzi", 1], ["roti", 1]] },
    { name: "Egg bhurji + roti + salad", items: [["egg", 3], ["roti", 2], ["salad", 1]] },
  ],
};

const LEVEL = { vegan: 0, veg: 1, jain: 1, egg: 2, nonveg: 3 };

export function foodAllowed(key, profile) {
  const f = FOODS[key];
  if (!f) return false;
  if (LEVEL[f.type] > LEVEL[profile.diet ?? "veg"]) return false;
  const flags = f.flags || [];
  const cond = profile.conditions || [];
  if (cond.includes("thyroid") && flags.includes("soy")) return false;
  if ((cond.includes("diabetes") || cond.includes("pcos")) && (flags.includes("highGI") || flags.includes("refined"))) return false;
  if (cond.includes("lactose") && flags.includes("dairy") && key !== "whey") return false;
  const dislikes = (profile.dislikes || []).map((d) => d.toLowerCase().trim()).filter(Boolean);
  if (dislikes.some((d) => f.name.toLowerCase().includes(d) || key.toLowerCase().includes(d))) return false;
  return true;
}

export function templateAllowed(t, profile) {
  return t.items.every(([k]) => foodAllowed(k, profile));
}

export function likesScore(t, profile) {
  const likes = (profile.likes || []).map((d) => d.toLowerCase().trim()).filter(Boolean);
  const text = (t.name + " " + t.items.map(([k]) => FOODS[k].name).join(" ")).toLowerCase();
  return likes.filter((l) => text.includes(l)).length;
}
