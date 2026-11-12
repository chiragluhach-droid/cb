"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { nav } from "@/lib/site";
import { CHECKOUT_MODE } from "@/lib/plans";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import { Wordmark } from "@/components/Logo";
import { RingMark } from "@/components/brand/Marks";
import { Seal } from "@/components/brand/Seal";

const letterGreens = ["#16A34A", "#8AF0A0", "#0E7A37", "#4ADE80"];

// The giant wordmark: each letter jumps and turns green on hover; the ring
// (the "o") spins a full turn.
function GiantWordmark() {
  const reduce = useReducedMotion();
  const letters = ["e", "v", "o", "w", "e", "l", "l"];
  return (
    <p aria-hidden className="flex select-none items-baseline justify-center whitespace-nowrap font-sans text-[25vw] font-semibold leading-[0.8] tracking-[-0.07em] text-ink sm:text-[23vw]">
      {letters.map((l, i) =>
        l === "o" ? (
          <motion.span
            key={i}
            className="relative top-[0.14em] mx-[-0.04em] inline-block h-[0.86em] w-[0.86em] cursor-default"
            whileHover={reduce ? {} : { rotate: -360, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 90, damping: 14 }}
          >
            <RingMark className="h-full w-full" ink="#16A34A" leaf="#8AF0A0" track="transparent" vein="#0E1A13" />
          </motion.span>
        ) : (
          <motion.span
            key={i}
            className="inline-block cursor-default"
            whileHover={reduce ? {} : { y: "-0.12em", rotate: i % 2 ? 6 : -6, color: letterGreens[i % letterGreens.length] }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
          >
            {l}
          </motion.span>
        )
      )}
    </p>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const onHome = usePathname() === "/";
  const resolve = (href: string) => (href.startsWith("#") && !onHome ? `/${href}` : href);
  const linkCls = "text-[15px] font-semibold text-ink transition-opacity hover:opacity-60";
  const label = "mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-ink/45";

  return (
    <footer className="relative overflow-hidden bg-canvas pt-16 lg:pt-24">
      <div className="container-x">
        <div className="flex flex-col gap-8 pb-12 lg:flex-row lg:items-end lg:justify-between lg:pb-16">
          <div>
            <Wordmark className="text-[2.25rem]" />
            <AnimatedHeading
              text="Eat better, / without eating different."
              className="mt-6 max-w-3xl font-sans text-[10vw] font-normal leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <motion.span
              className="mr-2 inline-flex cursor-default"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Seal className="h-24 w-24 sm:h-28 sm:w-28" color="#16A34A" />
            </motion.span>
            <a
              href={resolve("#pricing")}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[15px] font-semibold text-canvas transition-colors duration-300 hover:bg-brand"
            >
              Get your plan
              <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <a
              href="#top"
              onClick={(e) => {
                if (!document.getElementById("top")) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              aria-label="Back to top"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 text-ink transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:bg-sprout"
            >
              <ArrowUp size={17} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-ink/10 py-12 lg:grid-cols-4 lg:py-14">
          <div>
            <p className={label}>Explore</p>
            <ul className="space-y-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={resolve(item.href)} className={linkCls}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={label}>Plans</p>
            <ul className="space-y-2.5">
              <li><a href="/checkout?plan=meal-30" className={linkCls}>Meal Plan</a></li>
              <li><a href="/checkout?plan=meal-workout-30" className={linkCls}>Meal + Workout</a></li>
              <li><a href="/checkout?plan=meal-workout-90" className={linkCls}>90-day programme</a></li>
            </ul>
          </div>
          <div>
            <p className={label}>Diets we plan</p>
            <p className="text-[15px] font-semibold leading-relaxed text-ink">Veg · Jain · Egg · Non-veg · Vegan</p>
            <p className="mt-2 text-sm leading-relaxed text-stone">PCOS, thyroid, diabetes & BP aware</p>
          </div>
          <div>
            <p className={label}>Status</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              {CHECKOUT_MODE === "free" ? "Early access open" : "Taking new clients"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-ink/10 py-6 text-sm text-ink/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Evowell Nutrition & Training.</p>
          <p>Not medical advice. Consult your doctor about any health condition.</p>
        </div>
      </div>

      <div className="overflow-hidden pt-2">
        <GiantWordmark />
      </div>
    </footer>
  );
}
