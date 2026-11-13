import { NextResponse } from "next/server";
import { CLIENT_COOKIE, clearSession } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST() {
  await clearSession(CLIENT_COOKIE);
  return NextResponse.json({ ok: true });
}
