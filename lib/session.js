// Edge-safe JWT helpers (used by proxy.js and server code)
import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "khao_session";
const key = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
}

export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload;
  } catch {
    return null;
  }
}
