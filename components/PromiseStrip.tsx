"use client";

import { Fragment, useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { RingMark } from "@/components/brand/Marks";

const phrases = ["Coach-reviewed", "Ghar ka khana", "No crash diets", "Plans that adapt", "Veg to vegan"];

/** Keep v inside [min, max) so the track loops seamlessly. */
const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

/**
 * A big typographic marquee that reacts to scrolling: it drifts on its own,
 * speeds up while you scroll, and flips direction when you scroll back up.
 * The ring marks between phrases spin with it.
 */
export default function PromiseStrip({ baseSpeed = 2.2 }: { baseSpeed?: number }) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const boost = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const dir = useRef(-1);

  // Two identical halves; sliding by 50% loops without a seam.
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const spin = useTransform(baseX, (v) => v * 40);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < 0) dir.current = 1;
    else if (b > 0) dir.current = -1;
    let move = dir.current * baseSpeed * (delta / 1000);
    move += move * Math.abs(b);
    baseX.set(baseX.get() + move);
  });

  const half = (
    <div className="flex shrink-0 items-center">
      {[...phrases, ...phrases].map((p, i) => (
        <Fragment key={i}>
          <span
            className={`whitespace-nowrap px-[0.28em] leading-none ${
              i % 2 ? "font-serif font-normal italic tracking-[-0.02em] text-brand" : "font-sans font-medium tracking-[-0.06em] text-ink"
            }`}
          >
            {p}
          </span>
          <motion.span className="inline-flex h-[0.62em] w-[0.62em] shrink-0" style={{ rotate: spin }}>
            <RingMark className="h-full w-full" ink="#16A34A" leaf="#8AF0A0" track="#E6F4EA" vein="#0E1A13" />
          </motion.span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <section aria-label="Our promises" className="relative overflow-hidden border-y border-ink/10 bg-canvas py-8 sm:py-12">
      <p className="sr-only">{phrases.join(", ")}</p>
      <motion.div aria-hidden className="flex w-max text-[13vw] sm:text-[9vw] lg:text-[6.75rem]" style={{ x }}>
        {half}
        {half}
      </motion.div>
    </section>
  );
}
