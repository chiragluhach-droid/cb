"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, Clock, Flame, Utensils, X } from "lucide-react";
import { amounts, type Dish } from "@/lib/engine";
import { allergenOptions, recipeCategories } from "@/lib/recipes-core";
import { coach, unsplash } from "@/lib/site";

const dietTag = (d: Dish) => (d.vegan ? "Vegan" : d.type === "nonveg" ? "Non-veg" : d.type === "egg" ? "Contains egg" : "Vegetarian");
export const categoryLabel = (d: Dish) => recipeCategories.find((c) => c.v === d.recipe?.category)?.l ?? "Recipe";

/** Recipe photo (or a placeholder) at any size. */
export function RecipePhoto({ dish, className = "", sizes = "400px" }: { dish: Dish; className?: string; sizes?: string }) {
  return (
    <span className={`relative block overflow-hidden bg-mint ${className}`}>
      {dish.photo ? (
        <Image src={dish.photo} alt="" fill sizes={sizes} unoptimized className="object-cover" />
      ) : dish.img ? (
        <Image src={unsplash(dish.img, 800)} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-brand/60">
          <ChefHat size={36} />
        </span>
      )}
    </span>
  );
}

/** Full recipe: photo, nutrition, ingredients and method. */
export function RecipeSheet({ dish, servings, onClose }: { dish: Dish | null; servings?: number; onClose: () => void }) {
  useEffect(() => {
    if (!dish) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [dish, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {dish && (dish.recipe || dish.items?.length) && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={dish.name}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92svh] w-full max-w-xl flex-col overflow-hidden rounded-t-[2rem] bg-canvas sm:rounded-[2rem]"
          >
            <div className="relative">
              <RecipePhoto dish={dish} className="h-52 w-full sm:h-64" sizes="600px" />
              <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink backdrop-blur">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-8 pt-5 sm:px-7" data-lenis-prevent>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-brand-deep">
                {dish.recipe ? `${categoryLabel(dish)} · by ${coach.name}` : "From your plan"}
              </p>
              <h2 className="mt-1 text-[1.75rem] font-semibold leading-tight tracking-[-0.04em] text-ink">{dish.name}</h2>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-ink ring-1 ring-ink/[0.08]">
                  <Flame size={13} className="text-brand" /> {dish.kcal} kcal · {dish.protein}g protein
                </span>
                {!!dish.recipe?.prepMins && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-ink ring-1 ring-ink/[0.08]">
                    <Clock size={13} className="text-brand" /> {dish.recipe!.prepMins} min
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-ink ring-1 ring-ink/[0.08]">
                  <Utensils size={13} className="text-brand" /> {dish.serving}
                </span>
                <span className="rounded-full bg-mint px-3 py-1.5 text-brand-deep">{dietTag(dish)}</span>
                {dish.allergens.map((a) => (
                  <span key={a} className="rounded-full bg-warn/15 px-3 py-1.5 text-[#7A4F00]">
                    Contains {allergenOptions.find((o) => o.v === a)?.l.toLowerCase() ?? a}
                  </span>
                ))}
              </div>
              {(dish.items?.length ?? 0) > 0 && (
                <section className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-ink/45">{servings && servings !== 1 ? "For your portion" : "Ingredients · 1 serving"}</h3>
                  <ul className="mt-3 space-y-2">
                    {amounts(dish, servings ?? 1).map((x, i) => (
                      <li key={i} className="flex gap-3 text-[0.9375rem] text-ink">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {(dish.recipe?.steps.length ?? 0) > 0 && (
                <section className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-ink/45">Method</h3>
                  <ol className="mt-3 space-y-3">
                    {dish.recipe!.steps.map((x, i) => (
                      <li key={i} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-canvas">{i + 1}</span>
                        {x}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              {dish.recipe?.notes && (
                <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm leading-relaxed text-ink/75 ring-1 ring-ink/[0.06]">
                  <b className="text-ink">{coach.name}&apos;s tip:</b> {dish.recipe.notes}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Shrink a photo to ~1000px wide JPEG before upload. */
export function shrinkPhoto(file: File, max = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const w = Math.min(max, img.width);
      const h = Math.round((img.height / img.width) * w);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image"));
    };
    img.src = url;
  });
}
