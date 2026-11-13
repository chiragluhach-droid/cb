import { NextResponse } from "next/server";
import { AI_MODEL, AiPlanError, aiEnabled, draftWeekWithAI } from "@/lib/ai-plan";
import { isAdmin } from "@/lib/server/session";
import { readProfile } from "@/lib/server/validate";

/** POST /api/ai-plan — drafts a week for the coach to review. Coach sign-in required. */

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

function readPicks(v: unknown): Record<string, string> | undefined {
  if (!v || typeof v !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [k, id] of Object.entries(v as Record<string, unknown>)) {
    if (/^[0-6]-(breakfast|lunch|snack|dinner)$/.test(k) && typeof id === "string" && id.length < 40) out[k] = id;
  }
  return out;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Coach sign-in required." }, { status: 401 });
  return NextResponse.json({ enabled: aiEnabled(), model: AI_MODEL, provider: "Groq" });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Coach sign-in required." }, { status: 401 });
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
