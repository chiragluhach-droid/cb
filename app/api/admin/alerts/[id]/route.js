import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import Alert from "@/models/Alert";

export async function PATCH(req, { params }) {
  const [, err] = await requireUser({ admin: true });
  if (err) return err;
  const { id } = await params;
  await Alert.updateOne({ _id: id }, { resolved: true });
  return NextResponse.json({ ok: true });
}
