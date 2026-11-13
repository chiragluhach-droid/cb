import { NextResponse } from "next/server";
import { ADMIN_COOKIE, clearSession } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST() {
  await clearSession(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
