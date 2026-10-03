import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import Coupon from "@/models/Coupon";

export async function PATCH(req, { params }) {
  const [, err] = await requireUser({ admin: true });
  if (err) return err;
  const { id } = await params;
  const c = await Coupon.findById(id);
  c.active = !c.active;
  await c.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const [, err] = await requireUser({ admin: true });
  if (err) return err;
  const { id } = await params;
  await Coupon.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
