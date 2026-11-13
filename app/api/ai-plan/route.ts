import { NextResponse } from "next/server";
import { AI_MODEL, AiPlanError, aiEnabled, draftWeekWithAI } from "@/lib/ai-plan";
import type { Profile } from "@/lib/demo-store";

/*
 * POST /api/ai-plan — drafts a week for the coach to review.
 *
 * DEMO NOTE: the coach panel's sign-in is browser-only for now, so this route
 * can't check who's calling. Before going live, protect it with real admin
 * auth — otherwise anyone could spend the Groq quota.
 */

export const runtime = "nodejs";

// Simple per-IP limit so a stuck button can't burn the quota: 12 drafts a minute.
const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 12;
};

const oneOf = <T extends string>(v: unknown, list: readonly T[]): v is T => typeof v === "string" && (list as readonly string[]).includes(v);
const num = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

/** Accept only a well-formed questionnaire — nothing else from the browser reaches the AI. */
function readProfile(p: unknown): Profile | null {
  if (!p || typeof p !== "object") return null;
  const x = p as Record<string, unknown>;
  const conditions = Array.isArray(x.conditions) ? x.conditions.filter((c) => oneOf(c, ["pcos", "thyroid", "diabetes", "bp"] as const)) : [];
  const allergies = Array.isArray(x.allergies) ? x.allergies.filter((c) => oneOf(c, ["dairy", "gluten", "nuts", "soy"] as const)) : [];
  if (
    !oneOf(x.goal, ["lose", "tone", "build"] as const) ||
    !oneOf(x.diet, ["veg", "jain", "egg", "nonveg", "vegan"] as const) ||
    !oneOf(x.sex, ["female", "male"] as const) ||
    !oneOf(x.activity, ["sedentary", "light", "moderate", "very"] as const) ||
    !num(x.weight, 30, 250) ||
    !num(x.height, 120, 230) ||
    !num(x.age, 14, 100)
  )
    return null;
  return {
    goal: x.goal,
    diet: x.diet,
    sex: x.sex,
    activity: x.activity,
    weight: x.weight as number,
    height: x.height as number,
    age: x.age as number,
    conditions,
    allergies,
    dislikes: typeof x.dislikes === "string" ? x.dislikes.slice(0, 200) : "",
    workoutPlace: x.workoutPlace === "gym" ? "gym" : "home",
  };
}

function readPicks(v: unknown): Record<string, string> | undefined {
  if (!v || typeof v !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [k, id] of Object.entries(v as Record<string, unknown>)) {
    if (/^[0-6]-(breakfast|lunch|snack|dinner)$/.test(k) && typeof id === "string" && id.length < 40) out[k] = id;
  }
  return out;
}

export async function GET() {
  return NextResponse.json({ enabled: aiEnabled(), model: AI_MODEL, provider: "Groq" });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many drafts in a minute — wait a moment." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const profile = readProfile(body.profile);
  if (!profile) return NextResponse.json({ error: "The client's questionnaire is incomplete." }, { status: 400 });

  try {
    const result = await draftWeekWithAI(profile, {
      previous: readPicks(body.previous),
      instruction: typeof body.instruction === "string" ? body.instruction : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AiPlanError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("ai-plan failed", e);
    return NextResponse.json({ error: "Something went wrong drafting the plan." }, { status: 500 });
  }
}
