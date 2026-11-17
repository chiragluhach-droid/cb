/*
 * Client passwords — SERVER ONLY.
 * Stored as "scrypt$<salt>$<hash>" (random 16-byte salt, 64-byte key), never in plain text.
 */

import { randomBytes, scrypt, timingSafeEqual } from "crypto";

const KEYLEN = 64;

const derive = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => scrypt(password.normalize("NFKC"), salt, KEYLEN, (err, key) => (err ? reject(err) : resolve(key))));

export const PASSWORD_MIN = 8;

/** Why a password isn't acceptable, or null when it's fine. */
export function passwordProblem(p: unknown): string | null {
  if (typeof p !== "string" || p.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (p.length > 128) return "That password is too long.";
  return null;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function checkPassword(password: string, stored: string | undefined) {
  const [kind, salt, hash] = (stored ?? "").split("$");
  if (kind !== "scrypt" || !salt || !hash) {
    await derive(password, randomBytes(16)); // same work either way, so timing doesn't reveal anything
    return false;
  }
  const want = Buffer.from(hash, "base64");
  const got = await derive(password, Buffer.from(salt, "base64"));
  return want.length === got.length && timingSafeEqual(want, got);
}
