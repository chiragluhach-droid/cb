import { NextResponse } from "next/server";
import { ADMIN_COOKIE, sameSecret, setSession } from "@/lib/server/session";

/** POST /api/admin/login — coach sign-in with ADMIN_EMAIL / ADMIN_PASSWORD from the server environment. */

export const runtime = "nodejs";

// Slow down password guessing: 8 tries per 10 minutes per IP.
const tries = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const recent = (tries.get(ip) ?? []).filter((t) => now - t < 600000);
  if (recent.length >= 8) return NextResponse.json({ ok: false, error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return NextResponse.json({ ok: false, error: "Coach login isn't set up on the server (ADMIN_EMAIL / ADMIN_PASSWORD)." }, { status: 503 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const okEmail = typeof b.email === "string" && sameSecret(b.email.trim().toLowerCase(), email.trim().toLowerCase());
  const okPass = typeof b.password === "string" && sameSecret(b.password, password);
  if (!okEmail || !okPass) {
    recent.push(now);
    tries.set(ip, recent);
    return NextResponse.json({ ok: false, error: "That email and password don't match the coach account." }, { status: 401 });
  }
  await setSession(ADMIN_COOKIE, { uid: "coach", role: "admin" }, 7);
  return NextResponse.json({ ok: true });
}
