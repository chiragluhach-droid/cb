/*
 * Sample clients for the coach panel.
 *
 *   node --env-file=.env.local scripts/seed-sample-clients.mjs           # add (replaces earlier samples)
 *   node --env-file=.env.local scripts/seed-sample-clients.mjs --remove  # remove samples only
 *
 * Every sample user is tagged `seeded: true` and uses an @example.com email,
 * so removing them never touches real sign-ups.
 */

import { MongoClient } from "mongodb";

const DAY = 86400000;
const z = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
const daysAgoKey = (n) => dayKey(new Date(Date.now() - n * DAY));
const SLOTS = ["breakfast", "lunch", "snack", "dinner"];
const stepGoal = { sedentary: 7000, light: 8000, moderate: 9000, very: 10000 };
const editKey = (day, slot) => `${day}-${slot}`;

/** Seeded random numbers, so the samples look the same every run. */
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const P = (p) => ({ conditions: [], allergies: [], dislikes: "", workoutPlace: "home", ...p });

// [from, text, hours ago] — "me" is the client, "coach" is Simone.
const seeds = [
  {
    name: "Meera Sharma", plan: "meal-workout-90", startedDaysAgo: 34, status: "approved",
    profile: P({ goal: "lose", diet: "veg", sex: "female", weight: 78, height: 162, age: 31, activity: "light", conditions: ["pcos"], dislikes: "karela" }),
    weight: { to: 74.6 }, adherence: 0.86, edits: { [editKey(0, "lunch")]: "khichdi", [editKey(3, "lunch")]: "khichdi" },
    notes: "PCOS — keeping carbs low-GI. Responds well to weekly check-ins. Family dinners on Sundays: plan lighter lunch.",
    messages: [
      ["coach", "Great first month, Meera — 3.4 kg down and your energy's clearly up. I'm keeping the plan as it is for now.", 50],
      ["me", "Thank you so much! Had a family dinner last night and went over a bit. Should I eat less today?", 3],
    ],
  },
  {
    name: "Arjun Nair", plan: "meal-workout-30", startedDaysAgo: 18, status: "approved",
    profile: P({ goal: "build", diet: "nonveg", sex: "male", weight: 70, height: 178, age: 27, activity: "moderate", workoutPlace: "gym" }),
    weight: { to: 71.4 }, adherence: 0.8, edits: { [editKey(1, "dinner")]: "grilled-chicken", [editKey(3, "dinner")]: "grilled-chicken", [editKey(5, "dinner")]: "grilled-chicken" },
    notes: "Lean bulk. Trains 4x/week at the gym. Prefers quick prep — batch-cooks chicken on Sundays.",
    messages: [
      ["me", "Can I have the grilled chicken dinner more often? It's easy to prep in bulk.", 30],
      ["coach", "Of course — I've put it in three dinners this week. Keep the roti with it for the extra carbs.", 28],
    ],
  },
  {
    name: "Priyanka Desai", plan: "meal-90", startedDaysAgo: 58, status: "approved",
    profile: P({ goal: "lose", diet: "egg", sex: "female", weight: 74, height: 160, age: 38, activity: "light", conditions: ["thyroid"] }),
    weight: { to: 69.8 }, adherence: 0.88,
    notes: "Hypothyroid, on medication — no soy. Booked monthly video calls. Very consistent.",
    messages: [
      ["coach", "Two months in and 4.2 kg down — brilliant consistency, Priyanka. Shall we do your monthly call this week?", 70],
      ["me", "Yes please! Thursday evening works best for me.", 66],
      ["coach", "Booked for Thursday at 7 pm. See you then 🙂", 65],
    ],
  },
  {
    name: "Rahul Verma", plan: "meal-workout-90", startedDaysAgo: 25, status: "approved",
    profile: P({ goal: "lose", diet: "nonveg", sex: "male", weight: 95, height: 176, age: 44, activity: "sedentary", conditions: ["diabetes"], workoutPlace: "gym" }),
    weight: { to: 91.9 }, adherence: 0.74,
    notes: "Type 2 diabetes — low-GI carbs only, fibre and protein first. Desk job; nudging steps up.",
    messages: [
      ["me", "My fasting sugar was 112 this morning, down from 131 last month!", 20],
      ["coach", "That's a great sign, Rahul. Keep the evening walk going — it's making a real difference.", 18],
    ],
  },
  {
    name: "Ananya Iyer", plan: "meal-30", startedDaysAgo: 12, status: "approved",
    profile: P({ goal: "tone", diet: "vegan", sex: "female", weight: 60, height: 165, age: 26, activity: "moderate" }),
    weight: { to: 59.3 }, adherence: 0.92,
    messages: [["me", "Loving the tofu stir-fry dinners — thank you!", 40]],
  },
  {
    name: "Aisha Khan", plan: "meal-workout-30", startedDaysAgo: 9, status: "approved",
    profile: P({ goal: "tone", diet: "nonveg", sex: "female", weight: 63, height: 167, age: 29, activity: "moderate" }),
    weight: { to: 62.5 }, adherence: 0.7,
    messages: [["me", "Travelling for work next week — what should I order when I'm eating out?", 6]],
  },
  {
    name: "Neha Kapoor", plan: "meal-30", startedDaysAgo: 6, status: "approved",
    profile: P({ goal: "lose", diet: "jain", sex: "female", weight: 66, height: 158, age: 34, activity: "light" }),
    weight: { to: 65.4 }, adherence: 0.9,
    notes: "Jain — no onion, garlic or root veg. Very motivated; started strong.",
    messages: [["coach", "Welcome, Neha! Your Jain plan is live — every dish is made without onion, garlic or root veg.", 120]],
  },
  {
    name: "Kabir Mehta", plan: "meal-workout-90", startedDaysAgo: 40, status: "approved",
    profile: P({ goal: "tone", diet: "veg", sex: "male", weight: 82, height: 175, age: 30, activity: "light", allergies: ["nuts"], workoutPlace: "gym" }),
    weight: { to: 80.2, flatLastDays: 16 }, adherence: 0.55, idleDays: 4,
    notes: "Nut allergy. Good start but plateaued around week 3; logging has dropped off.",
    messages: [["coach", "How's the week going, Kabir? I haven't seen any logs for a few days — everything OK?", 26]],
  },
  {
    name: "Simran Kaur", plan: "meal-90", startedDaysAgo: 1, status: "review",
    profile: P({ goal: "lose", diet: "egg", sex: "female", weight: 69, height: 158, age: 35, activity: "sedentary", conditions: ["thyroid"] }),
    // Asked for her usual soya pulao — clashes with thyroid, for the coach to catch.
    edits: { [editKey(0, "lunch")]: "soya-pulao" },
    messages: [["me", "Hi! Is soya okay for me? I usually have soya pulao twice a week.", 20]],
  },
  {
    name: "Dev Patel", plan: "meal-30", startedDaysAgo: 0, status: "review",
    profile: P({ goal: "lose", diet: "veg", sex: "male", weight: 88, height: 172, age: 42, activity: "light", conditions: ["diabetes"], dislikes: "lauki" }),
    edits: { [editKey(1, "breakfast")]: "poha" },
    messages: [["me", "Poha is my daily breakfast — please keep it in if you can 🙏", 5]],
  },
  {
    name: "Rohan Gupta", plan: "meal-workout-90", startedDaysAgo: 2, status: "review",
    profile: P({ goal: "lose", diet: "nonveg", sex: "male", weight: 92, height: 170, age: 38, activity: "sedentary", conditions: ["bp"], workoutPlace: "gym" }),
    edits: { [editKey(2, "snack")]: "masala-papad" },
  },
  { name: "Vikram Singh", plan: "meal-30", startedDaysAgo: 1, status: "none" },
];

function build(seed, i) {
  const r = rng(seed.name);
  const [first, last] = seed.name.toLowerCase().split(" ");
  const created = Date.now() - seed.startedDaysAgo * DAY - (i + 1) * 3600000;
  const id = `sample-${first}-${last}`;
  const user = { _id: id, name: seed.name, email: `${first}.${last}@example.com`, phone: `+9190000000${z(i + 10)}`, plan: seed.plan, createdAt: created, role: "client", seeded: true };
  const data = { _id: id, profile: seed.profile ?? null, planStatus: seed.status, startDate: daysAgoKey(seed.startedDaysAgo), days: {}, weights: [], messages: [] };
  if (seed.edits) data.planEdits = seed.edits;
  if (seed.notes) data.coachNotes = seed.notes;
  if (!seed.profile) return { user, data };
  const p = seed.profile;

  if (seed.status === "approved") {
    data.approvedAt = created + DAY;
    for (let n = seed.startedDaysAgo; n >= (seed.idleDays ?? 0); n--) {
      const meals = SLOTS.filter(() => r() < (seed.adherence ?? 0.8));
      data.days[daysAgoKey(n)] = {
        meals: n === 0 ? meals.slice(0, 2) : meals,
        swaps: {},
        water: n === 0 ? 3 : 5 + Math.floor(r() * 4),
        steps: Math.round((stepGoal[p.activity] * (0.6 + r() * 0.55)) / 10) * 10,
        sets: {},
      };
    }
  }

  if (seed.weight) {
    const flat = seed.weight.flatLastDays ?? 0;
    const trend = Math.max(1, seed.startedDaysAgo - flat);
    for (let n = seed.startedDaysAgo; n >= (seed.idleDays ?? 0); n -= 2 + Math.floor(r() * 2)) {
      const t = Math.min(1, (seed.startedDaysAgo - n) / trend);
      const noise = n === seed.startedDaysAgo ? 0 : (r() - 0.5) * 0.5;
      data.weights.push({ date: daysAgoKey(n), kg: Math.round((p.weight + (seed.weight.to - p.weight) * t + noise) * 10) / 10 });
    }
  } else {
    data.weights.push({ date: daysAgoKey(seed.startedDaysAgo), kg: p.weight });
  }

  const welcome = { id: `${id}-m0`, from: "coach", text: `Hi ${seed.name.split(" ")[0]}! I'm your Evowell coach. I've got your answers and I'm reviewing your first plan now.`, at: created + 600000 };
  data.messages = [welcome, ...(seed.messages ?? []).map(([from, text, h], k) => ({ id: `${id}-m${k + 1}`, from, text, at: Date.now() - h * 3600000 }))];
  // Everything up to the latest client message counts as read, except a client message sent recently.
  const lastClient = [...data.messages].reverse().find((m) => m.from === "me");
  const lastIsClient = data.messages.at(-1)?.from === "me";
  data.coachReadAt = lastClient && lastIsClient ? lastClient.at - 1 : Date.now();
  return { user, data };
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);
const users = db.collection("users");

const old = await users.find({ seeded: true }, { projection: { _id: 1 } }).toArray();
const ids = old.map((u) => u._id);
if (ids.length) {
  await Promise.all([users.deleteMany({ _id: { $in: ids } }), db.collection("clientdata").deleteMany({ _id: { $in: ids } }), db.collection("photos").deleteMany({ userId: { $in: ids } })]);
}
console.log(`Removed ${ids.length} earlier sample client(s).`);

if (!process.argv.includes("--remove")) {
  const built = seeds.map(build);
  const clash = await users.find({ $or: built.flatMap((b) => [{ email: b.user.email }, { phone: b.user.phone }]) }).toArray();
  if (clash.length) {
    console.log(`Skipped: ${clash.length} sample email/phone already used by a real account.`);
  } else {
    await users.insertMany(built.map((b) => b.user));
    await db.collection("clientdata").insertMany(built.map((b) => b.data));
    console.log(`Added ${built.length} sample clients.`);
  }
}
console.log(`Real (non-sample) clients untouched: ${await users.countDocuments({ seeded: { $ne: true } })}`);
await client.close();
