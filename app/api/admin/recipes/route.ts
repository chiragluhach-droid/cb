import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { readRecipe } from "@/lib/recipes-core";
import { cols } from "@/lib/server/mongo";
import { readPhoto } from "@/lib/server/recipe-photo";
import { refreshRecipePages, uniqueSlug } from "@/lib/server/recipe-pages";
import { allRecipes, recipeDish } from "@/lib/server/repo";
import { isAdmin } from "@/lib/server/session";

/*
 * GET  /api/admin/recipes — the coach's whole recipe book.
 * POST /api/admin/recipes — add a recipe: { ...recipe, photo?: dataUrl }.
 */

export const runtime = "nodejs";

const denied = () => NextResponse.json({ error: "Coach sign-in required." }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return denied();
  try {
    return NextResponse.json({ recipes: await allRecipes() });
  } catch (e) {
    console.error("recipes GET failed", e);
    return NextResponse.json({ error: "Couldn't load recipes." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return denied();
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const r = readRecipe(b);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  const photo = readPhoto(b?.photo);
  if (photo === "invalid") return NextResponse.json({ error: "That photo couldn't be used. Try a JPG or PNG." }, { status: 400 });
  try {
    const { recipes, recipephotos } = await cols();
    const _id = `rcp_${randomBytes(9).toString("base64url")}`;
    const now = Date.now();
    const doc = { _id, ...r.recipe, slug: await uniqueSlug(r.recipe.name, _id), oldSlugs: [], photoV: photo ? now : null, createdAt: now, updatedAt: now };
    if (photo) await recipephotos.insertOne({ _id, ...photo });
    await recipes.insertOne(doc);
    refreshRecipePages();
    return NextResponse.json({ recipe: recipeDish(doc) });
  } catch (e) {
    console.error("recipes POST failed", e);
    return NextResponse.json({ error: "Couldn't save. Try again." }, { status: 503 });
  }
}
