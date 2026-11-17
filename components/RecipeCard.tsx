import Image from "next/image";
import Link from "next/link";
import { ChefHat, Clock, Flame } from "lucide-react";
import { recipeCategories } from "@/lib/recipes-core";
import type { RecipeDoc } from "@/lib/server/mongo";

/** Pieces shared by the public recipe pages (server components). */

export const photoSrc = (r: Pick<RecipeDoc, "_id" | "photoV">) => (r.photoV ? `/api/recipe-photos/${r._id}?v=${r.photoV}` : null);

export const dietTag = (r: Pick<RecipeDoc, "vegan" | "jain" | "type">) =>
  r.vegan ? "Vegan" : r.type === "nonveg" ? "Non-veg" : r.type === "egg" ? "Contains egg" : r.jain ? "Jain · Vegetarian" : "Vegetarian";

export function RecipeCard({ recipe: r }: { recipe: RecipeDoc }) {
  const img = photoSrc(r);
  return (
    <Link
      href={`/recipes/${r.slug}`}
      className="group block overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-ink/[0.06] transition-shadow hover:shadow-[0_24px_48px_-30px_rgba(14,26,19,0.5)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-mint">
        {img ? (
          <Image src={img} alt={r.name} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" unoptimized className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-brand/50">
            <ChefHat size={40} />
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.6875rem] font-bold text-ink backdrop-blur">
          {recipeCategories.find((c) => c.v === r.category)?.l ?? "Recipe"}
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <p className="line-clamp-2 text-lg font-semibold leading-snug tracking-[-0.025em] text-ink">{r.name}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone">
          <span className="inline-flex items-center gap-1">
            <Flame size={12} /> {r.kcal} kcal · {r.protein}g protein
          </span>
          {r.prepMins > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {r.prepMins} min
            </span>
          )}
          <span className="font-medium text-brand-deep">{dietTag(r)}</span>
        </p>
      </div>
    </Link>
  );
}
