import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie, bad } from "@/lib/auth";
import User from "@/models/User";

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  await db();
  const user = await User.findOne({ email: String(email || "").toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) return bad("Wrong email or password", 401);
  const next = user.role === "admin" ? "/admin" : !user.onboarded ? "/start" : user.subscription?.status !== "active" ? "/checkout" : "/dashboard";
  return setSessionCookie(NextResponse.json({ ok: true, next }), user);
}
