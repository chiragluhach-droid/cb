import { Binary } from "mongodb";
import { cols } from "@/lib/server/mongo";
import { clientId, isAdmin } from "@/lib/server/session";

/** GET /api/photos/:id — the image itself. Only its owner or the coach can see it. */

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const { photos } = await cols();
    const p = await photos.findOne({ _id: id });
    if (!p) return new Response("Not found", { status: 404 });
    const [uid, admin] = await Promise.all([clientId(), isAdmin()]);
    if (!admin && uid !== p.userId) return new Response("Not found", { status: 404 });
    // Stored as BSON binary; the driver hands it back as a Binary.
    const raw = p.data as unknown;
    const bytes = raw instanceof Binary ? raw.buffer : new Uint8Array(raw as Buffer);
    return new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": p.mime, "Cache-Control": "private, max-age=86400" },
    });
  } catch (e) {
    console.error("photo fetch failed", e);
    return new Response("Unavailable", { status: 503 });
  }
}
