import { NextResponse } from "next/server";
import { cols } from "@/lib/server/mongo";
import { newId } from "@/lib/server/repo";
import { clientId } from "@/lib/server/session";
import { isDayKey } from "@/lib/server/validate";

/** POST /api/me/photos — add a progress photo (already shrunk in the browser). Keeps the latest 12. */

export const runtime = "nodejs";

const MAX_BYTES = 900 * 1024;
const KEEP = 12;

export async function POST(req: Request) {
  const id = await clientId();
  if (!id) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const m = typeof b.dataUrl === "string" ? b.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/) : null;
  if (!m || !isDayKey(b.date)) return NextResponse.json({ error: "That photo couldn't be read." }, { status: 400 });
  const data = Buffer.from(m[2], "base64");
  if (data.length > MAX_BYTES) return NextResponse.json({ error: "That photo is too large." }, { status: 413 });

  try {
    const { photos } = await cols();
    const pid = typeof b.id === "string" && /^[\w-]{4,40}$/.test(b.id) ? b.id : newId();
    await photos.insertOne({ _id: pid, userId: id, date: b.date, mime: m[1], data, createdAt: Date.now() });
    const extra = await photos.find({ userId: id }, { projection: { _id: 1 } }).sort({ date: -1, createdAt: -1 }).skip(KEEP).toArray();
    if (extra.length) await photos.deleteMany({ _id: { $in: extra.map((x) => x._id) } });
    return NextResponse.json({ ok: true, photo: { id: pid, date: b.date, src: `/api/photos/${pid}` } });
  } catch (e) {
    console.error("photo upload failed", e);
    return NextResponse.json({ error: "Couldn't save the photo." }, { status: 503 });
  }
}
