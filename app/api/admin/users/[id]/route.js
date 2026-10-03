import { NextResponse } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import User from "@/models/User";

export async function PATCH(req, { params }) {
  const [, err] = await requireUser({ admin: true });
  if (err) return err;
  const { id } = await params;
  const user = await User.findById(id);
  if (!user) return bad("User not found", 404);
  const b = await req.json().catch(() => ({}));
  if (b.stage && ["fat_loss", "recomp", "maintain", "build"].includes(b.stage)) user.stage = b.stage;
  if (b.targetWeightKg) user.profile.targetWeightKg = +b.targetWeightKg;
  if (b.extendDays) {
    const now = new Date();
    const from = user.subscription?.endsAt > now ? user.subscription.endsAt : now;
    user.subscription = { plan: user.subscription?.plan || "30", status: "active", startsAt: user.subscription?.startsAt || now, endsAt: new Date(from.getTime() + +b.extendDays * 86400000) };
  }
  if (b.cancel) user.subscription.status = "expired";
  await user.save();
  return NextResponse.json({ ok: true });
}
