// Deterministic plan builder. Always produces a valid, macro-checked plan;
// lib/ai.js can replace the diet portion with a Claude-written one.
import { FOODS, TEMPLATES, templateAllowed, likesScore } from "./foods";
import { computeTargets } from "./nutrition";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SLOT_SPLITS = {
  3: [["breakfast", "Breakfast", "8:30 am", 0.3], ["lunch", "Lunch", "1:30 pm", 0.4], ["dinner", "Dinner", "8:00 pm", 0.3]],
  4: [["breakfast", "Breakfast", "8:30 am", 0.25], ["lunch", "Lunch", "1:30 pm", 0.35], ["snack", "Evening snack", "5:30 pm", 0.12], ["dinner", "Dinner", "8:00 pm", 0.28]],
  5: [["breakfast", "Breakfast", "8:00 am", 0.22], ["snack", "Mid-morning", "11:00 am", 0.1], ["lunch", "Lunch", "1:30 pm", 0.3], ["snack", "Evening snack", "5:30 pm", 0.12], ["dinner", "Dinner", "8:00 pm", 0.26]],
};

const COUNTABLE = new Set(["roti", "chilla", "idli", "dosa", "egg", "slice", "banana", "apple", "scoop"]);

function itemsMacros(items) {
  return items.reduce(
    (a, it) => ({ kcal: a.kcal + it.kcal, protein: a.protein + it.protein, carbs: a.carbs + it.carbs, fat: a.fat + it.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function qtyLabel(food, servings) {
  const amount = food.per * servings;
  if (["g", "ml"].includes(food.unit)) return `${Math.round(amount / 5) * 5}${food.unit}`;
  const n = food.per > 1 ? Math.round(amount) : Math.round(amount * 2) / 2;
  if (COUNTABLE.has(food.unit)) return `${n} ×`;
  const plural = n !== 1 && !food.unit.endsWith("s") && !["katori", "tbsp", "tsp"].includes(food.unit);
  return `${n} ${food.unit}${plural ? (/(sh|ch|x)$/.test(food.unit) ? "es" : "s") : ""}`;
}

// Scale a dish template to hit a calorie target
export function buildDish(t, targetKcal) {
  const base = t.items.reduce((s, [k, n]) => s + FOODS[k].kcal * n, 0);
  const factor = Math.min(2.2, Math.max(0.6, targetKcal / base));
  const items = t.items.map(([k, n]) => {
    const f = FOODS[k];
    let s = n * factor;
    s = COUNTABLE.has(f.unit) ? Math.max(1, Math.round(s)) : Math.max(0.25, Math.round(s * 4) / 4);
    return {
      food: f.name,
      qty: qtyLabel(f, s),
      kcal: Math.round(f.kcal * s),
      protein: Math.round(f.p * s * 10) / 10,
      carbs: Math.round(f.c * s * 10) / 10,
      fat: Math.round(f.f * s * 10) / 10,
    };
  });
  const m = itemsMacros(items);
  return { name: t.name, items, kcal: Math.round(m.kcal), protein: Math.round(m.protein), carbs: Math.round(m.carbs), fat: Math.round(m.fat) };
}

function rank(slot, profile) {
  const options = TEMPLATES[slot].filter((t) => templateAllowed(t, profile));
  const pool = options.length ? options : TEMPLATES[slot].filter((t) => templateAllowed(t, { ...profile, dislikes: [] }));
  // Prefer liked dishes, then protein-dense ones; drop the weakest third for variety-with-quality
  const density = (t) => t.items.reduce((s, [k, n]) => s + FOODS[k].p * n, 0) / t.items.reduce((s, [k, n]) => s + FOODS[k].kcal * n, 0);
  const sorted = pool
    .map((t) => ({ t, score: likesScore(t, profile) * 10 + density(t) * 100 }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
  return sorted.slice(0, Math.max(3, Math.ceil(sorted.length * 0.7)));
}

export function buildDiet(profile, targets, seed = 0) {
  const split = SLOT_SPLITS[profile.mealsPerDay] || SLOT_SPLITS[4];
  const ranked = Object.fromEntries(Object.keys(TEMPLATES).map((s) => [s, rank(s, profile)]));
  const proteinTopUp = TEMPLATES.snack.find((t) => templateAllowed(t, profile) && t.items.some(([k]) => ["whey", "plantProtein", "hungCurd", "egg"].includes(k)));

  const buildMeals = (d, scale) => {
    const used = {};
    return split.map(([slot, label, time, share], i) => {
      const pool = ranked[slot];
      used[slot] = (used[slot] ?? -1) + 1;
      const idx = (d * 2 + seed + used[slot] * 3 + i) % pool.length;
      const kcal = targets.calories * share * scale;
      const primary = buildDish(pool[idx], kcal);
      const swaps = [1, 2]
        .map((o) => pool[(idx + o) % pool.length])
        .filter((t, k, arr) => t !== pool[idx] && arr.indexOf(t) === k)
        .map((t) => buildDish(t, kcal));
      return { slot: label, time, ...primary, swaps };
    });
  };

  return DAYS.map((day, d) => {
    let meals = buildMeals(d, 1);
    // If protein falls short, carve out room for a protein top-up and shrink the rest
    const tot = itemsMacros(meals);
    if (proteinTopUp && tot.protein < targets.protein * 0.9) {
      const extra = buildDish(proteinTopUp, Math.min(320, (targets.protein - tot.protein) * 7));
      meals = buildMeals(d, (targets.calories - extra.kcal) / targets.calories);
      meals.splice(meals.length - 1, 0, { slot: "Protein top-up", time: "6:30 pm", ...extra, swaps: [] });
    }
    return { day, meals };
  });
}

// ---------- Workouts ----------
const EX = {
  home: {
    push: ["Push-ups", "Pike push-ups", "Chair dips", "Dumbbell floor press", "Band lateral raises"],
    pull: ["Backpack rows", "Band pull-aparts", "Towel door rows", "Dumbbell reverse flyes", "Superman holds"],
    legs: ["Bodyweight squats", "Reverse lunges", "Glute bridges", "Bulgarian split squats", "Wall sit", "Calf raises"],
    core: ["Plank", "Dead bug", "Mountain climbers", "Bicycle crunches"],
    cardio: ["Jumping jacks", "High knees", "Burpees", "Skater hops"],
  },
  gym: {
    push: ["Barbell bench press", "Seated dumbbell shoulder press", "Incline dumbbell press", "Cable lateral raises", "Triceps rope pushdown"],
    pull: ["Lat pulldown", "Seated cable row", "One-arm dumbbell row", "Face pulls", "Dumbbell biceps curls"],
    legs: ["Goblet squat / back squat", "Romanian deadlift", "Leg press", "Walking lunges", "Leg curl", "Standing calf raises"],
    core: ["Plank", "Cable crunch", "Hanging knee raises", "Pallof press"],
    cardio: ["Incline treadmill walk", "Cycle intervals", "Rowing machine", "Stair climber"],
  },
};

const SPLITS = {
  3: [["Full body A", ["push", "pull", "legs", "core"]], ["Full body B", ["legs", "push", "pull", "cardio"]], ["Full body C", ["pull", "legs", "push", "core"]]],
  4: [["Upper", ["push", "pull", "push", "pull"]], ["Lower + core", ["legs", "legs", "core", "core"]], ["Upper", ["pull", "push", "pull", "push"]], ["Lower + cardio", ["legs", "legs", "cardio", "core"]]],
  5: [["Push", ["push", "push", "push", "core"]], ["Pull", ["pull", "pull", "pull", "core"]], ["Legs", ["legs", "legs", "legs", "legs"]], ["Upper", ["push", "pull", "push", "pull"]], ["Lower + conditioning", ["legs", "legs", "cardio", "cardio"]]],
};

const DAY_SLOTS = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5] };

// 4-week progressive block: volume first, then intensity, then a lighter week
function progression(level) {
  const base = level === "beginner" ? [3, 10] : level === "advanced" ? [4, 8] : [3, 12];
  const [s, r] = base;
  return [
    { week: 1, sets: s, reps: `${r}`, note: "Learn the movement. Leave 3 reps in the tank." },
    { week: 2, sets: s, reps: `${r + 2}`, note: "Same weight, 2 more reps each set." },
    { week: 3, sets: s + 1, reps: `${r}`, note: "Add a set. Go a little heavier if reps felt easy." },
    { week: 4, sets: s + 1, reps: `${r + 2}`, note: "Toughest week. Push close to failure on the last set." },
  ];
}

export function buildWorkout(profile) {
  const place = profile.workoutPlace === "gym" ? "gym" : "home";
  const days = [3, 4, 5].includes(profile.daysPerWeek) ? profile.daysPerWeek : 4;
  const lib = EX[place];
  const counters = {};
  const sessions = SPLITS[days].map(([focus, groups], i) => ({
    day: DAYS[DAY_SLOTS[days][i]],
    focus,
    exercises: groups.map((g) => {
      counters[g] = (counters[g] ?? -1) + 1;
      const name = lib[g][(counters[g] + i) % lib[g].length];
      const timed = /plank|wall sit|holds|treadmill|cycle|rowing|stair|jacks|high knees|skater|mountain/i.test(name);
      return { name, group: g, timed, rest: g === "cardio" ? "30s" : place === "gym" ? "90s" : "60s" };
    }),
  }));
  return {
    place,
    daysPerWeek: days,
    sessions,
    progression: progression(profile.experience),
    warmup: "5 min brisk walk or skipping + 10 arm circles, 10 leg swings, 10 bodyweight squats",
    cooldown: "5 min easy walk + hamstring, hip flexor and chest stretches (30s each)",
  };
}

export function buildCoachNote(profile, targets, reason, coachName) {
  const first = (profile.name || "").split(" ")[0] || "there";
  const cond = profile.conditions || [];
  const lines = {
    initial: `Hey ${first}! I went through everything you shared and built this around food you actually eat.`,
    progress_adjust: `${first}, your weight has moved nicely, so I've re-worked your numbers to match where your body is now.`,
    plateau: `${first}, the scale has been stuck for a couple of weeks. That's normal. I've tweaked calories and steps to get things moving again.`,
    stage_change: `You hit your goal, ${first}! 🎉 We're switching gears now: this phase is about holding on to what you've earned.`,
    manual: `${first}, I've updated your plan by hand based on our latest check-in.`,
  };
  const extra = [];
  if (cond.includes("pcos")) extra.push("I've kept carbs lower and slow-digesting, which really helps with PCOS.");
  if (cond.includes("thyroid")) extra.push("No soy in this plan, and please take your thyroid meds 30–45 min before breakfast.");
  if (cond.includes("diabetes")) extra.push("Every meal is low-GI. Keep checking your sugar levels as usual.");
  extra.push(`Aim for ~${targets.protein}g protein and ${targets.steps.toLocaleString("en-IN")} steps a day. Those two matter most.`);
  return `${lines[reason] || lines.initial} ${extra.join(" ")}\n\n— ${coachName}`;
}

export function buildPlan(profile, { stage, adjust = 0, seed = 0, reason = "initial", coachName = "Your coach" } = {}) {
  const st = stage || (profile.goal === "muscle_gain" ? "build" : profile.goal);
  const targets = computeTargets(profile, st, adjust);
  return {
    stage: st,
    targets,
    diet: buildDiet(profile, targets, seed),
    workout: buildWorkout(profile),
    coachNote: buildCoachNote(profile, targets, reason, coachName),
    calorieAdjust: adjust,
    seed,
  };
}
