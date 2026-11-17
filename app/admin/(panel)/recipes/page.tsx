"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, ChefHat, Clock, ExternalLink, Eye, Flame, Globe, ImageOff, Link2, Loader2, Plus, Search, Share2, Sparkles, Trash2, X } from "lucide-react";
import { Chips, Segmented } from "@/components/app/ui";
import { Empty, PageTitle } from "@/components/admin/bits";
import { RecipePhoto, RecipeSheet, shrinkPhoto } from "@/components/app/RecipeSheet";
import { amounts, baseDishIds, originalDish, type Dish, type Item, type RecipeCategory } from "@/lib/engine";
import { refreshClients } from "@/lib/admin";
import { RecipeInput, allergenOptions, categorySlots, emptyRecipe, recipeCategories, slotOptions, unitOptions } from "@/lib/recipes-core";

/*
 * Coach › Recipes — Simone's own recipe book. Recipes can be shared with
 * every client (their Recipes tab), put into any client's plan from the plan
 * editor, and optionally used by the automatic draft.
 */

const input =
  "w-full rounded-xl bg-[#F4F5F1] px-3.5 py-2.5 text-sm text-ink outline-none ring-1 ring-transparent transition-shadow placeholder:text-ink/35 focus:bg-white focus:ring-brand";

/** Best-guess category for a built-in dish (they don't have one). */
const guessCategory = (d: Dish): RecipeCategory =>
  d.recipe?.category ?? (/salad/i.test(d.name) ? "salad" : /soup/i.test(d.name) ? "soup" : /smoothie|shake/i.test(d.name) ? "smoothie" : d.slots.includes("breakfast") ? "breakfast" : d.slots.includes("snack") && d.slots.length === 1 ? "snack" : "main");

const toInput = (d: Dish): RecipeInput => ({
  name: d.name,
  serving: d.serving,
  slots: d.slots,
  kcal: d.kcal,
  protein: d.protein,
  type: d.type,
  vegan: !!d.vegan,
  jain: !!d.jain,
  allergens: d.allergens,
  category: guessCategory(d),
  prepMins: d.recipe?.prepMins ?? 0,
  items: d.items ?? [],
  steps: d.recipe?.steps ?? [],
  notes: d.recipe?.notes ?? "",
  shared: d.recipe?.shared ?? false,
  auto: !!d.auto,
  public: d.recipe?.public ?? true,
});

/** The recipe's public page, e.g. https://www.evowellnutrition.com/recipes/greek-yogurt-bowl */
const pageUrl = (d: Dish) => (d.recipe?.public && d.recipe.slug ? `${typeof window === "undefined" ? "" : window.location.origin}/recipes/${d.recipe.slug}` : null);

/** Copies the public link (for Instagram DMs etc.). */
function CopyLink({ url, className, label = "Copy link" }: { url: string; className: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };
  return (
    <button type="button" onClick={copy} className={className}>
      {done ? <Check size={14} /> : <Link2 size={14} />} {done ? "Copied" : label}
    </button>
  );
}

type Filter = "all" | RecipeCategory;

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Dish[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"mine" | "library">("mine");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Dish | "new" | null>(null);
  const [preview, setPreview] = useState<Dish | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/recipes", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setRecipes(j.recipes);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't load recipes.");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // Her own recipes vs the built-in dish library (with any of her edits applied).
  const mine = useMemo(() => (recipes ?? []).filter((r) => !baseDishIds.has(r.id)), [recipes]);
  const library = useMemo(
    () =>
      [...baseDishIds].map((id) => {
        const b = originalDish(id)!;
        const o = (recipes ?? []).find((r) => r.id === id);
        return o ? { ...b, ...o, id, img: o.photo ? undefined : b.img, edited: true } : b;
      }),
    [recipes],
  );
  const list = tab === "mine" ? mine : library;
  const cat = (r: Dish) => r.recipe?.category ?? guessCategory(r);
  const shown = useMemo(
    () => list.filter((r) => (filter === "all" || cat(r) === filter) && (!q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase()))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, filter, q],
  );
  const count = (f: Filter) => list.filter((r) => f === "all" || cat(r) === f).length;

  const saved = (d: Dish | null, removedId?: string) => {
    setRecipes((list) => {
      const cur = list ?? [];
      if (removedId) return cur.filter((r) => r.id !== removedId);
      if (!d) return cur;
      return cur.some((r) => r.id === d.id) ? cur.map((r) => (r.id === d.id ? d : r)) : [d, ...cur];
    });
    setEditing(null);
    refreshClients(); // so the plan editor sees the change straight away
  };

  return (
    <div>
      <PageTitle
        eyebrow={recipes ? `${mine.length} recipe${mine.length === 1 ? "" : "s"} · ${mine.filter((r) => r.recipe?.shared).length} shared · ${library.length} library dishes` : "Your recipe book"}
        title="Recipes"
        accent="."
        action={
          <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-brand">
            <Plus size={16} /> New recipe
          </button>
        }
      />

      <div className="mt-6 w-full sm:w-auto">
        <Segmented<"mine" | "library">
          id="recipe-tab"
          value={tab}
          onChange={(v) => {
            setTab(v);
            setFilter("all");
          }}
          options={[
            { v: "mine", l: `My recipes ${mine.length}` },
            { v: "library", l: `Dish library ${library.length}` },
          ]}
        />
        {tab === "library" && (
          <p className="mt-2 text-xs text-stone">The dishes plans are built from. Edit any of them — name, amounts in grams, calories — and every plan using it updates.</p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <div className="w-max">
            <Segmented<Filter>
              id="recipe-filter"
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[{ v: "all", l: `All ${count("all")}` }, ...recipeCategories.map((c) => ({ v: c.v as Filter, l: `${c.l} ${count(c.v)}` }))]}
            />
          </div>
        </div>
        <label className="relative block lg:w-64">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes" className={`${input} pl-9`} />
        </label>
      </div>

      {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {!recipes && !error && (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-brand" />
        </div>
      )}
      {recipes && shown.length === 0 && (
        <div className="mt-6">
          <Empty>
            {list.length ? "Nothing matches." : "No recipes yet. Add your first one — salads, smoothies, full meals, anything you'd like clients to cook."}
          </Empty>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.04 }}
            className="group overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-ink/[0.06]"
          >
            <button onClick={() => setEditing(r)} className="block w-full text-left">
              <div className="relative">
                <RecipePhoto dish={r} className="h-44 w-full" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.6875rem] font-bold text-ink backdrop-blur">
                  {recipeCategories.find((c) => c.v === cat(r))?.l}
                  {r.cuisine === "indian" && " · Indian"}
                </span>
                <span className="absolute right-3 top-3 flex gap-1.5">
                  {r.edited && <span className="rounded-full bg-warn px-2 py-1 text-[0.625rem] font-bold text-forest">Edited</span>}
                  {tab === "mine" && r.recipe?.public && (
                    <span title="Has a public page" className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-deep">
                      <Globe size={13} />
                    </span>
                  )}
                  {tab === "mine" && r.recipe?.shared && (
                    <span title="Shared with all clients" className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
                      <Share2 size={13} />
                    </span>
                  )}
                  {tab === "mine" && r.auto && (
                    <span title="Used in automatic drafts" className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-sprout">
                      <Sparkles size={13} />
                    </span>
                  )}
                </span>
              </div>
              <div className="p-4">
                <p className="truncate text-base font-semibold tracking-[-0.02em] text-ink">{r.name}</p>
                <p className="mt-1 flex items-center gap-3 text-xs text-stone">
                  <span className="inline-flex items-center gap-1">
                    <Flame size={12} /> {r.kcal} kcal · {r.protein}g P
                  </span>
                  {!!r.recipe?.prepMins && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> {r.recipe.prepMins} min
                    </span>
                  )}
                </p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-ink/55">{amounts(r).join(" · ")}</p>
              </div>
            </button>
            <div className="flex border-t border-ink/[0.06] text-xs font-semibold">
              <button onClick={() => setPreview(r)} className="flex flex-1 items-center justify-center gap-1.5 py-3 text-ink/60 transition-colors hover:bg-[#F7F8F5] hover:text-ink">
                <Eye size={14} /> Client view
              </button>
              {tab === "mine" && pageUrl(r) && (
                <CopyLink url={pageUrl(r)!} className="flex flex-1 items-center justify-center gap-1.5 border-l border-ink/[0.06] py-3 text-brand-deep transition-colors hover:bg-mint" />
              )}
              <button onClick={() => setEditing(r)} className="flex flex-1 items-center justify-center gap-1.5 border-l border-ink/[0.06] py-3 text-ink/60 transition-colors hover:bg-[#F7F8F5] hover:text-ink">
                Edit
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-stone">
        <b className="text-ink">How recipes reach clients:</b> shared recipes appear in every client&apos;s Recipes tab. Any recipe can also go into a client&apos;s plan — open the client,
        click a meal in their week and pick it under &ldquo;Your recipes&rdquo;. Clients can open the full recipe from that meal.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-stone">
        <b className="text-ink">Public pages:</b> each of your recipes also has its own page anyone can open, with no login. Tap &ldquo;Copy link&rdquo; to paste it into
        Instagram DMs or your bio. All your public recipes are listed at{" "}
        <a href="/recipes" target="_blank" rel="noreferrer" className="font-semibold text-brand-deep underline underline-offset-2">
          /recipes
        </a>
        .
      </p>

      <AnimatePresence>{editing && <Editor key={editing === "new" ? "new" : editing.id} dish={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={saved} />}</AnimatePresence>
      <RecipeSheet dish={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

/* ───────────── Editor ───────────── */

function Editor({ dish, onClose, onSaved }: { dish: Dish | null; onClose: () => void; onSaved: (d: Dish | null, removedId?: string) => void }) {
  const [r, setR] = useState<RecipeInput>(() => (dish ? toInput(dish) : { ...emptyRecipe }));
  const isBase = !!dish && baseDishIds.has(dish.id);
  const [steps, setSteps] = useState(() => r.steps.join("\n"));
  const [photo, setPhoto] = useState<string | null | undefined>(undefined); // undefined = keep
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof RecipeInput>(k: K, v: RecipeInput[K]) => setR((x) => ({ ...x, [k]: v }));
  const currentPhoto = photo === undefined ? dish?.photo ?? null : photo;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [busy, onClose]);

  const pickPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      setPhoto(await shrinkPhoto(f));
    } catch {
      setError("That image couldn't be read. Try a JPG or PNG.");
    }
  };

  const save = async () => {
    setBusy("save");
    setError("");
    const body = {
      ...r,
      items: r.items.filter((it) => it.food.trim() && it.qty > 0),
      steps: steps.split("\n"),
      ...(photo !== undefined ? { photo } : {}),
    };
    try {
      const res = await fetch(dish ? `/api/admin/recipes/${dish.id}` : "/api/admin/recipes", {
        method: dish ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      onSaved(j.recipe);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't save. Try again.");
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!dish) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/recipes/${dish.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error((await res.json()).error);
      onSaved(null, dish.id);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't delete.");
      setBusy(null);
    }
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex justify-end bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={dish ? `Edit ${dish.name}` : "New recipe"}
    >
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col bg-canvas"
      >
        <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4 sm:px-6">
          <p className="text-lg font-semibold tracking-[-0.02em] text-ink">{isBase ? "Edit dish" : dish ? "Edit recipe" : "New recipe"}</p>
          <button onClick={onClose} disabled={!!busy} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.05] disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6" data-lenis-prevent>
          {/* Photo */}
          <div className="relative overflow-hidden rounded-[1.5rem] bg-mint">
            {currentPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentPhoto} alt="" className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-brand-deep/70">
                <ChefHat size={32} />
                <span className="text-sm font-semibold">Add a photo</span>
              </div>
            )}
            <div className="absolute bottom-3 right-3 flex gap-2">
              {currentPhoto && (
                <button onClick={() => setPhoto(null)} className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-ink backdrop-blur">
                  <ImageOff size={13} /> Remove
                </button>
              )}
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-canvas">
                <Camera size={13} /> {currentPhoto ? "Change" : "Upload"}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/60">Recipe name</span>
            <input value={r.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Greek chicken salad" className={input} maxLength={80} />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink/60">Type</span>
            <Chips
              options={recipeCategories}
              value={[r.category]}
              onChange={(v) => {
                const c = (v.find((x) => x !== r.category) ?? r.category) as RecipeCategory;
                setR((x) => ({ ...x, category: c, slots: categorySlots[c] }));
              }}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink/60">Suits which meals?</span>
            <Chips options={slotOptions} value={r.slots} onChange={(v) => set("slots", v)} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/60">Calories</span>
              <input type="number" inputMode="numeric" value={r.kcal} onChange={(e) => set("kcal", Number(e.target.value))} className={input} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/60">Protein (g)</span>
              <input type="number" inputMode="numeric" value={r.protein} onChange={(e) => set("protein", Number(e.target.value))} className={input} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/60">Prep (min)</span>
              <input type="number" inputMode="numeric" value={r.prepMins} onChange={(e) => set("prepMins", Number(e.target.value))} className={input} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/60">One serving</span>
              <input value={r.serving} onChange={(e) => set("serving", e.target.value)} placeholder="1 bowl" className={input} />
            </label>
          </div>
          <p className="-mt-3 text-[0.6875rem] text-stone">Calories and protein are per serving. Plans scale servings to each client automatically.</p>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink/60">Diet</span>
            <Segmented
              id="rcp-type"
              size="sm"
              options={[
                { v: "vegan", l: "Vegan" },
                { v: "veg", l: "Vegetarian" },
                { v: "egg", l: "Has egg" },
                { v: "nonveg", l: "Meat / fish" },
              ]}
              value={r.vegan ? "vegan" : r.type}
              onChange={(v) => setR((x) => ({ ...x, type: v === "vegan" ? "veg" : (v as RecipeInput["type"]), vegan: v === "vegan" }))}
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" checked={r.jain} onChange={(e) => set("jain", e.target.checked)} className="h-4 w-4 accent-[#16A34A]" />
              Jain-friendly (no onion, garlic or root veg)
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink/60">Contains</span>
            <Chips options={allergenOptions} value={r.allergens} onChange={(v) => set("allergens", v)} />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink/60">What&apos;s in one serving — with grams</span>
            <ItemsEditor items={r.items} onChange={(v) => set("items", v)} />
            <p className="mt-1.5 text-[0.6875rem] text-stone">Clients see these amounts scaled to their own portion, e.g. &ldquo;2 slices wholegrain toast (70 g)&rdquo;.</p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/60">Method — one step per line {isBase && "(optional)"}</span>
            <textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={6} placeholder={"Season and grill the chicken for 6 minutes a side.\nToss the salad with the dressing.\n…"} className={`${input} resize-y leading-relaxed`} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/60">Your tip (optional)</span>
            <textarea value={r.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="e.g. Make a double batch — it keeps for 3 days." className={`${input} resize-none`} />
          </label>

          {isBase ? (
            <p className="rounded-[1.25rem] bg-white p-4 text-xs leading-relaxed text-stone ring-1 ring-ink/[0.06]">
              This is a built-in dish. Your changes apply to every client&apos;s plan that uses it. You can reset it to the original any time.
            </p>
          ) : (
          <div className="space-y-2 rounded-[1.25rem] bg-white p-4 ring-1 ring-ink/[0.06]">
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={r.shared} onChange={(e) => set("shared", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#16A34A]" />
              <span>
                <span className="block text-sm font-semibold text-ink">Share with all clients</span>
                <span className="block text-xs text-stone">Shows in every client&apos;s Recipes tab, and clients can swap it into their meals.</span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={r.auto} onChange={(e) => set("auto", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#16A34A]" />
              <span>
                <span className="block text-sm font-semibold text-ink">Use in automatic drafts</span>
                <span className="block text-xs text-stone">The plan engine may pick it for clients whose diet fits. Off = only when you choose it.</span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={r.public} onChange={(e) => set("public", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#16A34A]" />
              <span>
                <span className="block text-sm font-semibold text-ink">Public page</span>
                <span className="block text-xs text-stone">Anyone with the link can see it, no login needed. Great for Instagram DMs. The link is ready once you save.</span>
              </span>
            </label>
            {dish && r.public && pageUrl(dish) && (
              <div className="ml-7 flex flex-wrap items-center gap-2 rounded-xl bg-mint/70 px-3 py-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-medium text-brand-deep">{pageUrl(dish)!.replace(/^https?:\/\//, "")}</span>
                <CopyLink url={pageUrl(dish)!} className="inline-flex items-center gap-1 font-semibold text-brand-deep hover:underline" />
                <a href={pageUrl(dish)!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-deep hover:underline">
                  <ExternalLink size={13} /> Open
                </a>
              </div>
            )}
          </div>
          )}

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        </div>

        <div className="flex items-center gap-2 border-t border-ink/[0.06] px-5 py-4 sm:px-6">
          {dish && (!isBase || dish.edited) &&
            (confirmDelete ? (
              <button onClick={remove} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {busy === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} {isBase ? "Reset to original?" : "Delete for good?"}
              </button>
            ) : (
              <button onClick={() => setConfirmDelete(true)} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50">
                <Trash2 size={14} /> {isBase ? "Reset" : "Delete"}
              </button>
            ))}
          <div className="flex-1" />
          <button onClick={onClose} disabled={!!busy} className="rounded-full px-5 py-3 text-sm font-semibold text-ink/60 hover:text-ink">
            Cancel
          </button>
          <button onClick={save} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-60">
            {busy === "save" && <Loader2 size={14} className="animate-spin" />} {dish ? "Save changes" : "Add recipe"}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/* ───────────── Ingredient rows ───────────── */

function ItemsEditor({ items, onChange }: { items: Item[]; onChange: (v: Item[]) => void }) {
  const setRow = (i: number, patch: Partial<Item>) =>
    onChange(
      items.map((it, j) => {
        if (j !== i) return it;
        const next = { ...it, ...patch };
        if (next.unit === "g" || next.unit === "ml") next.g = next.qty; // grams = amount
        return next;
      }),
    );
  const num = "w-full rounded-lg bg-white px-2 py-2 text-sm tabular-nums text-ink outline-none ring-1 ring-ink/10 focus:ring-brand";
  return (
    <div className="space-y-2">
      {items.map((it, i) => {
        const weighed = it.unit === "g" || it.unit === "ml";
        return (
          <div key={i} className="grid grid-cols-[4.25rem_5.5rem_minmax(0,1fr)_2rem] items-center gap-1.5 rounded-xl bg-[#F4F5F1] p-1.5 sm:grid-cols-[4.25rem_5.5rem_minmax(0,1fr)_5rem_2rem]">
            <input type="number" inputMode="decimal" min={0} step="any" value={it.qty || ""} onChange={(e) => setRow(i, { qty: Number(e.target.value) })} placeholder="2" className={num} aria-label="Amount" />
            <select value={it.unit} onChange={(e) => setRow(i, { unit: e.target.value as Item["unit"] })} className={num} aria-label="Unit">
              {unitOptions.map((u) => (
                <option key={u.v} value={u.v}>
                  {u.l}
                </option>
              ))}
            </select>
            <input value={it.food} onChange={(e) => setRow(i, { food: e.target.value })} placeholder="wholegrain toast" className={num} aria-label="Food" />
            <label className={`relative col-span-3 sm:col-span-1 ${weighed ? "opacity-40" : ""}`}>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={weighed ? it.qty || "" : it.g || ""}
                disabled={weighed}
                onChange={(e) => setRow(i, { g: Number(e.target.value) })}
                placeholder="grams"
                className={`${num} pr-6`}
                aria-label="Grams"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink/40">g</span>
            </label>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove" className="row-start-1 flex h-8 w-8 items-center justify-center rounded-full text-ink/40 hover:bg-white hover:text-red-600 sm:row-auto" style={{ gridColumn: "-2 / -1" }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onChange([...items, { food: "", qty: 1, unit: "g", g: 1 }])}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-ink ring-1 ring-ink/10 hover:ring-brand"
      >
        <Plus size={13} /> Add ingredient
      </button>
      {items.length > 0 && (
        <p className="rounded-xl bg-mint/60 px-3 py-2 text-xs text-brand-deep">
          <b>Preview:</b> {items.filter((it) => it.food.trim() && it.qty > 0).map((it) => amounts({ items: [it] } as Dish)[0]).join(" · ") || "—"}
        </p>
      )}
    </div>
  );
}
