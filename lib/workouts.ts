/*
 * Demo workout templates. Three sessions a week (Mon / Wed / Fri), home or
 * gym, adding a rep every week so it keeps getting a little harder.
 */

export type Exercise = { id: string; name: string; sets: number; reps: (week: number) => string; cue: string };
export type Session = { title: string; focus: string; minutes: number; exercises: Exercise[] };

const reps = (base: number) => (w: number) => `${base + Math.min(6, w)} reps`;
const secs = (base: number) => (w: number) => `${base + Math.min(30, w * 5)} sec`;

const home: Record<number, Session> = {
  0: {
    title: "Lower body strength",
    focus: "Legs & glutes",
    minutes: 30,
    exercises: [
      { id: "h-squat", name: "Goblet squat", sets: 3, reps: reps(10), cue: "Backpack or dumbbell at your chest" },
      { id: "h-bridge", name: "Glute bridge", sets: 3, reps: reps(12), cue: "Pause for a second at the top" },
      { id: "h-lunge", name: "Reverse lunge", sets: 3, reps: reps(8), cue: "Each leg, knee just above the floor" },
      { id: "h-calf", name: "Calf raise", sets: 2, reps: reps(15), cue: "Slow on the way down" },
    ],
  },
  2: {
    title: "Upper body & core",
    focus: "Push, pull, core",
    minutes: 30,
    exercises: [
      { id: "h-pushup", name: "Push-up", sets: 3, reps: reps(6), cue: "Knees down is fine — keep a straight line" },
      { id: "h-row", name: "Backpack row", sets: 3, reps: reps(10), cue: "Squeeze shoulder blades together" },
      { id: "h-press", name: "Overhead press", sets: 3, reps: reps(8), cue: "Water bottles or dumbbells" },
      { id: "h-plank", name: "Plank", sets: 3, reps: secs(30), cue: "Ribs down, glutes tight" },
    ],
  },
  4: {
    title: "Full body circuit",
    focus: "Conditioning",
    minutes: 25,
    exercises: [
      { id: "h-sqjump", name: "Squat to calf raise", sets: 3, reps: reps(12), cue: "Smooth and controlled" },
      { id: "h-incline", name: "Incline push-up", sets: 3, reps: reps(8), cue: "Hands on a sofa or table" },
      { id: "h-climber", name: "Mountain climber", sets: 3, reps: secs(25), cue: "Steady pace" },
      { id: "h-deadbug", name: "Dead bug", sets: 3, reps: reps(8), cue: "Lower back stays on the mat" },
    ],
  },
};

const gym: Record<number, Session> = {
  0: {
    title: "Lower body strength",
    focus: "Squat & hinge",
    minutes: 45,
    exercises: [
      { id: "g-squat", name: "Barbell back squat", sets: 4, reps: reps(6), cue: "Add 2.5 kg when all sets feel easy" },
      { id: "g-rdl", name: "Romanian deadlift", sets: 3, reps: reps(8), cue: "Hips back, bar close to legs" },
      { id: "g-legpress", name: "Leg press", sets: 3, reps: reps(10), cue: "Full range, no locking knees" },
      { id: "g-curl", name: "Leg curl", sets: 3, reps: reps(10), cue: "Slow lowering" },
    ],
  },
  2: {
    title: "Upper body",
    focus: "Push & pull",
    minutes: 45,
    exercises: [
      { id: "g-bench", name: "Dumbbell bench press", sets: 4, reps: reps(8), cue: "Shoulders pinned back" },
      { id: "g-pulldown", name: "Lat pulldown", sets: 4, reps: reps(10), cue: "Pull to upper chest" },
      { id: "g-ohp", name: "Seated shoulder press", sets: 3, reps: reps(8), cue: "Don't arch your back" },
      { id: "g-cablerow", name: "Cable row", sets: 3, reps: reps(10), cue: "Chest up, elbows back" },
    ],
  },
  4: {
    title: "Full body",
    focus: "Strength + conditioning",
    minutes: 40,
    exercises: [
      { id: "g-trapbar", name: "Trap-bar deadlift", sets: 3, reps: reps(6), cue: "Push the floor away" },
      { id: "g-incline", name: "Incline dumbbell press", sets: 3, reps: reps(8), cue: "Controlled tempo" },
      { id: "g-goblet", name: "Walking lunge", sets: 3, reps: reps(8), cue: "Each leg" },
      { id: "g-bike", name: "Bike intervals", sets: 6, reps: secs(20), cue: "Hard 20s, easy 40s" },
    ],
  },
};

export const workoutDays = [0, 2, 4];
export const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function sessionFor(place: "home" | "gym", weekdayIndex: number): Session | null {
  return (place === "gym" ? gym : home)[weekdayIndex] ?? null;
}

/** Week number since the plan started (0-based). */
export function weekSince(startDate: string, now = new Date()) {
  const start = new Date(`${startDate}T00:00:00`);
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / (7 * 86400000)));
}
