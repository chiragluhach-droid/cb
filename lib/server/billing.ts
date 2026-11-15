/*
 * Prices, orders and access — SERVER ONLY.
 * The amount is always worked out here from the saved Subscriptions settings,
 * never taken from the browser.
 */

import { randomBytes } from "crypto";
import { parsePlan, PlanId } from "@/lib/plans";
import { findCode, priceFor, Settings } from "@/lib/settings-core";
import { OrderDoc, UserDoc, cols } from "@/lib/server/mongo";
import { paymentsOn, RzpPayment } from "@/lib/server/razorpay";

const today = () => {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export type Quote = { plan: PlanId; listPrice: number; discount: number; amount: number; code: string | null; pct: number };

/** Rupees. An unknown or inactive code is ignored (`code: null`). */
export function quote(s: Settings, plan: PlanId, rawCode: unknown): Quote {
  const { kind, duration } = parsePlan(plan);
  const listPrice = priceFor(s, kind, duration);
  const c = typeof rawCode === "string" && rawCode.trim() ? findCode(s, rawCode) : null;
  const discount = c ? Math.round((listPrice * c.pct) / 100) : 0;
  return { plan, listPrice, discount, amount: Math.max(1, listPrice - discount), code: c?.code ?? null, pct: c?.pct ?? 0 };
}

export type Access = "open" | "active" | "unpaid" | "expired";

/** "open" = payments not switched on yet, so everyone gets in. */
export function accessOf(u: Pick<UserDoc, "subscription">): Access {
  if (!paymentsOn()) return "open";
  if (!u.subscription) return "unpaid";
  return u.subscription.expiresAt > Date.now() ? "active" : "expired";
}

export const hasAccess = (u: Pick<UserDoc, "subscription">) => {
  const a = accessOf(u);
  return a === "open" || a === "active";
};

/**
 * Mark an order paid and extend the client's access. Safe to call twice (the
 * browser handler and the webhook both call it): only the first call wins.
 * Returns false when the payment doesn't match the order.
 */
export async function fulfil(order: OrderDoc, payment: RzpPayment, via: "checkout" | "webhook") {
  if (payment.order_id !== order._id || payment.amount !== order.amount * 100 || payment.currency !== "INR" || payment.status !== "captured") return false;
  const { orders, users, clientdata } = await cols();

  const claimed = await orders.findOneAndUpdate(
    { _id: order._id, status: "created" },
    { $set: { status: "paid", paymentId: payment.id, method: payment.method, paidAt: Date.now(), via }, $unset: { lastError: "" } },
  );
  if (!claimed) return true; // already fulfilled

  try {
    const u = await users.findOne({ _id: order.userId });
    if (!u) throw new Error(`user ${order.userId} missing for ${order._id}`);
    const now = Date.now();
    const stillActive = !!u.subscription && u.subscription.expiresAt > now;
    // Renewing early adds the new days after the current end date.
    const from = stillActive ? u.subscription!.expiresAt : now;
    const days = parsePlan(order.plan).duration;
    await users.updateOne(
      { _id: u._id },
      { $set: { plan: order.plan, subscription: { plan: order.plan, paidAt: now, expiresAt: from + days * 86400000, amount: order.amount, orderId: order._id } } },
    );
    // A new (or lapsed) programme starts counting from today.
    if (!stillActive) await clientdata.updateOne({ _id: u._id }, { $set: { startDate: today() } });
    // Questionnaire filled in before paying → it goes to the coach for review now.
    const cd = await clientdata.findOne({ _id: u._id }, { projection: { profile: 1, planStatus: 1, messages: 1 } });
    if (cd?.profile && cd.planStatus === "none") {
      const first = u.name.split(" ")[0] || "there";
      const text = `Hi ${first}! I'm your Evowell coach. Thanks for joining — I've got your answers and I'm building your first plan now. You'll see it in Today as soon as it's ready, usually within 24 hours. Ask me anything here.`;
      await clientdata.updateOne(
        { _id: u._id },
        { $set: { planStatus: "review" }, $push: { messages: { id: randomBytes(9).toString("base64url"), from: "coach", text, at: Date.now() } } },
      );
    }
    return true;
  } catch (e) {
    // Put the order back so the webhook retry (or the next verify) can finish the job.
    await orders.updateOne({ _id: order._id }, { $set: { status: "created", lastError: String(e) } });
    throw e;
  }
}
