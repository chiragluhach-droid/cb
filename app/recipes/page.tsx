import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChefHat } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RecipeCard } from "@/components/RecipeCard";
import { publicRecipes } from "@/lib/server/recipe-pages";
import { coach } from "@/lib/site";

/** /recipes — every public recipe from the coach. Good as an Instagram bio link. */

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Healthy recipes",
  description: `Healthy, high-protein recipes from ${coach.name}, your Evowell nutrition coach, with calories and portions in grams.`,
  alternates: { canonical: "/recipes" },
  openGraph: { title: `Healthy recipes from ${coach.name} · Evowell`, url: "/recipes" },
};

export default async function RecipesIndex() {
  const recipes = await publicRecipes();
  return (
    <>
      <Navbar />
      <main className="bg-canvas pb-20 pt-28 lg:pb-28 lg:pt-36">
        <div className="container-x">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2.5 text-sm font-semibold text-ink/70">
              <span className="relative h-8 w-8 overflow-hidden rounded-full bg-mint ring-2 ring-white">
                <Image src={coach.photo} alt="" fill sizes="32px" className="object-cover" />
              </span>
              From {coach.name}&apos;s kitchen
            </p>
            <h1 className="mt-4 text-balance font-sans text-[2.75rem] font-medium leading-[0.95] tracking-[-0.055em] text-ink sm:text-7xl">
              Recipes that keep you <span className="font-serif italic text-brand">on track.</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-ink/70">Simple, filling meals with calories, protein and portions in grams. Cook them tonight, free.</p>
          </div>

          {recipes.length ? (
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-5">
              {recipes.map((r) => (
                <RecipeCard key={r._id} recipe={r} />
              ))}
            </div>
          ) : (
            <div className="mt-12 flex flex-col items-center rounded-[2rem] bg-white px-6 py-16 text-center ring-1 ring-ink/[0.06]">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mint text-brand-deep">
                <ChefHat size={28} />
              </span>
              <p className="mt-5 text-xl font-semibold tracking-[-0.03em] text-ink">New recipes are on the way</p>
              <p className="mt-2 max-w-sm text-sm text-stone">{coach.name} is adding her favourites. Check back soon.</p>
            </div>
          )}

          <section className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-forest px-6 py-10 text-canvas sm:px-10 lg:mt-24 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-balance text-[1.75rem] font-medium leading-[1.05] tracking-[-0.045em] sm:text-4xl">
                Want a full plan, <span className="font-serif italic text-sprout">not just recipes?</span>
              </h2>
              <p className="mt-3 max-w-xl text-canvas/70">Answer a few questions and {coach.name} builds your personal diet and workout plan around the food you love.</p>
            </div>
            <Link href="/onboarding" className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep">
              Get your plan <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
