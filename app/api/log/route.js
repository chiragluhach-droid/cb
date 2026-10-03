import { NextResponse, after } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import { istDate } from "@/lib/dates";
import { evaluateProgress } from "@/lib/adapt";
import DailyLog from "@/models/DailyLog";

export async function POST(req) {
  const [user, err] = await requireUser();
  if (err) return err;
  const b = await req.json().catch(() => ({}));
  const today = istDate();
  // allow editing today and the previous 2 days only
  const date = b.date && b.date <= today && b.date >= istDate(new Date(Date.now() - 2 * 86400000)) ? b.date : today;

  const set = {};
  if (b.action === "meal") set[`meals.${+b.idx}`] = !!b.done;
  if (b.action === "swap") set[`swaps.${+b.idx}`] = Math.max(0, Math.min(2, +b.swap || 0));
  if (b.waterMl != null) set.waterMl = Math.max(0, Math.min(8000, +b.waterMl));
  if (b.steps != null) set.steps = Math.max(0, Math.min(100000, Math.round(+b.steps)));
  if (b.weightKg != null) {
    const w = +b.weightKg;
    if (!(w > 25 && w < 300)) return bad("That weight doesn't look right");
    set.weightKg = Math.round(w * 10) / 10;
  }
  if (b.workoutDone != null) set.workoutDone = !!b.workoutDone;
  if (!Object.keys(set).length) return bad("Nothing to update");

  const log = await DailyLog.findOneAndUpdate({ user: user._id, date }, { $set: set }, { upsert: true, returnDocument: "after" });
  user.lastLogAt = new Date();
  await user.save();
  if (set.weightKg) after(() => evaluateProgress(user).catch((e) => console.error("[adapt]", e)));
  return NextResponse.json({ ok: true, log });
}
