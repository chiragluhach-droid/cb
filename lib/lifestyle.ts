/*
 * Lifestyle answers from the questionnaire (routine, habits, preferences) and
 * the helpers built on them. Shared by the browser, the server and the coach
 * panel — no React here.
 */

export type WorkDay = "desk" | "feet" | "shift" | "home";
export type Level = "low" | "medium" | "high";
export type Cooking = "self" | "family" | "out";
export type CookTime = "quick" | "some" | "love";
export type Experience = "new" | "some" | "regular";
export type TrainTime = "morning" | "midday" | "evening";

export type Lifestyle = {
  /** "HH:MM", 24-hour. */
  wake: string;
  sleep: string;
  work: WorkDay;
  sleepQuality: Level;
  stress: Level;
  /** Glasses of water a day right now. */
  water: number;
  cooking: Cooking;
  cookTime: CookTime;
  /** Meals eaten out or ordered in, per week. */
  eatingOut: number;
  cuisines: string[];
  motivation: string[];
  /** Optional goal weight in kg; 0 = not set. */
  targetWeight: number;
  experience: Experience;
  trainTime: TrainTime;
  /** Anything else for the coach. */
  notes: string;
};

export const defaultLifestyle: Lifestyle = {
  wake: "07:00",
  sleep: "23:00",
  work: "desk",
  sleepQuality: "medium",
  stress: "medium",
  water: 6,
  cooking: "self",
  cookTime: "some",
  eatingOut: 2,
  cuisines: [],
  motivation: [],
  targetWeight: 0,
  experience: "some",
  trainTime: "evening",
  notes: "",
};

export const workDays: { v: WorkDay; l: string; b: string }[] = [
  { v: "desk", l: "At a desk", b: "Office or laptop most of the day" },
  { v: "feet", l: "On my feet", b: "Retail, teaching, healthcare, site work" },
  { v: "shift", l: "Shifts / nights", b: "My hours change or I work late" },
  { v: "home", l: "At home", b: "Parent, student, or working from home" },
];
export const cuisineOptions = [
  { v: "american", l: "American" },
  { v: "mediterranean", l: "Mediterranean" },
  { v: "indian", l: "Indian" },
  { v: "mexican", l: "Mexican" },
  { v: "east-asian", l: "East Asian" },
  { v: "middle-eastern", l: "Middle Eastern" },
  { v: "italian", l: "Italian" },
  { v: "anything", l: "Anything goes" },
];
export const motivationOptions = [
  { v: "confidence", l: "Feel confident" },
  { v: "energy", l: "More energy" },
  { v: "health", l: "Better health markers" },
  { v: "event", l: "An event coming up" },
  { v: "strength", l: "Get stronger" },
  { v: "habits", l: "Build lasting habits" },
];
export const cookingOptions: { v: Cooking; l: string; b: string }[] = [
  { v: "self", l: "I cook", b: "Most meals are made by me" },
  { v: "family", l: "Someone cooks for me", b: "Family, partner or a cook" },
  { v: "out", l: "Mostly eat out / order in", b: "Takeaway, canteen or restaurants" },
];
export const cookTimeOptions: { v: CookTime; l: string }[] = [
  { v: "quick", l: "Under 15 min" },
  { v: "some", l: "15–30 min" },
  { v: "love", l: "I love cooking" },
];
export const levelOptions: { v: Level; l: string }[] = [
  { v: "low", l: "Low" },
  { v: "medium", l: "Medium" },
  { v: "high", l: "High" },
];
export const sleepQualityOptions: { v: Level; l: string }[] = [
  { v: "low", l: "Poor" },
  { v: "medium", l: "Okay" },
  { v: "high", l: "Great" },
];
export const experienceOptions: { v: Experience; l: string }[] = [
  { v: "new", l: "New to it" },
  { v: "some", l: "On and off" },
  { v: "regular", l: "Train regularly" },
];
export const trainTimeOptions: { v: TrainTime; l: string }[] = [
  { v: "morning", l: "Morning" },
  { v: "midday", l: "Midday" },
  { v: "evening", l: "Evening" },
];

/* ───────────── Time helpers ───────────── */

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isTime = (v: unknown): v is string => typeof v === "string" && TIME.test(v);
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** "07:30" → "7:30 am" */
export function fmtTime(min: number) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  return `${h % 12 || 12}:${mm} ${h < 12 ? "am" : "pm"}`;
}
export const fmtClock = (t: string) => fmtTime(toMin(t));

/** Hours between wake and sleep (sleep after midnight is fine). */
export function sleepHours(wake: string, sleep: string) {
  let s = toMin(sleep);
  const w = toMin(wake);
  if (s <= w) s += 1440; // e.g. 00:30 bedtime
  return Math.round(((1440 - (s - w)) / 60) * 10) / 10;
}

const q15 = (m: number) => Math.round(m / 15) * 15;

/**
 * Meal times built around the client's day: breakfast an hour after waking,
 * dinner about 2.5 hours before bed, lunch and the snack spaced in between.
 */
export function mealTimes(l: Pick<Lifestyle, "wake" | "sleep">) {
  const wake = toMin(l.wake);
  let bed = toMin(l.sleep);
  if (bed <= wake) bed += 1440;
  const breakfast = wake + 60;
  const dinner = Math.max(breakfast + 8 * 60, bed - 150);
  const lunch = breakfast + (dinner - breakfast) * 0.42;
  const snack = lunch + (dinner - lunch) * 0.55;
  return {
    breakfast: fmtTime(q15(breakfast)),
    lunch: fmtTime(q15(lunch)),
    snack: fmtTime(q15(snack)),
    dinner: fmtTime(q15(dinner)),
  };
}
