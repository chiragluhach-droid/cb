/*
 * AI meal-plan drafting via Groq — SERVER ONLY (imported by app/api/ai-plan).
 *
 * Safety by design:
 *  - The model may only choose dish ids from a per-meal allow-list (JSON
 *    schema enums): dishes that fit the diet, avoid allergens, don't clash
 *    with health conditions and aren't on the client's dislike list.
 *  - Portions still come from the rule engine, the coach panel re-runs the
 *    risk check, and the coach approves before the client sees anything.
 *  - Only questionnaire answers are sent — never the client's name, email
 *    or phone.
 */

import { Slot, clash, dietOk, dishes, dislikeWords, slotSplit, targets } from "@/lib/engine";
import type { Profile } from "@/lib/demo-store";

export const AI_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
export const aiEnabled = () => !!process.env.GROQ_API_KEY;

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const SLOTS = slotSplit.map((s) => s.slot);

/** Dishes the AI is allowed to use for one meal of this client's day. */
export function allowedDishes(profile: Profile, slot: Slot) {
  const words = dislikeWords(profile);
  return dishes.filter(
    (d) => d.slots.includes(slot) && dietOk(d, profile.diet) && !clash(d, profile) && !words.some((w) => d.name.toLowerCase().includes(w))
  );
}

export type AiPlanResult = { picks: Record<string, string>; note: string; model: string; tokens: number };

export class AiPlanError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

const label = { lose: "fat loss", tone: "toning up", build: "muscle gain" } as const;

export async function draftWeekWithAI(profile: Profile, opts: { previous?: Record<string, string>; instruction?: string } = {}): Promise<AiPlanResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new AiPlanError("AI isn't set up — add GROQ_API_KEY to .env.local.", 503);

  const t = targets(profile);
  const allowed = Object.fromEntries(SLOTS.map((s) => [s, allowedDishes(profile, s)])) as Record<Slot, ReturnType<typeof allowedDishes>>;
  const usable = SLOTS.filter((s) => allowed[s].length > 0);

  const catalog = usable
    .map((s) => {
      const share = slotSplit.find((x) => x.slot === s)!.share;
      const rows = allowed[s].map((d) => `${d.id} = ${d.name} (${d.kcal}kcal/${d.protein}g P)`).join("; ");
      return `${s} (~${Math.round(t.kcal * share)} kcal): ${rows}`;
    })
    .join("\n");

  const client = [
    `Goal: ${label[profile.goal]}. Diet: ${profile.diet}. ${profile.sex}, ${profile.age} years, ${profile.height} cm, ${profile.weight} kg, ${profile.activity} activity.`,
    `Health conditions: ${profile.conditions.join(", ") || "none"}. Allergies: ${profile.allergies.join(", ") || "none"}. Dislikes: ${profile.dislikes.trim() || "none"}.`,
    `Daily targets: ${t.kcal} kcal, ${t.protein} g protein. Portions are scaled automatically, so pick dishes for fit and variety.`,
  ].join("\n");

  const prev = opts.previous && Object.keys(opts.previous).length
    ? `\n\nThe coach pressed "redo": give a clearly DIFFERENT week. Change at least 18 of the 28 meals versus this previous suggestion, and vary which days get which dishes:\n${DAYS.map((d, i) => `${d}: ${SLOTS.map((s) => opts.previous![`${i}-${s}`] ?? "-").join(", ")}`).join("\n")}`
    : "";
  const instruction = opts.instruction?.trim() ? `\n\nCoach's instruction (follow it): ${opts.instruction.trim().slice(0, 300)}` : "";

  const dayShape = {
    type: "object",
    additionalProperties: false,
    required: usable,
    properties: Object.fromEntries(usable.map((s) => [s, { type: "string", enum: allowed[s].map((d) => d.id) }])),
  };

  const body = {
    model: AI_MODEL,
    temperature: prev ? 1 : 0.7,
    max_completion_tokens: 2500,
    // Low reasoning keeps each draft well inside the free tier's tokens-per-minute.
    ...(AI_MODEL.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
    messages: [
      {
        role: "system",
        content:
          "You are a nutrition coach's assistant planning a week of everyday Indian home food. Choose one dish id per meal from the allowed list for that meal only. " +
          "Aim for: protein spread across the day, variety (no dish twice in one day, ideally no dish more than 3 times a week), realistic home cooking, and suitability for the client's health conditions. " +
          "Then write a short note (max 2 sentences) for the coach explaining the thinking. Do not give medical advice.",
      },
      { role: "user", content: `Client:\n${client}\n\nAllowed dishes per meal:\n${catalog}${prev}${instruction}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "weekly_plan",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: [...DAYS, "note"],
          properties: { ...Object.fromEntries(DAYS.map((d) => [d, dayShape])), note: { type: "string" } },
        },
      },
    },
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch {
    throw new AiPlanError("Couldn't reach the AI service. Check your connection and try again.", 502);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    if (res.status === 401) throw new AiPlanError("The Groq API key was rejected. Check GROQ_API_KEY in .env.local.", 502);
    if (res.status === 429) {
      const wait = Math.ceil(Number(res.headers.get("retry-after")) || 0);
      throw new AiPlanError(wait ? `AI limit reached — try again in about ${wait} second${wait === 1 ? "" : "s"}.` : "AI limit reached — wait a minute and try again.", 429);
    }
    throw new AiPlanError(`The AI service returned an error (${res.status}). Try again.`, 502);
  }

  const json = await res.json();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json?.choices?.[0]?.message?.content ?? "");
  } catch {
    throw new AiPlanError("The AI reply couldn't be read. Try again.", 502);
  }

  // Keep only ids that are on the allow-list for that meal (belt and braces).
  const picks: Record<string, string> = {};
  DAYS.forEach((d, i) => {
    const day = parsed[d] as Record<string, unknown> | undefined;
    usable.forEach((s) => {
      const id = day?.[s];
      if (typeof id === "string" && allowed[s].some((x) => x.id === id)) picks[`${i}-${s}`] = id;
    });
  });
  if (Object.keys(picks).length < usable.length * 4) throw new AiPlanError("The AI reply was incomplete. Try again.", 502);

  const note = typeof parsed.note === "string" ? parsed.note.trim().slice(0, 400) : "";
  return { picks, note, model: AI_MODEL, tokens: Number(json?.usage?.total_tokens) || 0 };
}
