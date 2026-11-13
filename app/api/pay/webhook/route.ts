import { NextResponse } from "next/server";
import { fulfil } from "@/lib/server/billing";
import { cols } from "@/lib/server/mongo";
import { RzpPayment, capturePayment, webhookSignatureOk } from "@/lib/server/razorpay";

/**
 * POST /api/pay/webhook — Razorpay server-to-server events. Backs up the
 * browser handler: if the client closes the tab right after paying, this
 * still unlocks their account. Subscribe to payment.authorized,
 * payment.captured, payment.failed and order.paid.
 *
 * Any non-2xx reply makes Razorpay retry, so errors return 500.
 */

export const runtime = "nodejs";

type Event = { event?: string; payload?: { payment?: { entity?: RzpPayment & { error_description?: string } } } };

export async function POST(req: Request) {
  const raw = await req.text();
  if (!webhookSignatureOk(raw, req.headers.get("x-razorpay-signature") ?? "")) {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }
  let ev: Event;
  try {
    ev = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad body." }, { status: 400 });
  }

  const p = ev.payload?.payment?.entity;
  if (!p?.order_id) return NextResponse.json({ ok: true, ignored: true }); // not one of ours

  try {
    const { orders } = await cols();
    const order = await orders.findOne({ _id: p.order_id });
    if (!order) return NextResponse.json({ ok: true, ignored: true }); // another app's order on the same account

    if (ev.event === "payment.authorized" && order.status !== "paid" && p.amount === order.amount * 100) {
      const captured = await capturePayment(p.id, p.amount).catch(() => null); // already captured → Razorpay says so; fine
      if (captured?.status === "captured") await fulfil(order, captured, "webhook");
    } else if ((ev.event === "payment.captured" || ev.event === "order.paid") && p.status === "captured") {
      await fulfil(order, p, "webhook");
    } else if (ev.event === "payment.failed" && order.status !== "paid") {
      await orders.updateOne({ _id: order._id }, { $set: { lastError: p.error_description || "Payment failed" } });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("pay/webhook failed", e);
    return NextResponse.json({ error: "Try again." }, { status: 500 });
  }
}
