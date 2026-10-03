// Creates (or resets) the admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env.local
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { MONGODB_URI, MONGODB_DB = "khao", ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD");

await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
const users = mongoose.connection.collection("users");
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
await users.updateOne(
  { email: ADMIN_EMAIL.toLowerCase() },
  { $set: { role: "admin", passwordHash, onboarded: true, updatedAt: new Date() }, $setOnInsert: { name: "Admin", email: ADMIN_EMAIL.toLowerCase(), createdAt: new Date(), profile: {}, subscription: { status: "none" } } },
  { upsert: true }
);
await users.createIndex({ email: 1 }, { unique: true });
console.log(`✓ admin ready: ${ADMIN_EMAIL}`);
await mongoose.disconnect();
