import { NextResponse, after } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import { istDate } from "@/lib/dates";
import { evaluateProgress } from "@/lib/adapt";
import CheckIn from "@/models/CheckIn";
import DailyLog from "@/models/DailyLog";

const n = (v) => (v === "" || v == null || !Number.isFinite(+v) ? undefined : Math.round(+v * 10) / 10);

export async function POST(req) {
  const [user, err] = await requireUser();
  if (err) return err;
  const b = await req.json().catch(() => ({}));
  const weightKg = n(b.weightKg);
  if (!(weightKg > 25 && weightKg < 300)) return bad("Add your weight to check in");
  const date = istDate();
  const data = { weightKg, waistCm: n(b.waistCm), chestCm: n(b.chestCm), hipsCm: n(b.hipsCm), armCm: n(b.armCm), thighCm: n(b.thighCm), energy: n(b.energy), hunger: n(b.hunger), note: String(b.note || "").slice(0, 600) };
  const c = await CheckIn.findOneAndUpdate({ user: user._id, date }, { $set: data }, { upsert: true, returnDocument: "after" });
  await DailyLog.updateOne({ user: user._id, date }, { $set: { weightKg } }, { upsert: true });
  user.lastLogAt = new Date();
  await user.save();
  after(() => evaluateProgress(user).catch((e) => console.error("[adapt]", e)));
  return NextResponse.json({ ok: true, checkin: c });
}
