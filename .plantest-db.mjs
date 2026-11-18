import { MongoClient } from "mongodb";
import fs from "fs";
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; }));
const TEST = "khao2_plantest";
const c = new MongoClient(env.MONGODB_URI); await c.connect();
if (process.argv[2] === "setup") {
  const live = await c.db(env.MONGODB_DB).collection("settings").findOne({ _id: "subscriptions" });
  await c.db(TEST).collection("settings").replaceOne({ _id: "subscriptions" }, live, { upsert: true });
  console.log("copied live settings into test db; old shape:", !Array.isArray(live.plans), "| meal monthly:", live.plans?.meal?.monthly);
} else if (process.argv[2] === "teardown") {
  if (TEST === env.MONGODB_DB) throw new Error("refusing");
  await c.db(TEST).dropDatabase();
  console.log("dropped", TEST);
}
await c.close();
