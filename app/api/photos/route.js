import { NextResponse } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import { istDate } from "@/lib/dates";
import Photo from "@/models/Photo";

export async function POST(req) {
  const [user, err] = await requireUser();
  if (err) return err;
  const { data, angle } = await req.json().catch(() => ({}));
  if (typeof data !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(data)) return bad("Upload an image");
  if (data.length > 900_000) return bad("Image too large");
  const p = await Photo.create({ user: user._id, date: istDate(), angle: ["front", "side", "back"].includes(angle) ? angle : "front", data });
  return NextResponse.json({ ok: true, id: p._id, date: p.date, angle: p.angle });
}

export async function DELETE(req) {
  const [user, err] = await requireUser();
  if (err) return err;
  const id = new URL(req.url).searchParams.get("id");
  await Photo.deleteOne({ _id: id, user: user._id });
  return NextResponse.json({ ok: true });
}
