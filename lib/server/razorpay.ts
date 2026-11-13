/*
 * Razorpay — SERVER ONLY. Plain REST calls (no SDK), HTTP Basic auth with the
 * key id and secret. Keys come from env vars and never reach the browser,
 * except the public key id that Checkout needs.
 *
 *   RAZORPAY_KEY_ID         rzp_test_… or rzp_live_…
 *   RAZORPAY_KEY_SECRET     from the same key pair
 *   RAZORPAY_WEBHOOK_SECRET the secret you type when creating the webhook
 *
 * Payments switch on when the key id and secret are both set. Until then the
 * site keeps working as before (sign up → questionnaire, no payment step).
 */

import { createHmac, timingSafeEqual } from "crypto";

const API = "https://api.razorpay.com/v1";

const keys = () => {
  const id = process.env.RAZORPAY_KEY_ID?.trim();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return id && secret ? { id, secret } : null;
};

export const paymentsOn = () => keys() !== null;
export const publicKeyId = () => keys()?.id ?? "";
export const testMode = () => publicKeyId().startsWith("rzp_test_");

export class RazorpayError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const k = keys();
  if (!k) throw new RazorpayError("Payments aren't set up.", 503);
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${k.id}:${k.secret}`).toString("base64")}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { description?: string } };
  if (!res.ok) throw new RazorpayError(json.error?.description || `Razorpay error ${res.status}`, res.status);
  return json as T;
}

export type RzpOrder = { id: string; amount: number; currency: string; status: string };
export type RzpPayment = { id: string; order_id: string; amount: number; currency: string; status: "created" | "authorized" | "captured" | "refunded" | "failed"; method?: string };

/** `amount` is in paise. */
export const createOrder = (amount: number, receipt: string, notes: Record<string, string>) =>
  call<RzpOrder>("/orders", { method: "POST", body: { amount, currency: "INR", receipt: receipt.slice(0, 40), notes } });

export const fetchPayment = (id: string) => call<RzpPayment>(`/payments/${encodeURIComponent(id)}`);

/** Only needed when auto-capture is off in the Razorpay dashboard. */
export const capturePayment = (id: string, amount: number) =>
  call<RzpPayment>(`/payments/${encodeURIComponent(id)}/capture`, { method: "POST", body: { amount, currency: "INR" } });

const hmacMatches = (secret: string, data: string, signature: string) => {
  const want = Buffer.from(createHmac("sha256", secret).update(data).digest("hex"));
  const got = Buffer.from(signature);
  return want.length === got.length && timingSafeEqual(want, got);
};

/** Checkout's handler signature: HMAC-SHA256(order_id + "|" + payment_id, key secret). Use OUR stored order id. */
export const checkoutSignatureOk = (orderId: string, paymentId: string, signature: string) => {
  const k = keys();
  return !!k && hmacMatches(k.secret, `${orderId}|${paymentId}`, signature);
};

/** Webhook signature: HMAC-SHA256(raw request body, webhook secret). */
export const webhookSignatureOk = (rawBody: string, signature: string) => {
  const s = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  return !!s && hmacMatches(s, rawBody, signature);
};
