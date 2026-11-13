import { NextResponse } from "next/server";
import { cols } from "@/lib/server/mongo";
import { clearSettingsCache, getSettings } from "@/lib/server/repo";
import { isAdmin } from "@/lib/server/session";
import { readSettings } from "@/lib/server/validate";

/** GET /api/settings — prices, plan contents and codes (public). PUT — coach saves them. */

export const runtime = "nodejs";

export async function GET() {
  const s = await getSettings();
  // Codes stay server-side for the public; the coach gets them via PUT responses / admin load.
  return NextResponse.json((await isAdmin()) ? s : { ...s, codes: [] });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Coach sign-in required." }, { status: 401 });
  let s;
  try {
    s = readSettings(await req.json());
  } catch {
    s = null;
  }
  if (!s) return NextResponse.json({ error: "Bad settings." }, { status: 400 });
  try {
    const { settings } = await cols();
    await settings.replaceOne({ _id: "subscriptions" }, s, { upsert: true });
    clearSettingsCache();
    return NextResponse.json(s);
  } catch (e) {
    console.error("settings PUT failed", e);
    return NextResponse.json({ error: "Couldn't save settings." }, { status: 503 });
  }
}
