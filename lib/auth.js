import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, signSession, verifySession } from "./session";
import { db } from "./db";
import User from "@/models/User";

export async function setSessionCookie(res, user) {
  const token = await signSession({ sub: String(user._id), role: user.role });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(COOKIE)?.value);
}

export async function getUser() {
  const s = await getSession();
  if (!s?.sub) return null;
  await db();
  return User.findById(s.sub);
}

// For route handlers: returns [user, null] or [null, errorResponse]
export async function requireUser({ admin = false } = {}) {
  const user = await getUser();
  if (!user) return [null, NextResponse.json({ error: "Not logged in" }, { status: 401 })];
  if (admin && user.role !== "admin") return [null, NextResponse.json({ error: "Forbidden" }, { status: 403 })];
  return [user, null];
}

export const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });
