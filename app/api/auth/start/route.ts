import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { emailOn, sendSignInCode } from "@/lib/server/email";
import { cols } from "@/lib/server/mongo";
import { hashCode } from "@/lib/server/session";
import { normEmail, validEmail, validName, validPhone, validPlan } from "@/lib/server/validate";

/*
 * POST /api/auth/start — check the details, then email a 6-digit sign-in code.
 *
 * With RESEND_API_KEY set, the code is emailed (lib/server/email.ts). Without
 * it (local dev, or before email is set up) the code is returned to the
 * browser and shown on screen instead.
 */

export const runtime = "nodejs";

const CODE_TTL_MIN = 10;
const RESEND_AFTER_SEC = 30;

async function deliver(email: string, code: string, name: string | undefined, signup: boolean): Promise<{ devCode?: string }> {
  if (!emailOn()) return { devCode: code }; // dummy mode
  await sendSignInCode(email, code, { name, signup, minutes: CODE_TTL_MIN });
  return {};
}

// Each code costs an email (free plan: 100 a day), so cap requests per IP: 6 per 10 minutes.
const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 6;
};

const byName = (u: { name?: string } | null) => u?.name;

const fail = (error: string, field?: "email" | "phone" | "name", status = 400) => NextResponse.json({ ok: false, error, field }, { status });

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return fail("Bad request.");
  }
  const mode = b.mode === "signup" ? "signup" : "login";
  if (!validEmail(b.email)) return fail("Enter a valid email address.", "email");
  if (!validPhone(b.phone)) return fail("Enter a valid mobile number.", "phone");
  if (mode === "signup" && !validName(b.name)) return fail("Please enter your full name.", "name");
  const email = normEmail(b.email);
  const phone = b.phone;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (emailOn() && limited(ip)) return NextResponse.json({ ok: false, error: "Too many codes asked for. Try again in a few minutes.", wait: 120 }, { status: 429 });

  try {
    const { users, otps } = await cols();
    if (mode === "signup") {
      if (await users.findOne({ email })) return fail("An account with this email already exists. Log in instead.", "email");
      if (await users.findOne({ phone })) return fail("This phone number is already registered. Log in instead.", "phone");
    } else {
      const byEmail = await users.findOne({ email });
      if (!byEmail) {
        if (await users.findOne({ phone })) return fail("That email doesn't match the account for this phone number.", "email");
        return fail("No account found with this email and phone. Sign up first?");
      }
      if (byEmail.phone !== phone) return fail("This phone number doesn't match the account for that email.", "phone");
    }

    const prev = await otps.findOne({ _id: email });
    const wait = prev ? Math.ceil(RESEND_AFTER_SEC - (Date.now() - prev.sentAt) / 1000) : 0;
    if (wait > 0) return NextResponse.json({ ok: false, error: `Please wait ${wait}s before asking for another code.`, wait }, { status: 429 });

    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    await otps.replaceOne(
      { _id: email },
      {
        codeHash: hashCode(email, code),
        mode,
        pending: { phone, name: mode === "signup" ? (b.name as string).trim() : undefined, plan: validPlan(b.plan) ? b.plan : undefined },
        attempts: 0,
        sentAt: Date.now(),
        expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60000),
      },
      { upsert: true }
    );
    let sent: { devCode?: string };
    try {
      sent = await deliver(email, code, mode === "signup" ? (b.name as string).trim() : byName(await users.findOne({ email })), mode === "signup");
    } catch (e) {
      console.error("sign-in email failed", e);
      await otps.deleteOne({ _id: email }); // let them try again straight away
      return fail("We couldn't send the email. Check the address and try again.", "email", 502);
    }
    return NextResponse.json({ ok: true, ...sent });
  } catch (e) {
    console.error("auth/start failed", e);
    return fail("Couldn't reach the server. Try again in a moment.", undefined, 503);
  }
}
