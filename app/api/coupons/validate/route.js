import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quote } from "@/lib/billing";

export async function GET(req) {
  const u = new URL(req.url);
  await db();
  const q = await quote(u.searchParams.get("plan") || "30", u.searchParams.get("currency"), u.searchParams.get("code"));
  if (!q.coupon) return NextResponse.json({ valid: false, amount: q.amount, listPrice: q.listPrice });
  return NextResponse.json({ valid: true, code: q.coupon.code, discount: q.discount, amount: q.amount, listPrice: q.listPrice });
}
