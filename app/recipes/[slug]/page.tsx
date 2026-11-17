import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ChefHat, Clock, Flame, Utensils } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RecipeCard, dietTag, photoSrc } from "@/components/RecipeCard";
import { amounts } from "@/lib/engine";
import { allergenOptions, recipeCategories } from "@/lib/recipes-core";
import { publicRecipes, recipeBySlug } from "@/lib/server/recipe-pages";
import { recipeDish } from "@/lib/server/repo";
import { SITE_URL, coach } from "@/lib/site";

/*
 * /recipes/<slug> — one of the coach's recipes, open to anyone (no login).
 * Made for sharing: Instagram DMs and link previews show the photo and name.
 */

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const found = await recipeBySlug(decodeURIComponent(slug).toLowerCase());
  if (!found) notFound();
  if ("moved" in found) permanentRedirect(`/recipes/${found.moved}`);
  return found.recipe;
}

const summary = (r: { kcal: number; protein: number; prepMins: number; notes: string }) =>
  `${r.kcal} kcal · ${r.protein}g protein${r.prepMins ? ` · ${r.prepMins} min` : ""}. ${r.notes ? r.notes.slice(0, 120) : `A healthy recipe from ${coach.name}, your Evowell nutrition coach.`}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await load((await params).slug);
  const img = photoSrc(r);
  const description = summary(r);
  return {
    title: r.name,
    description,
    alternates: { canonical: `/recipes/${r.slug}` },
    openGraph: {
      type: "article",
      title: `${r.name} · Evowell recipe`,
      description,
      url: `/recipes/${r.slug}`,
      ...(img ? { images: [{ url: img, alt: r.name }] } : {}),
    },
    twitter: { card: img ? "summary_large_image" : "summary", title: r.name, description },
  };
}

export default async function RecipePage({ params }: Props) {
  const r = await load((await params).slug);
  const dish = recipeDish(r);
  const img = photoSrc(r);
  const ingredients = amounts(dish);
  const category = recipeCategories.find((c) => c.v === r.category)?.l ?? "Recipe";
  const more = (await publicRecipes()).filter((x) => x._id !== r._id).slice(0, 3);

  // Recipe details for Google (rich results).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: r.name,
    ...(img ? { image: [`${SITE_URL}${img}`] } : {}),
    author: { "@type": "Person", name: coach.name },
    publisher: { "@type": "Organization", name: "Evowell" },
    description: summary(r),
    recipeCategory: category,
    recipeYield: r.serving,
    ...(r.prepMins ? { totalTime: `PT${r.prepMins}M` } : {}),
    recipeIngredient: ingredients,
    recipeInstructions: r.steps.map((text) => ({ "@type": "HowToStep", text })),
    nutrition: { "@type": "NutritionInformation", calories: `${r.kcal} kcal`, proteinContent: `${r.protein} g`, servingSize: r.serving },
    ...(r.vegan ? { suitableForDiet: "https://schema.org/VeganDiet" } : r.type === "veg" ? { suitableForDiet: "https://schema.org/VegetarianDiet" } : {}),
  };

  return (
    <>
      <Navbar />
      <main className="bg-canvas pb-20 pt-24 lg:pb-28 lg:pt-32">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <div className="container-x">
          <Link href="/recipes" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition-colors hover:text-ink">
            <ArrowLeft size={15} /> All recipes
          </Link>

          <article className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
            {/* Photo */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-mint lg:aspect-[4/5]">
                {img ? (
                  <Image src={img} alt={r.name} fill priority sizes="(min-width: 1024px) 45vw, 100vw" unoptimized className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-brand/50">
                    <ChefHat size={64} />
                  </span>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink backdrop-blur">{category}</span>
              </div>
            </div>

            {/* Recipe */}
            <div>
              <p className="flex items-center gap-2.5 text-sm font-semibold text-ink/70">
                <span className="relative h-8 w-8 overflow-hidden rounded-full bg-mint ring-2 ring-white">
                  <Image src={coach.photo} alt="" fill sizes="32px" className="object-cover" />
                </span>
                A recipe by {coach.name}
              </p>
              <h1 className="mt-4 text-balance font-sans text-[2.5rem] font-medium leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl">{r.name}</h1>

              <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-ink ring-1 ring-ink/[0.08]">
                  <Flame size={15} className="text-brand" /> {r.kcal} kcal
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-ink ring-1 ring-ink/[0.08]">{r.protein}g protein</span>
                {r.prepMins > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-ink ring-1 ring-ink/[0.08]">
                    <Clock size={15} className="text-brand" /> {r.prepMins} min
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-ink ring-1 ring-ink/[0.08]">
                  <Utensils size={15} className="text-brand" /> {r.serving}
                </span>
                <span className="rounded-full bg-mint px-3.5 py-2 text-brand-deep">{dietTag(r)}</span>
                {r.allergens.map((a) => (
                  <span key={a} className="rounded-full bg-warn/15 px-3.5 py-2 text-[#7A4F00]">
                    Contains {allergenOptions.find((o) => o.v === a)?.l.toLowerCase() ?? a}
                  </span>
                ))}
              </div>

              {r.notes && (
                <div className="mt-8 rounded-[1.5rem] bg-forest px-5 py-4 text-canvas">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-sprout">{coach.name}&apos;s tip</p>
                  <p className="mt-1.5 text-pretty text-[0.9375rem] leading-relaxed text-canvas/85">{r.notes}</p>
                </div>
              )}

              <section className="mt-10">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-ink/45">Ingredients · 1 serving</h2>
                <ul className="mt-4 divide-y divide-ink/[0.06] rounded-[1.5rem] bg-white px-5 ring-1 ring-ink/[0.06]">
                  {ingredients.map((x, i) => (
                    <li key={i} className="flex items-center gap-3 py-3.5 text-[0.9375rem] text-ink">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      {x}
                    </li>
                  ))}
                </ul>
              </section>

              {r.steps.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-ink/45">Method</h2>
                  <ol className="mt-4 space-y-4">
                    {r.steps.map((x, i) => (
                      <li key={i} className="flex gap-4 text-[0.9375rem] leading-relaxed text-ink">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-canvas">{i + 1}</span>
                        <span className="pt-0.5">{x}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </article>

          {/* Call to action */}
          <section className="relative isolate mt-16 overflow-hidden rounded-[2rem] bg-forest px-6 py-10 text-canvas sm:px-10 sm:py-12 lg:mt-24">
            <div aria-hidden className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-brand/30 blur-3xl" />
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-sprout">Evowell nutrition coaching</p>
            <h2 className="mt-3 max-w-2xl text-balance text-[2rem] font-medium leading-[1.02] tracking-[-0.05em] sm:text-5xl">
              Like this? Get a whole week of food <span className="font-serif italic text-sprout">made for you.</span>
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-canvas/70">
              {coach.name} builds your personal diet plan around the food you enjoy, with portions in grams, meal times that fit your day, and recipes like this one.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/onboarding" className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep">
                Get your plan <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/recipes" className="inline-flex items-center gap-2 rounded-full bg-canvas/10 px-6 py-3.5 text-sm font-semibold text-canvas ring-1 ring-canvas/15 transition-colors hover:bg-canvas/15">
                More recipes
              </Link>
            </div>
          </section>

          {more.length > 0 && (
            <section className="mt-16 lg:mt-20">
              <h2 className="text-2xl font-medium tracking-[-0.04em] text-ink sm:text-3xl">
                More from {coach.name}&apos;s <span className="font-serif italic text-brand">kitchen</span>
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {more.map((x) => (
                  <RecipeCard key={x._id} recipe={x} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
