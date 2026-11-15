import { Binary } from "mongodb";
import { cols } from "@/lib/server/mongo";

/** GET /api/recipe-photos/:id — a recipe photo. Not personal data, so no sign-in needed. */

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const { recipephotos } = await cols();
    const p = await recipephotos.findOne({ _id: id });
    if (!p) return new Response("Not found", { status: 404 });
    const raw = p.data as unknown;
    const bytes = raw instanceof Binary ? raw.buffer : (raw as Buffer);
    return new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": p.mime, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Unavailable", { status: 503 });
  }
}
