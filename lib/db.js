import mongoose from "mongoose";

let cached = globalThis._mongoose || (globalThis._mongoose = { conn: null, promise: null });

export async function db() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  cached.promise ||= mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || "khao",
  });
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
