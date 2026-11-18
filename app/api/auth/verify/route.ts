import { NextResponse } from "next/server";
import { cols } from "@/lib/server/mongo";
import { accessOf } from "@/lib/server/billing";
import { freshData, getSettings, newId, toUser, today, welcomeMessage } from "@/lib/server/repo";
import { defaultPlanKey, findOption } from "@/lib/plans";
import { CLIENT_COOKIE, hashCode, setSession } from "@/lib/server/session";
import { normEmail, readProfile, validEmail } from "@/lib/server/validate";
import { hashPassword, passwordProblem } from "@/lib/server/password";

/**
 * POST /api/auth/verify — check the 6-digit code, then:
 *   sign-up: create the account (with its password and questionnaire answers)
 *   reset:   set the new password
 * and sign in.
 */

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
    const { users, clientdata, otps, leads } = await cols();
    const otp = await otps.findOne({ _id: email });
    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "That code has expired. Ask for a new one." }, { status: 400 });
    }
    // Check the new password first, so a weak one doesn't use up the code.
    const needsPassword = otp.mode === "signup" || otp.mode === "reset";
    const weak = needsPassword ? passwordProblem(b.password) : null;
    if (weak) return NextResponse.json({ ok: false, error: weak, field: "password" }, { status: 400 });
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
      const doc = {
        _id: newId(),
        name: otp.pending.name ?? "",
        email,
        phone: otp.pending.phone ?? "",
        plan: await (async () => {
          const plans = (await getSettings()).plans;
          return otp.pending.plan && findOption(plans, otp.pending.plan) ? otp.pending.plan : defaultPlanKey(plans);
        })(),
        createdAt: Date.now(),
        role: "client" as const,
        passwordHash: await hashPassword(b.password as string),
      };
      try {
        await users.insertOne(doc);
      } catch {
        return NextResponse.json({ ok: false, error: "That email or phone was just registered. Log in instead." }, { status: 409 });
      }
      // Sign-up from the end of the questionnaire: the answers arrive with the code.
      const profile = b.profile !== undefined ? readProfile(b.profile) : null;
      const data = freshData(doc._id);
      if (profile) {
        data.profile = profile;
        data.weights = [{ date: today(), kg: profile.weight }];
        // While payments are off everyone gets in, so the answers go straight to the coach.
        if (accessOf({}) === "open") {
          data.planStatus = "review";
          data.messages = [welcomeMessage(doc.name)];
        }
      }
      await clientdata.insertOne(data);
      await leads.deleteOne({ _id: email }); // now a real client
      user = doc;
    } else if (otp.mode === "reset") {
      if (!user) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
      await users.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(b.password as string) }, $unset: { loginFails: "" } });
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
