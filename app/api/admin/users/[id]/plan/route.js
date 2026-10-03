import { NextResponse } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import { generatePlan, profileFor, coachName } from "@/lib/plans";
import { buildPlan, DAYS } from "@/lib/planEngine";
import User from "@/models/User";
import Plan from "@/models/Plan";

export const maxDuration = 300;

// mode: generate (engine/AI) | clone (copy live plan to a draft) | manual (blank plan written by hand)
export async function POST(req, { params }) {
  const [, err] = await requireUser({ admin: true });
  if (err) return err;
  const { id } = await params;
  const user = await User.findById(id);
  if (!user) return bad("User not found", 404);
  const { mode = "generate", adjust = 0 } = await req.json().catch(() => ({}));

  const pending = await Plan.findOne({ user: user._id, status: { $in: ["review", "drafting"] } });
  if (pending) return bad("There's already a draft waiting. Approve or delete it first.");

  if (mode === "generate") {
    const last = await Plan.findOne({ user: user._id }).sort({ version: -1 });
    const plan = await generatePlan(user, { reason: last ? "manual" : "initial", adjust: +adjust || 0, seed: (last?.seed || 0) + 1 });
    return NextResponse.json({ ok: true, id: plan._id });
  }

  const last = await Plan.findOne({ user: user._id }).sort({ version: -1 }).lean();
  const live = await Plan.findOne({ user: user._id, status: "active" }).lean();
  let body;
  if (mode === "clone" && live) {
    body = { targets: live.targets, diet: live.diet, workout: live.workout, coachNote: live.coachNote, stage: live.stage, calorieAdjust: live.calorieAdjust, seed: live.seed };
  } else {
    const skeleton = buildPlan(profileFor(user), { stage: user.stage, reason: "manual", coachName: coachName() });
    const slots = skeleton.diet[0].meals.filter((m) => m.slot !== "Protein top-up");
    body = {
      ...skeleton,
      diet: DAYS.map((day) => ({ day, meals: slots.map((m) => ({ slot: m.slot, time: m.time, name: "", items: [{ food: "", qty: "", kcal: 0, protein: 0, carbs: 0, fat: 0 }], swaps: [] })) })),
    };
  }
  const plan = await Plan.create({
    user: user._id, version: (last?.version || 0) + 1, status: "drafting", source: "manual", reason: "manual", baseWeightKg: user.profile?.weightKg, ...body,
  });
  return NextResponse.json({ ok: true, id: plan._id });
}
