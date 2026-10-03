import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { runReminders } from "@/lib/reminders";

export const maxDuration = 300;

// Call daily with `Authorization: Bearer $CRON_SECRET` (Vercel Cron does this automatically), or as admin
export async function GET(req) {
  const okSecret = process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  const s = await getSession();
  if (!okSecret && s?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db();
  return NextResponse.json({ ok: true, ...(await runReminders()) });
}
