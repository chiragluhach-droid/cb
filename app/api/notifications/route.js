import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import Notification from "@/models/Notification";

export async function POST() {
  const [user, err] = await requireUser();
  if (err) return err;
  await Notification.updateMany({ user: user._id, read: false }, { read: true });
  return NextResponse.json({ ok: true });
}
