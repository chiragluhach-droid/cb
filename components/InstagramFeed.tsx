"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Instagram } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import { instagramHandle, photos, unsplash } from "@/lib/site";

// Post previews floating around the "coming soon" card (tablet/desktop).
// `spread` is the hover nudge outward — full class strings so Tailwind keeps them.
const tiles = [
  { img: photos.idliLeaf, label: "Recipes", pos: "left-[5%] top-[10%]", rot: -9, spread: "group-hover:-translate-x-3 group-hover:-translate-y-2" },
  { img: photos.palakPaneer, label: "Dish swaps", pos: "right-[5%] top-[12%]", rot: 7, spread: "group-hover:translate-x-3 group-hover:-translate-y-2" },
  { img: photos.run, label: "Home workouts", pos: "left-[9%] bottom-[10%]", rot: 6, spread: "group-hover:-translate-x-3 group-hover:translate-y-2" },
  { img: photos.khichdi, label: "Coach tips", pos: "right-[8%] bottom-[9%]", rot: -6, spread: "group-hover:translate-x-3 group-hover:translate-y-2" },
];
const chipTone = ["bg-sprout text-forest", "bg-canvas text-ink", "bg-brand text-white", "bg-mint text-forest"];

// Phones get a small fanned stack inside the card instead.
const fan = [
  { img: photos.idliLeaf, rot: -10, x: -46 },
  { img: photos.rotiSabzi, rot: 0, x: 0 },
  { img: photos.palakPaneer, rot: 10, x: 46 },
];

/** A link once the handle is set; a plain card until then. */
function Card({ url, children, className }: { url: string | null; children: ReactNode; className: string }) {
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <div className={className}>{children}</div>
  );
}

export default function InstagramFeed() {
  const reduce = useReducedMotion();
  const url = instagramHandle ? `https://instagram.com/${instagramHandle.replace("@", "")}` : null;


  return (
    <section className="relative bg-canvas py-16 lg:py-32">
      <div className="container-x">
        <div className="mb-8 flex items-end justify-between gap-6 lg:mb-14">
          <div>
            <Reveal>
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                The feed
              </span>
            </Reveal>
            <AnimatedHeading
              text="Real food, / on your feed."
              className="mt-4 font-sans text-[11vw] font-normal leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl"
            />
          </div>
          {url && (
            <Reveal delay={0.1} className="hidden md:block">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-canvas"
              >
                <Instagram size={16} />
                {instagramHandle}
              </a>
            </Reveal>
          )}
        </div>

        <Reveal>
          <Card url={url} className="group relative isolate flex min-h-[22rem] flex-col items-center justify-center overflow-hidden rounded-[1.75rem] bg-forest px-6 py-12 text-center text-canvas sm:min-h-[26rem] lg:min-h-[32rem]">
            {/* Soft green glow */}
            <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/25 blur-3xl transition-transform duration-700 group-hover:scale-125" />

            {/* Floating post tiles — tablet/desktop */}
            {tiles.map((t, i) => (
              <div key={t.label} aria-hidden className={`absolute hidden transition-transform duration-500 ease-expo sm:block ${t.pos} ${t.spread}`}>
                <motion.div
                  style={{ rotate: t.rot }}
                  animate={reduce ? {} : { y: [0, -10, 0] }}
                  transition={{ duration: 3 + i * 0.45, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-28 rounded-2xl bg-white p-1.5 shadow-[0_24px_40px_-18px_rgba(0,0,0,0.7)] lg:w-40"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl">
                    <Image src={unsplash(t.img, 400)} alt="" fill sizes="160px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] shadow-lg lg:text-[11px] ${chipTone[i]}`}>
                    {t.label}
                  </span>
                </motion.div>
              </div>
            ))}

            {/* Fanned stack — phones */}
            <div aria-hidden className="relative mb-6 h-28 w-48 sm:hidden">
              {fan.map((f, i) => (
                <motion.div
                  key={f.img}
                  className="absolute left-1/2 top-0 -ml-12 w-24 rounded-xl bg-white p-1 shadow-xl"
                  style={{ zIndex: i === 1 ? 2 : 1 }}
                  initial={{ opacity: 0, y: 20, rotate: 0, x: 0 }}
                  whileInView={{ opacity: 1, y: i === 1 ? -6 : 0, rotate: f.rot, x: f.x }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 + i * 0.08 }}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <Image src={unsplash(f.img, 240)} alt="" fill sizes="96px" className="object-cover" />
                  </div>
                </motion.div>
              ))}
            </div>

            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sprout via-brand to-brand-deep text-white shadow-[0_12px_30px_-10px_rgba(22,163,74,0.9)] transition-transform duration-500 ease-expo group-hover:rotate-12 group-hover:scale-110">
              <Instagram size={24} />
            </span>
            <p className="mt-6 font-sans text-5xl font-normal tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Coming <span className="font-serif italic text-sprout">soon.</span>
            </p>
            <p className="mt-3 max-w-xs text-[11px] uppercase leading-relaxed tracking-[0.28em] text-canvas/50">
              Recipes, swaps & home workouts
            </p>
            <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-sprout px-6 py-3 text-sm font-bold text-forest transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-105">
              {url ? (
                <>
                  Follow {instagramHandle}
                  <ArrowUpRight size={15} />
                </>
              ) : (
                <>
                  <Instagram size={15} />
                  Our feed is being cooked
                </>
              )}
            </span>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
