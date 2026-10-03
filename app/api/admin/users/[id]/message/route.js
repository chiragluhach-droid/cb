import { NextResponse } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import { coachName } from "@/lib/plans";
import Notification from "@/models/Notification";

export async function POST(req, { params }) {
  const [, err] = await requireUser({ admin: true });
  if (err) return err;
  const { id } = await params;
  const { title, body } = await req.json().catch(() => ({}));
  if (!body?.trim()) return bad("Write a message");
  await Notification.create({ user: id, kind: "coach", title: title?.trim() || `Message from ${coachName()}`, body: body.trim() });
  return NextResponse.json({ ok: true });
}
