/*
 * Public recipe pages (/recipes and /recipes/<slug>) — SERVER ONLY.
 * Every recipe the coach writes gets a page unless she switches "Public page" off.
 * Edits to built-in library dishes never get one.
 */

import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/recipes-core";
import { RecipeDoc, cols } from "@/lib/server/mongo";

const own = { _id: { $regex: /^rcp_/ } };
const isPublic = { ...own, public: { $ne: false } };

/** A free address for this recipe's name (another recipe's current or old address is never reused). */
export async function uniqueSlug(name: string, id: string) {
  const { recipes } = await cols();
  const base = slugify(name);
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (!(await recipes.findOne({ $or: [{ slug }, { oldSlugs: slug }], _id: { $ne: id } }, { projection: { _id: 1 } }))) return slug;
  }
}

/** The address for a recipe that's been saved: new recipes get one, a renamed one moves and keeps the old. */
export async function slugFields(name: string, cur: Pick<RecipeDoc, "_id" | "name" | "slug" | "oldSlugs"> | null, id: string) {
  if (cur?.slug && cur.name === name) return { slug: cur.slug, oldSlugs: cur.oldSlugs ?? [] };
  const slug = cur?.slug && slugify(name) === slugify(cur.name) ? cur.slug : await uniqueSlug(name, id);
  const oldSlugs = [...(cur?.oldSlugs ?? []), ...(cur?.slug ? [cur.slug] : [])].filter((s, i, a) => s !== slug && a.indexOf(s) === i);
  return { slug, oldSlugs };
}

/** Give addresses to recipes made before pages existed. */
export async function ensureSlugs() {
  const { recipes } = await cols();
  const missing = await recipes.find({ ...own, slug: { $exists: false } }, { projection: { _id: 1, name: 1 } }).toArray();
  for (const r of missing) await recipes.updateOne({ _id: r._id }, { $set: { slug: await uniqueSlug(r.name, r._id) } });
}

export async function publicRecipes(): Promise<RecipeDoc[]> {
  await ensureSlugs();
  const { recipes } = await cols();
  return recipes.find(isPublic).sort({ createdAt: -1 }).toArray();
}

/** The recipe at this address, or where it moved to after a rename. */
export async function recipeBySlug(slug: string): Promise<{ recipe: RecipeDoc } | { moved: string } | null> {
  const { recipes } = await cols();
  const recipe = await recipes.findOne({ ...isPublic, slug });
  if (recipe) return { recipe };
  const old = await recipes.findOne({ ...isPublic, oldSlugs: slug }, { projection: { slug: 1 } });
  return old?.slug ? { moved: old.slug } : null;
}

/** Call after the coach changes recipes, so the public pages update straight away. */
export function refreshRecipePages() {
  try {
    revalidatePath("/recipes");
    revalidatePath("/recipes/[slug]", "page");
  } catch {
    // outside a request (tests): pages refresh on their own within a minute
  }
}
