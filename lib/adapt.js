// Adapts plans to how the body is responding. Runs after every weight log / check-in.
import CheckIn from "@/models/CheckIn";
import DailyLog from "@/models/DailyLog";
import Plan from "@/models/Plan";
import Alert from "@/models/Alert";
import { generatePlan } from "./plans";
import { daysBetween, istDate } from "./dates";

export async function weightSeries(userId, sinceDays = 120) {
  const since = istDate(new Date(Date.now() - sinceDays * 86400000));
  const [checks, logs] = await Promise.all([
    CheckIn.find({ user: userId, date: { $gte: since } }).select("date weightKg").lean(),
    DailyLog.find({ user: userId, date: { $gte: since }, weightKg: { $gt: 0 } }).select("date weightKg").lean(),
  ]);
  const byDate = new Map();
  for (const l of logs) byDate.set(l.date, l.weightKg);
  for (const c of checks) byDate.set(c.date, c.weightKg); // check-ins win
  return [...byDate.entries()].map(([date, w]) => ({ date, w })).sort((a, b) => a.date.localeCompare(b.date));
}

const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

export async function evaluateProgress(user) {
  const active = await Plan.findOne({ user: user._id, status: "active" });
  if (!active?.activatedAt) return { action: "none" };
  const pending = await Plan.findOne({ user: user._id, status: "review" });
  if (pending) return { action: "pending" };

  const series = await weightSeries(user._id);
  if (series.length < 3) return { action: "none" };
  const today = istDate();
  const latest = avg(series.slice(-3).map((p) => p.w)); // smooth daily noise
  const p = user.profile;
  const losing = user.stage === "fat_loss" || user.stage === "recomp";

  // 1. Goal reached → next stage
  if (losing && p.targetWeightKg && latest <= p.targetWeightKg + 0.3) {
    user.stage = p.afterGoal === "build" ? "build" : "maintain";
    user.profile.weightKg = Math.round(latest * 10) / 10;
    await user.save();
    await Alert.create({ user: user._id, type: "goal_reached", message: `Reached goal weight (${latest.toFixed(1)} kg). Moved to ${user.stage}.` });
    await generatePlan(user, { reason: "stage_change", stage: user.stage, seed: active.seed + 1 });
    return { action: "stage_change" };
  }

  // 2. Meaningful drop since this plan started → recalc on the new weight
  if (losing && active.baseWeightKg && active.baseWeightKg - latest >= 2) {
    user.profile.weightKg = Math.round(latest * 10) / 10;
    await user.save();
    await Alert.create({ user: user._id, type: "progress", message: `Down ${(active.baseWeightKg - latest).toFixed(1)} kg on this plan. Recalculated targets.` });
    await generatePlan(user, { reason: "progress_adjust", adjust: active.calorieAdjust, seed: active.seed + 1 });
    return { action: "progress_adjust" };
  }

  // 3. Plateau: ≥ 14 days on this plan and the last 14+ days barely moved
  const planDays = daysBetween(istDate(active.activatedAt), today);
  const windowStart = istDate(new Date(Date.now() - 16 * 86400000));
  const win = series.filter((s) => s.date >= windowStart);
  if (losing && planDays >= 14 && win.length >= 3 && daysBetween(win[0].date, win.at(-1).date) >= 12) {
    const firstAvg = avg(win.slice(0, 2).map((s) => s.w));
    const lastAvg = avg(win.slice(-2).map((s) => s.w));
    if (firstAvg - lastAvg < 0.3) {
      user.profile.weightKg = Math.round(latest * 10) / 10;
      await user.save();
      await Alert.create({ user: user._id, type: "plateau", message: `Weight flat for ~${daysBetween(win[0].date, win.at(-1).date)} days (${firstAvg.toFixed(1)} → ${lastAvg.toFixed(1)} kg).` });
      await generatePlan(user, { reason: "plateau", adjust: (active.calorieAdjust || 0) - 150, seed: active.seed + 2 });
      return { action: "plateau" };
    }
  }
  return { action: "none" };
}
