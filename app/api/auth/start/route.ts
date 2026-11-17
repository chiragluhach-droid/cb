import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { emailOn, sendSignInCode } from "@/lib/server/email";
import { cols } from "@/lib/server/mongo";
import { hashCode } from "@/lib/server/session";
import { normEmail, readProfile, validEmail, validName, validPhone, validPlan } from "@/lib/server/validate";

/*
 * POST /api/auth/start — email a 6-digit code.
 *   mode "signup": end of the questionnaire (name, email, phone + answers).
 *                  The details are kept as a lead right away, so the coach sees
 *                  them even if the code is never entered.
 *   mode "reset":  forgot password (email only).
 *
 * With email set up (lib/server/email.ts) the code is emailed. Without it (local
 * dev) the code is returned to the browser and shown on screen instead.
 */

export const runtime = "nodejs";

const CODE_TTL_MIN = 10;
const RESEND_AFTER_SEC = 30;

// Each code costs an email, so cap requests per IP: 6 per 10 minutes.
const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 6;
};

const fail = (error: string, field?: "email" | "phone" | "name", status = 400) => NextResponse.json({ ok: false, error, field }, { status });

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return fail("Bad request.");
  }
  const mode = b.mode === "reset" ? "reset" : b.mode === "signup" ? "signup" : null;
  if (!mode) return fail("Bad request.");
  if (!validEmail(b.email)) return fail("Enter a valid email address.", "email");
  if (mode === "signup") {
    if (!validName(b.name)) return fail("Please enter your full name.", "name");
    if (!validPhone(b.phone)) return fail("Enter a valid mobile number.", "phone");
  }
  const email = normEmail(b.email);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";

  try {
    const { users, otps, leads } = await cols();
    let name: string | undefined;
    if (mode === "signup") {
      const phone = b.phone as string;
      name = (b.name as string).trim();
      if (await users.findOne({ email })) return fail("An account with this email already exists. Log in instead.", "email");
      if (await users.findOne({ phone })) return fail("This phone number is already registered. Log in instead.", "phone");
      // Keep their details and answers now, in case they never enter the code.
      const profile = b.profile !== undefined ? readProfile(b.profile) : null;
      const now = Date.now();
      await leads.updateOne(
        { _id: email },
        {
          $set: { name, phone, updatedAt: now, ...(validPlan(b.plan) ? { plan: b.plan } : {}), ...(profile ? { profile } : {}) },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
    } else {
      const user = await users.findOne({ email });
      if (!user) return fail("No account found with this email.", "email");
      name = user.name;
    }

    if (emailOn() && limited(ip)) return NextResponse.json({ ok: false, error: "Too many codes asked for. Try again in a few minutes.", wait: 120 }, { status: 429 });

    const prev = await otps.findOne({ _id: email });
    const wait = prev ? Math.ceil(RESEND_AFTER_SEC - (Date.now() - prev.sentAt) / 1000) : 0;
    if (wait > 0) return NextResponse.json({ ok: false, error: `Please wait ${wait}s before asking for another code.`, wait }, { status: 429 });

    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    await otps.replaceOne(
      { _id: email },
      {
        codeHash: hashCode(email, code),
        mode,
        pending: mode === "signup" ? { phone: b.phone as string, name, plan: validPlan(b.plan) ? b.plan : undefined } : {},
        attempts: 0,
        sentAt: Date.now(),
        expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60000),
      },
      { upsert: true },
    );
    if (!emailOn()) return NextResponse.json({ ok: true, devCode: code }); // dummy mode: show the code on screen
    try {
      await sendSignInCode(email, code, { name, purpose: mode, minutes: CODE_TTL_MIN });
    } catch (e) {
      console.error("code email failed", e);
      await otps.deleteOne({ _id: email }); // let them try again straight away
      return fail("We couldn't send the email. Check the address and try again.", "email", 502);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("auth/start failed", e);
    return fail("Couldn't reach the server. Try again in a moment.", undefined, 503);
  }
}
