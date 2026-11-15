import { NextResponse } from "next/server";
import { baseDishIds } from "@/lib/engine";
import { readRecipe } from "@/lib/recipes-core";
import { cols } from "@/lib/server/mongo";
import { readPhoto } from "@/lib/server/recipe-photo";
import { recipeDish } from "@/lib/server/repo";
import { isAdmin } from "@/lib/server/session";

/*
 * PUT    /api/admin/recipes/:id — save changes. `photo`: dataUrl = replace,
 *        null = remove, missing = keep.
 * DELETE /api/admin/recipes/:id — delete a recipe (plans that used it fall
 *        back to their original dish), or reset an edited built-in dish.
 */

export const runtime = "nodejs";

const denied = () => NextResponse.json({ error: "Coach sign-in required." }, { status: 401 });

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return denied();
  const { id } = await ctx.params;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const r = readRecipe(b);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  const photo = b && "photo" in b ? readPhoto(b.photo) : undefined;
  if (photo === "invalid") return NextResponse.json({ error: "That photo couldn't be used. Try a JPG or PNG." }, { status: 400 });
  try {
    const { recipes, recipephotos } = await cols();
    const now = Date.now();
    // Editing a built-in dish saves the coach's version under the same id.
    const isBase = baseDishIds.has(id);
    const cur = (await recipes.findOne({ _id: id })) ?? (isBase ? { _id: id, photoV: null, createdAt: now } : null);
    if (!cur) return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
    let photoV = cur.photoV;
    if (photo) {
      await recipephotos.replaceOne({ _id: id }, photo, { upsert: true });
      photoV = now;
    } else if (photo === null) {
      await recipephotos.deleteOne({ _id: id });
      photoV = null;
    }
    const doc = { ...cur, ...r.recipe, ...(isBase ? { auto: true, shared: false } : {}), photoV, updatedAt: now };
    await recipes.replaceOne({ _id: id }, doc, { upsert: true });
    return NextResponse.json({ recipe: recipeDish(doc) });
  } catch (e) {
    console.error("recipe PUT failed", e);
    return NextResponse.json({ error: "Couldn't save. Try again." }, { status: 503 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return denied();
  const { id } = await ctx.params;
  try {
    const { recipes, recipephotos } = await cols();
    const r = await recipes.deleteOne({ _id: id });
    await recipephotos.deleteOne({ _id: id });
    return r.deletedCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  } catch (e) {
    console.error("recipe DELETE failed", e);
    return NextResponse.json({ error: "Couldn't delete. Try again." }, { status: 503 });
  }
}
