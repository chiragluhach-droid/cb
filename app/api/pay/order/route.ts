import { NextResponse } from "next/server";
import { quote } from "@/lib/server/billing";
import { cols } from "@/lib/server/mongo";
import { RazorpayError, createOrder, paymentsOn, publicKeyId } from "@/lib/server/razorpay";
import { getSettings } from "@/lib/server/repo";
import { clientId } from "@/lib/server/session";
import { validPlan } from "@/lib/server/validate";

/**
 * POST /api/pay/order { plan, code? } — creates a Razorpay order for the
 * signed-in client at the server-side price, and returns what Checkout needs.
 */

export const runtime = "nodejs";

const hits = new Map<string, number[]>();
const limited = (key: string) => {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 10;
};

export async function POST(req: Request) {
  const uid = await clientId();
  if (!uid) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!paymentsOn()) return NextResponse.json({ error: "Online payments aren't switched on yet." }, { status: 503 });
  if (limited(uid)) return NextResponse.json({ error: "Too many tries. Wait a minute." }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!validPlan(b.plan)) return NextResponse.json({ error: "Pick a plan." }, { status: 400 });

  try {
    const { users, orders } = await cols();
    const user = await users.findOne({ _id: uid });
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

    const q = quote(await getSettings(), b.plan, b.code);
    const order = await createOrder(q.amount * 100, `evo_${uid}_${Date.now().toString(36)}`, { userId: uid, plan: q.plan, email: user.email });
    await orders.insertOne({
      _id: order.id,
      userId: uid,
      plan: q.plan,
      listPrice: q.listPrice,
      discount: q.discount,
      amount: q.amount,
      code: q.code,
      currency: "INR",
      status: "created",
      createdAt: Date.now(),
    });
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKeyId(),
      prefill: { name: user.name, email: user.email, contact: user.phone },
    });
  } catch (e) {
    console.error("pay/order failed", e);
    const auth = e instanceof RazorpayError && e.status === 401;
    return NextResponse.json(
      { error: auth ? "Payments are misconfigured — the coach has been told." : "Couldn't start the payment. Try again in a moment." },
      { status: 502 },
    );
  }
}
