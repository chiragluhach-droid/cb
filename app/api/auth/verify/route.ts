import { NextResponse } from "next/server";
import { cols } from "@/lib/server/mongo";
import { freshData, newId, toUser } from "@/lib/server/repo";
import { CLIENT_COOKIE, hashCode, setSession } from "@/lib/server/session";
import { normEmail, validEmail } from "@/lib/server/validate";

/** POST /api/auth/verify — check the 6-digit code, then create the account (sign-up) or sign in. */

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  if (!validEmail(b.email) || typeof b.code !== "string" || !/^\d{6}$/.test(b.code)) {
    return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 400 });
  }
  const email = normEmail(b.email);

  try {
    const { users, clientdata, otps } = await cols();
    const otp = await otps.findOne({ _id: email });
    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "That code has expired. Ask for a new one." }, { status: 400 });
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
      await otps.deleteOne({ _id: email });
      return NextResponse.json({ ok: false, error: "Too many wrong tries. Ask for a new code." }, { status: 429 });
    }
    if (otp.codeHash !== hashCode(email, b.code)) {
      await otps.updateOne({ _id: email }, { $inc: { attempts: 1 } });
      return NextResponse.json({ ok: false, error: "That code isn't right.", wrong: true }, { status: 400 });
    }
    await otps.deleteOne({ _id: email });

    let user = await users.findOne({ email });
    if (otp.mode === "signup") {
      if (user) return NextResponse.json({ ok: false, error: "An account with this email already exists. Log in instead." }, { status: 409 });
      const doc = { _id: newId(), name: otp.pending.name ?? "", email, phone: otp.pending.phone, plan: otp.pending.plan ?? ("meal-workout-90" as const), createdAt: Date.now(), role: "client" as const };
      try {
        await users.insertOne(doc);
      } catch {
        return NextResponse.json({ ok: false, error: "That email or phone was just registered. Log in instead." }, { status: 409 });
      }
      await clientdata.insertOne(freshData(doc._id));
      user = doc;
    } else if (!user || user.phone !== otp.pending.phone) {
      return NextResponse.json({ ok: false, error: "Account not found. Sign up first?" }, { status: 404 });
    }

    await setSession(CLIENT_COOKIE, { uid: user._id, role: "client" }, 30);
    return NextResponse.json({ ok: true, user: toUser(user), isNew: otp.mode === "signup" });
  } catch (e) {
    console.error("auth/verify failed", e);
    return NextResponse.json({ ok: false, error: "Couldn't reach the server. Try again in a moment." }, { status: 503 });
  }
}
