import { NextResponse } from "next/server";
import { quote } from "@/lib/server/billing";
import { paymentsOn, testMode } from "@/lib/server/razorpay";
import { getSettings } from "@/lib/server/repo";
import { clientId } from "@/lib/server/session";
import { validPlan } from "@/lib/server/validate";

/** POST /api/pay/quote { plan, code? } — the price the server will charge, with a discount code checked. */

export const runtime = "nodejs";

// Stops anyone guessing discount codes quickly: 20 checks a minute per account.
const hits = new Map<string, number[]>();
const limited = (key: string) => {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 20;
};

export async function POST(req: Request) {
  const uid = await clientId();
  if (!uid) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (limited(uid)) return NextResponse.json({ error: "Too many tries. Wait a minute." }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!validPlan(b.plan)) return NextResponse.json({ error: "Pick a plan." }, { status: 400 });
  const q = quote(await getSettings(), b.plan, b.code);
  const codeError = typeof b.code === "string" && b.code.trim() && !q.code ? "That code isn't valid or has expired." : undefined;
  return NextResponse.json({ ...q, codeError, paymentsOn: paymentsOn(), testMode: testMode() });
}
