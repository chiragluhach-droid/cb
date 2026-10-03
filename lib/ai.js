// Optional: Claude writes the diet. Falls back to the built-in engine when no key is set,
// the call fails, or the result doesn't land near the calorie/protein targets.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { DAYS } from "./planEngine";

const Item = z.object({
  food: z.string(),
  qty: z.string().describe("Home measure, e.g. '2 rotis', '1 katori', '150g'"),
  kcal: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});
const Dish = z.object({ name: z.string(), items: z.array(Item) });
const Meal = z.object({
  slot: z.string(),
  time: z.string(),
  name: z.string(),
  items: z.array(Item),
  swaps: z.array(Dish).describe("Exactly 2 alternative dishes with similar calories and protein"),
});
const DietSchema = z.object({
  rotation: z.array(z.object({ meals: z.array(Meal) })).describe("3 different day menus (Day A, B, C) rotated through the week"),
  coachNote: z.string().describe("Warm 2-4 sentence note from the coach to the client, first person, no sign-off"),
});

const sum = (items) =>
  items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
const roundDish = (d) => {
  const m = sum(d.items);
  return { ...d, kcal: Math.round(m.kcal), protein: Math.round(m.protein), carbs: Math.round(m.carbs), fat: Math.round(m.fat) };
};

const SYSTEM = `You are an experienced Indian sports nutritionist writing a client's meal plan.
Use simple, home-cooked Indian food that is easy to find and cook (roti, dal, sabzi, chilla, poha, idli, curd, paneer, eggs, chicken etc. depending on diet).
Use household measures (katori, roti count, glass, tbsp) with grams where useful. Give realistic macro numbers per item.
Respect the diet type strictly (vegan / veg / jain = no onion, garlic, root vegetables / egg / nonveg), dislikes, and health conditions:
PCOS or diabetes → low-GI, avoid maida, white rice in small amounts only; thyroid → no soy; lactose intolerance → no dairy except whey isolate.
Every day must land within ±5% of the calorie target and reach the protein target.
Write like a human coach, not a chatbot. Never mention AI.`;

export async function aiDiet(profile, targets, { reason = "initial", mealsPerDay = 4 } = {}) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const client = new Anthropic();
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "medium", format: betaZodOutputFormat(DietSchema) },
      // Server-side fallback if the model declines for policy reasons
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Client profile:
${JSON.stringify({ ...profile, phone: undefined }, null, 2)}

Daily targets: ${targets.calories} kcal, ${targets.protein}g protein, ${targets.carbs}g carbs, ${targets.fat}g fat.
Meals per day: ${mealsPerDay}. Reason for this plan: ${reason.replace("_", " ")}.
Write 3 day menus (A, B, C) and a short personal note.`,
        },
      ],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return null;

    const rotation = response.parsed_output.rotation.map((d) =>
      d.meals.map((m) => ({ ...roundDish(m), slot: m.slot, time: m.time, swaps: m.swaps.slice(0, 2).map(roundDish) }))
    );
    // Sanity check: each day within 12% of calories and ≥ 80% of protein
    const ok = rotation.every((meals) => {
      const t = sum(meals);
      return Math.abs(t.kcal - targets.calories) / targets.calories < 0.12 && t.protein >= targets.protein * 0.8;
    });
    if (!ok || rotation.length === 0) return null;

    return {
      diet: DAYS.map((day, i) => ({ day, meals: rotation[i % rotation.length] })),
      coachNote: response.parsed_output.coachNote,
    };
  } catch (e) {
    console.error("[ai] diet generation failed, using engine:", e?.message);
    return null;
  }
}
