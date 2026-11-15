/** Recipe photo upload — SERVER ONLY. The browser shrinks photos first. */
const MAX_BYTES = 900 * 1024;

export function readPhoto(v: unknown): { mime: string; data: Buffer } | "invalid" | null {
  if (v === undefined || v === null) return null;
  const m = typeof v === "string" ? v.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/) : null;
  if (!m) return "invalid";
  const data = Buffer.from(m[2], "base64");
  if (data.length > MAX_BYTES) return "invalid";
  return { mime: m[1], data };
}
