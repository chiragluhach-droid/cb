"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, Clock, Flame, Search } from "lucide-react";
import { Card, Segmented } from "@/components/app/ui";
import { RecipePhoto, RecipeSheet, categoryLabel } from "@/components/app/RecipeSheet";
import { dishes, dietOk, type Dish, type RecipeCategory } from "@/lib/engine";
import { useSession } from "@/lib/demo-store";
import { recipeCategories } from "@/lib/recipes-core";
import { coach } from "@/lib/site";

type Filter = "all" | "mine" | RecipeCategory;

/** The coach's recipes this client can see: shared ones, plus any in their own plan. */
export default function RecipesPage() {
  const { data } = useSession();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Dish | null>(null);

  // `dishes` holds the recipes the server sent with this client's data.
  const all = dishes.filter((d) => d.custom && d.recipe);
  const diet = data?.published?.profile.diet ?? data?.profile?.diet;
  const inPlan = useMemo(() => new Set(Object.values(data?.published?.edits ?? {})), [data?.published?.edits]);
  const fits = (d: Dish) => !diet || dietOk(d, diet);

  const shown = all
    .filter((d) => (filter === "all" ? true : filter === "mine" ? inPlan.has(d.id) : d.recipe!.category === filter))
    .filter((d) => !q.trim() || d.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => Number(inPlan.has(b.id)) - Number(inPlan.has(a.id)) || Number(fits(b)) - Number(fits(a)));
  const cats = recipeCategories.filter((c) => all.some((d) => d.recipe!.category === c.v));

  return (
    <div>
      <p className="text-sm font-medium text-stone">From {coach.name}&apos;s kitchen</p>
      <h1 className="mt-1 text-[2.25rem] font-medium leading-[1] tracking-[-0.055em] text-ink sm:text-5xl">
        <span className="font-serif italic text-brand">Recipes.</span>
      </h1>

      {all.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mint text-brand-deep">
            <ChefHat size={28} />
          </span>
          <p className="mt-5 text-xl font-semibold tracking-[-0.03em] text-ink">Recipes are on the way</p>
          <p className="mt-2 max-w-sm text-sm text-stone">{coach.name} is adding her favourite recipes. They&apos;ll appear here, ready to cook.</p>
        </Card>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="w-max">
                <Segmented<Filter>
                  id="client-recipes"
                  size="sm"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { v: "all", l: "All" },
                    ...(inPlan.size && all.some((d) => inPlan.has(d.id)) ? [{ v: "mine" as Filter, l: "In my plan" }] : []),
                    ...cats.map((c) => ({ v: c.v as Filter, l: c.l })),
                  ]}
                />
              </div>
            </div>
            <label className="relative block sm:w-60">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="w-full rounded-full bg-white py-2.5 pl-9 pr-4 text-sm outline-none ring-1 ring-ink/[0.08] focus:ring-brand"
              />
            </label>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {shown.map((d, i) => (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 9) * 0.03 }}
                onClick={() => setOpen(d)}
                className="group overflow-hidden rounded-[1.5rem] bg-white text-left ring-1 ring-ink/[0.06] transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(14,26,19,0.5)]"
              >
                <div className="relative">
                  <RecipePhoto dish={d} className="aspect-[4/3] w-full" />
                  {inPlan.has(d.id) && <span className="absolute left-2.5 top-2.5 rounded-full bg-brand px-2.5 py-1 text-[0.625rem] font-bold text-white">In your plan</span>}
                  {!fits(d) && <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[0.625rem] font-bold text-ink/60">Not your diet</span>}
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-brand-deep">{categoryLabel(d)}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug tracking-[-0.01em] text-ink sm:text-base">{d.name}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.6875rem] text-stone">
                    <span className="inline-flex items-center gap-1">
                      <Flame size={11} /> {d.kcal} kcal
                    </span>
                    {d.recipe!.prepMins > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {d.recipe!.prepMins} min
                      </span>
                    )}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
          {shown.length === 0 && <p className="mt-10 text-center text-sm text-stone">No recipes match.</p>}
        </>
      )}

      <RecipeSheet dish={open} onClose={() => setOpen(null)} />
    </div>
  );
}
