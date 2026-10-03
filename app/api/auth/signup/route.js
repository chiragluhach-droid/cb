import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie, bad } from "@/lib/auth";
import User from "@/models/User";

export async function POST(req) {
  const { name, email, password } = await req.json().catch(() => ({}));
  if (!name?.trim() || !email?.includes("@")) return bad("Name and a valid email please");
  if (!password || password.length < 8) return bad("Password needs at least 8 characters");
  await db();
  const clean = email.toLowerCase().trim();
  if (await User.exists({ email: clean })) return bad("That email already has an account. Try logging in.");
  const user = await User.create({ name: name.trim(), email: clean, passwordHash: await bcrypt.hash(password, 10) });
  return setSessionCookie(NextResponse.json({ ok: true, next: "/start" }), user);
}
