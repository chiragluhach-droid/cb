import { NextResponse } from "next/server";
import { cols } from "@/lib/server/mongo";
import { checkPassword } from "@/lib/server/password";
import { toUser } from "@/lib/server/repo";
import { CLIENT_COOKIE, setSession } from "@/lib/server/session";
import { normEmail, validEmail } from "@/lib/server/validate";

/** POST /api/auth/login — email + password sign-in for clients. */

export const runtime = "nodejs";

const MAX_FAILS = 8; // wrong tries per account…
const LOCK_MS = 15 * 60000; // …then locked for 15 minutes

// Per-IP cap as well: 30 tries per 10 minutes.
const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
};

const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) => NextResponse.json({ ok: false, error, ...extra }, { status });

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return fail("Bad request.");
  }
  if (!validEmail(b.email)) return fail("Enter a valid email address.", 400, { field: "email" });
  if (typeof b.password !== "string" || !b.password) return fail("Enter your password.", 400, { field: "password" });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return fail("Too many tries. Wait a few minutes and try again.", 429);
  const email = normEmail(b.email);

  try {
    const { users } = await cols();
    const user = await users.findOne({ email });
    if (user && !user.passwordHash) {
      return fail("You haven't set a password yet. Tap “Forgot password?” and we'll email you a code to set one.", 400, { noPassword: true });
    }
    const f = user?.loginFails;
    if (f && f.count >= MAX_FAILS && Date.now() - f.at < LOCK_MS) {
      return fail("Too many wrong tries. Wait 15 minutes, or reset your password.", 429);
    }
    if (!user || !(await checkPassword(b.password, user.passwordHash))) {
      if (user) {
        const count = f && Date.now() - f.at < LOCK_MS ? f.count + 1 : 1;
        await users.updateOne({ _id: user._id }, { $set: { loginFails: { count, at: Date.now() } } });
      }
      return fail("That email and password don't match.", 401, { field: "password" });
    }
    if (f) await users.updateOne({ _id: user._id }, { $unset: { loginFails: "" } });
    await setSession(CLIENT_COOKIE, { uid: user._id, role: "client" }, 30);
    return NextResponse.json({ ok: true, user: toUser(user), isNew: false });
  } catch (e) {
    console.error("auth/login failed", e);
    return fail("Couldn't reach the server. Try again in a moment.", 503);
  }
}
