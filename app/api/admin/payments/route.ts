import { NextResponse } from "next/server";
import { cols } from "@/lib/server/mongo";
import { paymentsOn, testMode } from "@/lib/server/razorpay";
import { isAdmin } from "@/lib/server/session";

/** GET /api/admin/payments — paid orders, newest first, plus totals (coach only). */

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Coach sign-in required." }, { status: 401 });
  try {
    const { orders } = await cols();
    const paid = await orders.find({ status: "paid" }).sort({ paidAt: -1 }).limit(200).toArray();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const sum = (xs: typeof paid) => xs.reduce((n, o) => n + o.amount, 0);
    return NextResponse.json({
      on: paymentsOn(),
      testMode: testMode(),
      total: sum(paid),
      thisMonth: sum(paid.filter((o) => (o.paidAt ?? 0) >= monthStart.getTime())),
      count: paid.length,
      recent: paid.slice(0, 50).map((o) => ({ id: o._id, userId: o.userId, plan: o.plan, amount: o.amount, discount: o.discount, code: o.code, method: o.method ?? null, paidAt: o.paidAt ?? o.createdAt, paymentId: o.paymentId ?? null })),
    });
  } catch (e) {
    console.error("admin payments failed", e);
    return NextResponse.json({ error: "Couldn't load payments." }, { status: 503 });
  }
}
