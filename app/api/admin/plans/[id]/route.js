import { NextResponse } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import { activatePlan } from "@/lib/plans";
import Plan from "@/models/Plan";

const num = (v) => Math.max(0, Math.round(+v || 0));

// Recompute meal totals from items so hand edits stay consistent
function cleanDiet(diet) {
  if (!Array.isArray(diet)) return undefined;
  const dish = (d) => {
    const items = (d.items || []).filter((i) => i.food?.trim()).map((i) => ({ food: i.food.trim(), qty: String(i.qty || ""), kcal: num(i.kcal), protein: +(+i.protein || 0).toFixed(1), carbs: +(+i.carbs || 0).toFixed(1), fat: +(+i.fat || 0).toFixed(1) }));
    const t = items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
    return { name: String(d.name || "").trim(), items, kcal: Math.round(t.kcal), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat) };
  };
  return diet.map((day) => ({
    day: day.day,
    meals: (day.meals || []).map((m) => ({ slot: m.slot || "Meal", time: m.time || "", ...dish(m), swaps: (m.swaps || []).map(dish).filter((s) => s.name) })),
  }));
}

export async function PATCH(req, { params }) {
  const [, err] = await requireUser({ admin: true });
  if (err) return err;
  const { id } = await params;
  const plan = await Plan.findById(id);
  if (!plan) return bad("Plan not found", 404);
  const b = await req.json().catch(() => ({}));

  if (b.action === "save" || b.action === "save_approve") {
    if (b.targets) plan.targets = { ...plan.targets, ...Object.fromEntries(Object.entries(b.targets).map(([k, v]) => [k, num(v)])) };
    const diet = cleanDiet(b.diet);
    if (diet) {
      if (diet.some((d) => d.meals.some((m) => !m.name || !m.items.length))) return bad("Every meal needs a name and at least one item");
      plan.diet = diet;
    }
    if (b.workout) plan.workout = b.workout;
    if (typeof b.coachNote === "string") plan.coachNote = b.coachNote;
    if (typeof b.adminNote === "string") plan.adminNote = b.adminNote;
    plan.markModified("diet"); plan.markModified("workout"); plan.markModified("targets");
    await plan.save();
  }
  if (b.action === "approve" || b.action === "save_approve") {
    if (plan.status === "active") return bad("Already live");
    if (plan.diet.some((d) => d.meals.some((m) => !m.name || !m.items?.length))) return bad("Fill in every meal before sending");
    await activatePlan(plan);
  }
  return NextResponse.json({ ok: true, plan });
}

export async function DELETE(req, { params }) {
  const [, err] = await requireUser({ admin: true });
  if (err) return err;
  const { id } = await params;
  const plan = await Plan.findById(id);
  if (!plan) return bad("Plan not found", 404);
  if (plan.status === "active") return bad("Can't delete the live plan. Approve a new one first.");
  await plan.deleteOne();
  return NextResponse.json({ ok: true });
}
