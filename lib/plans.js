// Plan lifecycle: generate → admin review → active → archived
import Plan from "@/models/Plan";
import Alert from "@/models/Alert";
import Notification from "@/models/Notification";
import { buildPlan } from "./planEngine";
import { aiDiet } from "./ai";

export const coachName = () => process.env.COACH_NAME || "Your coach";

export function profileFor(user) {
  return { ...(user.profile?.toObject?.() ?? user.profile), name: user.name };
}

// Creates a plan in the review queue. Skips if one is already waiting.
export async function generatePlan(user, { reason = "initial", stage, adjust = 0, seed = 0 } = {}) {
  const pending = await Plan.findOne({ user: user._id, status: { $in: ["review", "drafting"] } });
  if (pending) return pending;

  const profile = profileFor(user);
  const st = stage || user.stage;
  const base = buildPlan(profile, { stage: st, adjust, seed, reason, coachName: coachName() });

  let source = "engine";
  const ai = await aiDiet(profile, base.targets, { reason, mealsPerDay: profile.mealsPerDay });
  if (ai) {
    base.diet = ai.diet;
    base.coachNote = `${ai.coachNote}\n\n— ${coachName()}`;
    source = "ai";
  }

  const last = await Plan.findOne({ user: user._id }).sort({ version: -1 });
  const plan = await Plan.create({
    user: user._id,
    version: (last?.version || 0) + 1,
    status: "review",
    source,
    reason,
    baseWeightKg: profile.weightKg,
    ...base,
  });

  const labels = {
    initial: "New client: first plan ready for review",
    progress_adjust: "Weight dropped: adjusted plan ready for review",
    plateau: "Plateau detected: new plan ready for review",
    stage_change: "Goal reached: next-stage plan ready for review",
    manual: "Plan regenerated",
  };
  await Alert.create({ user: user._id, type: "review", message: labels[reason] });
  const cond = profile.conditions?.filter((c) => c !== "none") || [];
  if (reason === "initial" && cond.length) {
    await Alert.create({ user: user._id, type: "health", message: `Has ${cond.join(", ")}. Consider adjusting this plan by hand.` });
  }
  return plan;
}

export async function activatePlan(plan) {
  await Plan.updateMany({ user: plan.user, status: "active", _id: { $ne: plan._id } }, { status: "archived" });
  plan.status = "active";
  plan.activatedAt = new Date();
  await plan.save();
  await Alert.updateMany({ user: plan.user, type: "review", resolved: false }, { resolved: true });
  const titles = {
    initial: "Your plan is ready ✨",
    progress_adjust: "I've updated your plan",
    plateau: "New plan to break the plateau",
    stage_change: "Welcome to your next phase",
    manual: "Your plan has been updated",
  };
  await Notification.create({
    user: plan.user,
    kind: "plan",
    title: titles[plan.reason] || titles.manual,
    body: plan.coachNote?.split("\n")[0]?.slice(0, 220),
  });
  return plan;
}
