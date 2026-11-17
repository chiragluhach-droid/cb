import { NextResponse } from "next/server";
import { cols } from "@/lib/server/mongo";
import { isAdmin } from "@/lib/server/session";
import { normEmail, validEmail } from "@/lib/server/validate";

/** DELETE /api/admin/leads?email= — forget someone who never finished signing up (coach only). */

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Coach sign-in required." }, { status: 401 });
  const email = new URL(req.url).searchParams.get("email");
  if (!validEmail(email)) return NextResponse.json({ error: "Bad email." }, { status: 400 });
  try {
    const { leads } = await cols();
    await leads.deleteOne({ _id: normEmail(email) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("lead delete failed", e);
    return NextResponse.json({ error: "Couldn't delete." }, { status: 503 });
  }
}
