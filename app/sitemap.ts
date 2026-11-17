import type { MetadataRoute } from "next";
import { publicRecipes } from "@/lib/server/recipe-pages";
import { SITE_URL } from "@/lib/site";

/** /sitemap.xml — the public pages, including every public recipe. */

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/recipes", "/contact", "/terms", "/privacy", "/refunds", "/shipping"].map((p) => ({ url: `${SITE_URL}${p}` }));
  let recipes: MetadataRoute.Sitemap = [];
  try {
    recipes = (await publicRecipes()).map((r) => ({ url: `${SITE_URL}/recipes/${r.slug}`, lastModified: new Date(r.updatedAt) }));
  } catch {
    // database unreachable: list the fixed pages only
  }
  return [...pages, ...recipes];
}
