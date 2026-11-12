"use client";

import { CSSProperties, useEffect, useRef } from "react";
import Image from "next/image";
import { animate, motion, MotionValue, useInView, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ClipboardList, MessageCircle, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import { photos, unsplash } from "@/lib/site";

const steps = [
  {
    no: "01",
    title: "Tell us about you",
    body: "A short questionnaire: body measurements, your goal, what you eat (veg, Jain, egg, non-veg or vegan), health conditions, allergies and how active you are.",
    tags: ["About 3 minutes", "Lose fat · Tone up · Build muscle"],
    icon: ClipboardList,
    img: photos.phoneSofa,
    alt: "Woman filling in the questionnaire on her phone",
  },
  {
    no: "02",
    title: "Your first draft is built",
    body: "Calorie and protein targets are worked out from your answers, and every meal is filled with Indian dishes that fit — skipping allergens and foods that clash with your conditions.",
    tags: ["Calories & protein", "Allergen-safe", "Condition-aware"],
    icon: Sparkles,
    img: photos.mealPrep,
    alt: "Meal-prep boxes with dal, chana and vegetables",
  },
  {
    no: "03",
    title: "Your coach reviews it",
    body: "A real coach goes through the draft with a checklist and warnings for risky foods, edits what needs editing, then approves it and sends it to you.",
    tags: ["Checklist", "Risk warnings", "Approved by hand"],
    icon: ShieldCheck,
    img: photos.videoCall,
    alt: "Coach on a video call reviewing a plan",
  },
  {
    no: "04",
    title: "Follow it day to day",
    body: "Tick off meals, log water, steps and weight, add progress photos, do your workouts if your plan has them, and message your coach whenever you need to.",
    tags: ["Meals", "Water & steps", "Photos", "Coach chat"],
    icon: MessageCircle,
    img: photos.thali,
    alt: "A home thali with dal, sabzi and roti",
  },
  {
    no: "05",
    title: "It changes as you do",
    body: "Progress or a plateau, your plan gets updated to match — and your coach approves every update before you see it.",
    tags: ["Plateau fixes", "Goal-stage switches", "Coach-approved"],
    icon: RefreshCw,
    img: photos.scale,
    alt: "Feet on a bathroom scale",
  },
];

// One colourway per step — the stack reads like a deck of cards.
const themes = [
  { card: "bg-forest text-canvas", muted: "text-canvas/65", chip: "border-canvas/20 text-canvas/80", num: "text-sprout", icon: "bg-sprout text-forest" },
  { card: "bg-brand text-white", muted: "text-white/80", chip: "border-white/30 text-white/90", num: "text-white", icon: "bg-white text-brand" },
  { card: "bg-[#151515] text-canvas", muted: "text-canvas/65", chip: "border-canvas/20 text-canvas/80", num: "text-sprout", icon: "bg-sprout text-forest" },
  { card: "bg-mint text-ink", muted: "text-ink/65", chip: "border-ink/15 text-ink/75", num: "text-brand", icon: "bg-brand text-white" },
  { card: "bg-sprout text-forest", muted: "text-forest/75", chip: "border-forest/20 text-forest/80", num: "text-forest", icon: "bg-forest text-sprout" },
];
const tilts = [-1, 0.8, -0.6, 0.9, -0.5];

/*
 * The scale photo's black display, in % of the original photo (3:2).
 * Photo and readout sit in a box sized like CSS `object-cover`
 * (via container-query units), so the readout stays on the display
 * however the card crops the photo.
 */
const SCALE_AR = 1000 / 667;
const SCALE_SCREEN = { left: 44, top: 69, width: 12.4, height: 10 };
const coverBox: CSSProperties = {
  width: `max(100cqw, calc(100cqh * ${SCALE_AR}))`,
  height: `max(100cqh, calc(100cqw / ${SCALE_AR}))`,
};

/** Glowing LCD digits that count the weight down when the card comes into view. */
function ScaleReadout() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const kg = useMotionValue(72.4);
  const text = useTransform(kg, (v) => v.toFixed(1));
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      kg.set(68.2);
      return;
    }
    const c = animate(kg, 68.2, { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 });
    return () => c.stop();
  }, [inView, reduce, kg]);

  return (
    <div
      ref={ref}
      className="absolute flex items-center justify-center gap-[4%] rounded-[10%] bg-[#0B110D] [container-type:size]"
      style={{
        left: `${SCALE_SCREEN.left}%`,
        top: `${SCALE_SCREEN.top}%`,
        width: `${SCALE_SCREEN.width}%`,
        height: `${SCALE_SCREEN.height}%`,
      }}
    >
      <motion.span
        className="font-mono font-bold tabular-nums leading-none tracking-[-0.04em] text-sprout"
        style={{ fontSize: "62cqh", textShadow: "0 0 6px rgba(138,240,160,0.85), 0 0 14px rgba(138,240,160,0.45)" }}
      >
        {text}
      </motion.span>
      <span className="font-mono font-bold leading-none text-sprout/80" style={{ fontSize: "28cqh", textShadow: "0 0 6px rgba(138,240,160,0.6)" }}>
        kg
      </span>
    </div>
  );
}

function StepCard({ step, i, total, progress }: { step: (typeof steps)[number]; i: number; total: number; progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const t = themes[i % themes.length];
  const scale = useTransform(progress, [i / total, 1], [1, 1 - (total - 1 - i) * 0.035]);
  const Icon = step.icon;

  return (
    <div className="sticky mb-[5vh] last:mb-0 sm:mb-[8vh]" style={{ top: `calc(5.5rem + ${i * 0.9}rem)` }}>
      <motion.article
        style={reduce ? { rotate: tilts[i] } : { scale, rotate: tilts[i] }}
        className={`group relative grid origin-top grid-cols-1 gap-5 overflow-hidden rounded-[2rem] p-3 shadow-[0_30px_70px_-40px_rgba(10,10,10,0.6)] sm:p-5 lg:min-h-[28rem] lg:grid-cols-12 lg:gap-10 lg:p-5 ${t.card}`}
      >
        {/* Photo with the step number on it */}
        <div className="relative isolate aspect-[2/1] overflow-hidden rounded-[1.5rem] sm:aspect-[16/8] lg:col-span-5 lg:aspect-auto">
          {step.img === photos.scale ? (
            // Photo + live readout share one cover-sized box, so they zoom and crop together.
            <div className="absolute inset-0 -z-10 overflow-hidden [container-type:size]">
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-1000 ease-expo group-hover:scale-105"
                style={coverBox}
              >
                <Image src={unsplash(step.img, 1000)} alt={step.alt} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
                <ScaleReadout />
              </div>
            </div>
          ) : (
            <Image
              src={unsplash(step.img, 1000)}
              alt={step.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="-z-10 object-cover transition-transform duration-1000 ease-expo group-hover:scale-105"
            />
          )}
          <div
            className={`absolute inset-0 -z-10 bg-gradient-to-t to-transparent ${
              step.img === photos.scale ? "from-black/45 via-transparent" : "from-black/65 via-black/10"
            }`}
          />
          <span className="absolute bottom-2 left-4 font-sans text-6xl font-semibold leading-none tracking-[-0.06em] text-white sm:bottom-3 sm:left-5 sm:text-7xl lg:bottom-4 lg:left-6 lg:text-[8.5rem]">
            {step.no}
          </span>
          <span className={`absolute right-3 top-3 flex h-11 w-11 -rotate-6 items-center justify-center rounded-2xl shadow-lg sm:right-4 sm:top-4 sm:h-12 sm:w-12 ${t.icon}`}>
            <Icon size={20} />
          </span>
        </div>

        <div className="flex flex-col justify-end px-2 pb-3 sm:px-3 lg:col-span-7 lg:px-0 lg:py-8 lg:pr-8">
          <span className={`mb-4 w-fit rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${t.chip}`}>
            Step {i + 1} / {total}
          </span>
          <h3 className="font-sans text-3xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">{step.title}</h3>
          <p className={`mt-3 max-w-xl text-pretty text-[15px] leading-relaxed sm:mt-4 sm:text-lg ${t.muted}`}>{step.body}</p>
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
            {step.tags.map((tag) => (
              <span key={tag} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${t.chip}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.article>
    </div>
  );
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section id="how" className="relative bg-canvas py-20 lg:py-36">
      <div className="container-x">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-20">
          <div className="max-w-3xl">
            <Reveal>
              <span className="eyebrow">01 — How it works</span>
            </Reveal>
            <AnimatedHeading
              text="From sign-up to / your first plan."
              className="mt-5 font-sans text-[11vw] font-normal leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-8xl"
            />
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-xs text-pretty text-base leading-relaxed text-stone">
              Five steps, one real coach. Keep scrolling — the deck stacks itself.
            </p>
          </Reveal>
        </div>

        <div ref={ref} className="relative">
          {steps.map((step, i) => (
            <StepCard key={step.no} step={step} i={i} total={steps.length} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}
