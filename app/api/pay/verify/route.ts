import { NextResponse } from "next/server";
import { fulfil } from "@/lib/server/billing";
import { cols } from "@/lib/server/mongo";
import { capturePayment, checkoutSignatureOk, fetchPayment } from "@/lib/server/razorpay";
import { toUser } from "@/lib/server/repo";
import { clientId } from "@/lib/server/session";

/**
 * POST /api/pay/verify — called by the Checkout success handler with
 * { razorpay_payment_id, razorpay_order_id, razorpay_signature }.
 * Checks the signature against OUR stored order, confirms the payment with
 * Razorpay (capturing it if auto-capture is off), then unlocks the account.
 */

export const runtime = "nodejs";

const str = (v: unknown) => (typeof v === "string" && v.length < 100 ? v : "");

export async function POST(req: Request) {
  const uid = await clientId();
  if (!uid) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const orderId = str(b.razorpay_order_id);
  const paymentId = str(b.razorpay_payment_id);
  const signature = str(b.razorpay_signature);
  if (!orderId || !paymentId || !signature) return NextResponse.json({ ok: false, error: "Missing payment details." }, { status: 400 });

  try {
    const { orders, users } = await cols();
    const order = await orders.findOne({ _id: orderId, userId: uid });
    if (!order) return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    if (!checkoutSignatureOk(order._id, paymentId, signature)) {
      return NextResponse.json({ ok: false, error: "We couldn't verify this payment. If money left your account, it will be refunded automatically." }, { status: 400 });
    }

    if (order.status !== "paid") {
      let payment = await fetchPayment(paymentId);
      if (payment.status === "authorized" && payment.order_id === order._id && payment.amount === order.amount * 100) {
        payment = await capturePayment(paymentId, payment.amount);
      }
      if (payment.status !== "captured") {
        return NextResponse.json({ ok: false, pending: true, error: "Your bank is still confirming the payment. This page will update when it does." }, { status: 202 });
      }
      if (!(await fulfil(order, payment, "checkout"))) {
        return NextResponse.json({ ok: false, error: "The payment doesn't match this order. Contact us and we'll sort it out." }, { status: 400 });
      }
    }

    const user = await users.findOne({ _id: uid });
    return NextResponse.json({ ok: true, user: user ? toUser(user) : null });
  } catch (e) {
    console.error("pay/verify failed", e);
    return NextResponse.json({ ok: false, pending: true, error: "Couldn't confirm the payment yet. Don't pay again — refresh in a minute." }, { status: 503 });
  }
}
