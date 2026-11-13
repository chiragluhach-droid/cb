"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LayoutGroup, motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import { photos, unsplash } from "@/lib/site";

type DietFilter = "all" | "veg" | "jain" | "egg" | "nonveg" | "vegan";

const filters: { v: DietFilter; l: string }[] = [
  { v: "all", l: "Everything" },
  { v: "veg", l: "Veg" },
  { v: "jain", l: "Jain" },
  { v: "egg", l: "Egg" },
  { v: "nonveg", l: "Non-veg" },
  { v: "vegan", l: "Vegan" },
];

const ALL: DietFilter[] = ["veg", "egg", "nonveg"];

// `desktopOnly` cards are hidden on phones to keep the grid short.
const foods: { name: string; note: string; img: string; fits: DietFilter[]; desktopOnly?: boolean }[] = [
  { name: "Idli + sambar", note: "300 kcal · 11g protein", img: photos.idliCoffee, fits: [...ALL, "vegan"] },
  { name: "Roti, sabzi & dal", note: "520 kcal · 20g protein", img: photos.rotiSabzi, fits: [...ALL, "vegan"] },
  { name: "Moong dal khichdi", note: "470 kcal · 19g protein", img: photos.khichdi, fits: [...ALL, "jain"] },
  { name: "Palak paneer", note: "540 kcal · 26g protein", img: photos.palakPaneer, fits: ALL },
  { name: "Masala dosa", note: "Sunday dosa, still on track", img: photos.masalaDosa, fits: [...ALL, "vegan"] },
  { name: "Home thali", note: "560 kcal · 21g protein", img: photos.thali, fits: ALL, desktopOnly: true },
  { name: "Paneer tikka", note: "270 kcal · 18g protein", img: photos.paneerTikka, fits: ALL, desktopOnly: true },
  { name: "Chicken curry", note: "560 kcal · 38g protein", img: photos.chickenCurry, fits: ["nonveg"], desktopOnly: true },
  { name: "Pantry staples", note: "Dals, millets, spices", img: photos.spices, fits: [...ALL, "jain", "vegan"], desktopOnly: true },
];

export default function Kitchen() {
  const [f, setF] = useState<DietFilter>("all");
  // Phones show fewer cards, so the "x of y fit" count follows what's visible.
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const shown = phone ? foods.filter((x) => !x.desktopOnly) : foods;
  const fitCount = shown.filter((x) => f === "all" || x.fits.includes(f)).length;

  return (
    <section id="food" className="relative bg-canvas py-20 lg:py-32">
      <div className="container-x">
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-12">
          <div>
            <Reveal>
              <span className="eyebrow">03 — The food</span>
            </Reveal>
            <AnimatedHeading
              text="Built from / your kitchen."
              className="mt-5 font-sans text-[11vw] font-normal leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-8xl"
            />
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-pretty text-base leading-relaxed text-stone">
              Dal, roti, sabzi, paneer, idli — the food you already cook. No imported superfoods, and no separate meals for you and the family.
            </p>
          </Reveal>
        </div>

        <Reveal className="mb-6 flex flex-wrap items-center gap-2">
          <LayoutGroup id="kitchen">
            {filters.map((o) => {
              const on = f === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setF(o.v)}
                  aria-pressed={on}
                  className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${on ? "text-white" : "bg-ink/[0.05] text-ink/70 hover:bg-ink/10"}`}
                >
                  {on && <motion.span layoutId="kitchen-pill" className="absolute inset-0 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{o.l}</span>
                </button>
              );
            })}
          </LayoutGroup>
          <span className="ml-auto text-sm tabular-nums text-stone">
            <b className="text-ink">{fitCount}</b> of {shown.length} fit
          </span>
        </Reveal>

        <div className="grid auto-rows-[11rem] grid-cols-2 gap-2 sm:auto-rows-[14rem] sm:gap-3 lg:auto-rows-[15rem] lg:grid-cols-4">
          {foods.map((x, i) => {
            const fit = f === "all" || x.fits.includes(f);
            return (
              <motion.figure
                key={x.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ duration: 0.7, delay: (i % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative isolate overflow-hidden rounded-[1.5rem] ${i === 0 ? "col-span-2 row-span-2" : ""} ${x.desktopOnly ? "hidden sm:block" : ""}`}
              >
                <Image
                  src={unsplash(x.img, 900)}
                  alt={x.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className={`-z-10 object-cover transition-all duration-700 ease-expo group-hover:scale-105 ${fit ? "" : "scale-105 grayscale"}`}
                />
                <div className={`absolute inset-0 -z-10 transition-colors duration-500 ${fit ? "bg-gradient-to-t from-black/70 via-black/10 to-transparent" : "bg-canvas/70"}`} />
                <figcaption className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
                  <p className={`font-sans text-base font-semibold tracking-[-0.03em] transition-colors duration-500 sm:text-xl ${fit ? "text-white" : "text-ink/40"}`}>{x.name}</p>
                  <p className={`text-xs transition-colors duration-500 sm:text-sm ${fit ? "text-white/75" : "text-ink/30"}`}>{x.note}</p>
                </figcaption>
                <motion.span
                  initial={false}
                  animate={{ scale: fit && f !== "all" ? 1 : 0, rotate: fit && f !== "all" ? -8 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 16 }}
                  className="absolute right-3 top-3 rounded-full bg-sprout px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-forest"
                >
                  Fits
                </motion.span>
              </motion.figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
