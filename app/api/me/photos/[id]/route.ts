import { NextResponse } from "next/server";
import { cols } from "@/lib/server/mongo";
import { clientId } from "@/lib/server/session";

/** DELETE /api/me/photos/:id — remove one of the client's own photos. */

export const runtime = "nodejs";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await clientId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const { photos } = await cols();
    await photos.deleteOne({ _id: id, userId: uid });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("photo delete failed", e);
    return NextResponse.json({ error: "Couldn't delete the photo." }, { status: 503 });
  }
}
