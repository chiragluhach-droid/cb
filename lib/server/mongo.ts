/*
 * MongoDB Atlas connection — SERVER ONLY.
 * One client per server process (reused across hot reloads in dev and across
 * requests on Vercel). Indexes are created once on first connect.
 */

import { Db, MongoClient } from "mongodb";
import type { DayLog, Message, Profile, UserData } from "@/lib/demo-store";
import type { PlanId } from "@/lib/plans";
import type { Settings } from "@/lib/settings-core";

export type Subscription = { plan: PlanId; paidAt: number; expiresAt: number; amount: number; orderId: string };
export type UserDoc = { _id: string; name: string; email: string; phone: string; plan: PlanId; createdAt: number; role: "client"; subscription?: Subscription };
/** One Razorpay order. Kept in "orders" because another app writes to "payments" in this database. */
export type OrderDoc = {
  _id: string; // Razorpay order id, e.g. "order_Nx…"
  userId: string;
  plan: PlanId;
  /** Rupees. */
  listPrice: number;
  discount: number;
  amount: number;
  code: string | null;
  currency: "INR";
  status: "created" | "paid";
  createdAt: number;
  paymentId?: string;
  method?: string;
  paidAt?: number;
  /** How the payment was confirmed: the browser handler or the webhook. */
  via?: "checkout" | "webhook";
  lastError?: string;
  /** The client's account was deleted; the payment record is kept for tax. */
  userDeleted?: boolean;
};
export type ClientDataDoc = Omit<UserData, "photos"> & { _id: string };
export type PhotoDoc = { _id: string; userId: string; date: string; mime: string; data: Buffer; createdAt: number };
export type OtpDoc = {
  _id: string; // normalised email
  codeHash: string;
  mode: "signup" | "login";
  pending: { name?: string; phone: string; plan?: PlanId };
  attempts: number;
  sentAt: number;
  expiresAt: Date;
};
export type SettingsDoc = Settings & { _id: "subscriptions" };

const g = globalThis as unknown as { __evoMongo?: Promise<Db> };

async function connect(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "evowell");
  await Promise.all([
    db.collection<UserDoc>("users").createIndex({ email: 1 }, { unique: true }),
    db.collection<UserDoc>("users").createIndex({ phone: 1 }, { unique: true }),
    db.collection<PhotoDoc>("photos").createIndex({ userId: 1, date: -1 }),
    db.collection<OrderDoc>("orders").createIndex({ userId: 1, createdAt: -1 }),
    // Sign-in codes delete themselves when they expire.
    db.collection<OtpDoc>("otps").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  return db;
}

export function getDb(): Promise<Db> {
  if (!g.__evoMongo) {
    g.__evoMongo = connect().catch((e) => {
      g.__evoMongo = undefined; // retry on the next request
      throw e;
    });
  }
  return g.__evoMongo;
}

export async function cols() {
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users"),
    clientdata: db.collection<ClientDataDoc>("clientdata"),
    photos: db.collection<PhotoDoc>("photos"),
    otps: db.collection<OtpDoc>("otps"),
    settings: db.collection<SettingsDoc>("settings"),
    orders: db.collection<OrderDoc>("orders"),
  };
}

export type { DayLog, Message, Profile };
