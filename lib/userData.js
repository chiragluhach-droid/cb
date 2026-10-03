import Plan from "@/models/Plan";
import DailyLog from "@/models/DailyLog";
import Notification from "@/models/Notification";
import { istDate } from "./dates";

export const plain = (x) => JSON.parse(JSON.stringify(x));

export async function activePlan(userId) {
  return Plan.findOne({ user: userId, status: "active" }).lean();
}

export async function unreadCount(userId) {
  return Notification.countDocuments({ user: userId, read: false });
}

// consecutive days (ending today or yesterday) with at least one meal ticked
export async function streak(userId) {
  const logs = await DailyLog.find({ user: userId }).sort({ date: -1 }).limit(120).select("date meals").lean();
  const active = new Set(logs.filter((l) => Object.values(l.meals || {}).some(Boolean)).map((l) => l.date));
  let n = 0;
  let d = new Date();
  if (!active.has(istDate(d))) d = new Date(d.getTime() - 86400000);
  while (active.has(istDate(d))) { n++; d = new Date(d.getTime() - 86400000); }
  return n;
}

// Which week (1-4, repeating) of the workout block the user is in
export function workoutWeek(plan) {
  if (!plan?.activatedAt) return 1;
  const days = Math.floor((Date.now() - new Date(plan.activatedAt).getTime()) / 86400000);
  return (Math.floor(days / 7) % 4) + 1;
}
