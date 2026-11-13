/*
 * Signed session cookies — SERVER ONLY.
 * The cookie holds { uid, role, exp } plus an HMAC signature made with
 * SESSION_SECRET, so it can't be forged or edited in the browser. It's
 * httpOnly, so page scripts can't read it either.
 */

import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const CLIENT_COOKIE = "evo_s";
export const ADMIN_COOKIE = "evo_a";

type Payload = { uid: string; role: "client" | "admin"; exp: number };

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is missing or too short");
  return s;
};

const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

export function makeToken(p: Payload) {
  const body = b64(JSON.stringify(p));
  return `${body}.${sign(body)}`;
}

export function readToken(token: string | undefined): Payload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const want = Buffer.from(sign(body));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

const cookieOpts = (maxAgeSec: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: maxAgeSec,
});

export async function setSession(name: string, p: Omit<Payload, "exp">, days: number) {
  const exp = Date.now() + days * 86400000;
  (await cookies()).set(name, makeToken({ ...p, exp }), cookieOpts(days * 86400));
}

export async function clearSession(name: string) {
  (await cookies()).set(name, "", cookieOpts(0));
}

/** The signed-in client's id, or null. */
export async function clientId() {
  const p = readToken((await cookies()).get(CLIENT_COOKIE)?.value);
  return p?.role === "client" ? p.uid : null;
}

/** True when the coach is signed in. */
export async function isAdmin() {
  const p = readToken((await cookies()).get(ADMIN_COOKIE)?.value);
  return p?.role === "admin";
}

/** Constant-time comparison for the coach login. */
export function sameSecret(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export const hashCode = (email: string, code: string) => createHmac("sha256", secret()).update(`${email}:${code}`).digest("hex");
