"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  LayoutGroup,
  MotionValue,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowLeftRight, ArrowUpRight, Check, Egg, Fish, Leaf, LucideIcon } from "lucide-react";
import { photos, unsplash } from "@/lib/site";

/*
 * Hero: a spinning thali. Five katoris orbit a steel plate; the diet tabs
 * swap what's in them, hovering/tapping one shows its macros in the centre,
 * and the plate can be spun by dragging. It cycles diets on its own until
 * someone interacts.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

type Dish = { name: string; kcal: number; p: number; img?: string; icon?: LucideIcon; tone?: string };
type DietKey = "veg" | "jain" | "egg" | "nonveg" | "vegan";

const diets: { key: DietKey; label: string; note: string; dishes: Dish[] }[] = [
  {
    key: "veg",
    label: "Veg",
    note: "Paneer, dal and curd carry the protein",
    dishes: [
      { name: "Idli + sambar", kcal: 300, p: 11, img: photos.idliLeaf },
      { name: "Roti, sabzi & dal", kcal: 520, p: 20, img: photos.rotiSabzi },
      { name: "Palak paneer", kcal: 540, p: 26, img: photos.palakPaneer },
      { name: "Moong dal khichdi", kcal: 470, p: 19, img: photos.khichdi },
      { name: "Paneer tikka", kcal: 270, p: 18, img: photos.paneerTikka },
    ],
  },
  {
    key: "jain",
    label: "Jain",
    note: "No onion, garlic or root veg — swapped automatically",
    dishes: [
      { name: "Ragi dosa", kcal: 300, p: 8, img: photos.dosa },
      { name: "Moong dal khichdi", kcal: 470, p: 19, img: photos.khichdi },
      { name: "Lauki chana dal", kcal: 470, p: 19, img: photos.chanaDal },
      { name: "Jain-style palak paneer", kcal: 520, p: 25, img: photos.palakPaneer },
      { name: "Jain-style paneer tikka", kcal: 270, p: 18, img: photos.paneerTikka },
    ],
  },
  {
    key: "egg",
    label: "Egg",
    note: "Eggs added for easy, cheap protein",
    dishes: [
      { name: "Egg bhurji + roti", kcal: 360, p: 22, icon: Egg, tone: "bg-[#FCE7B2] text-[#8A5A00]" },
      { name: "Idli + sambar", kcal: 300, p: 11, img: photos.idliCoffee },
      { name: "Roti, sabzi & dal", kcal: 520, p: 20, img: photos.rotiSabzi },
      { name: "Boiled eggs", kcal: 160, p: 12, icon: Egg, tone: "bg-[#FFF3D6] text-[#8A5A00]" },
      { name: "Paneer tikka", kcal: 270, p: 18, img: photos.paneerTikka },
    ],
  },
  {
    key: "nonveg",
    label: "Non-veg",
    note: "Home-style chicken and fish, not bland breasts",
    dishes: [
      { name: "Chicken curry + rice", kcal: 560, p: 38, img: photos.chickenCurry },
      { name: "Masala dosa", kcal: 380, p: 9, img: photos.masalaDosa },
      { name: "Fish tikka + salad", kcal: 380, p: 36, icon: Fish, tone: "bg-[#D7ECF7] text-[#1B5E80]" },
      { name: "Home thali", kcal: 560, p: 21, img: photos.thali },
      { name: "Egg bhurji", kcal: 300, p: 20, icon: Egg, tone: "bg-[#FCE7B2] text-[#8A5A00]" },
    ],
  },
  {
    key: "vegan",
    label: "Vegan",
    note: "No dairy — tofu, dals and millets instead",
    dishes: [
      { name: "Masala dosa", kcal: 380, p: 9, img: photos.masalaDosa },
      { name: "Idli + sambar", kcal: 300, p: 11, img: photos.idliLeaf },
      { name: "Roti, sabzi & dal", kcal: 520, p: 20, img: photos.rotiSabzi },
      { name: "Tofu stir-fry + quinoa", kcal: 430, p: 26, icon: Leaf, tone: "bg-mint text-brand-deep" },
      { name: "Chana dal", kcal: 450, p: 18, img: photos.chanaDal },
    ],
  },
];

const ORBIT = 38; // % of the stage, centre → katori centre
const SLOTS = [0, 1, 2, 3, 4].map((i) => {
  const a = ((-90 + i * 72) * Math.PI) / 180;
  return { left: 50 + ORBIT * Math.cos(a), top: 50 + ORBIT * Math.sin(a) };
});

/** A number that eases to its new value. */
function Num({ value }: { value: number }) {
  const mv = useSpring(value, { stiffness: 160, damping: 24 });
  useEffect(() => {
    mv.set(value);
  }, [mv, value]);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("en-IN"));
  return <motion.span>{text}</motion.span>;
}

function Katori({
  dish,
  slot,
  index,
  counter,
  active,
  onPick,
}: {
  dish: Dish;
  slot: (typeof SLOTS)[number];
  index: number;
  counter: MotionValue<number>;
  active: boolean;
  onPick: (i: number | null) => void;
}) {
  const Icon = dish.icon;
  return (
    // Static wrapper does the centring; the motion child owns its own transform.
    <div className="absolute h-[23%] w-[23%] -translate-x-1/2 -translate-y-1/2" style={{ left: `${slot.left}%`, top: `${slot.top}%` }}>
      <motion.button
        type="button"
        style={{ rotate: counter }}
        onPointerEnter={(e) => e.pointerType === "mouse" && onPick(index)}
        onPointerLeave={(e) => e.pointerType === "mouse" && onPick(null)}
        onClick={() => onPick(active ? null : index)}
        aria-label={`${dish.name}, ${dish.kcal} kcal, ${dish.p} grams protein`}
        className="relative block h-full w-full"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={dish.name + index}
            className={`absolute inset-0 overflow-hidden rounded-full shadow-[0_14px_30px_-12px_rgba(14,26,19,0.55)] ring-[5px] transition-[box-shadow] duration-300 ${
              active ? "ring-brand" : "ring-white"
            }`}
            initial={{ scale: 0, rotate: -120, opacity: 0 }}
            animate={{ scale: active ? 1.12 : 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 20, delay: index * 0.045 }}
          >
            {dish.img ? (
              <Image src={unsplash(dish.img, 300)} alt="" fill sizes="140px" className="object-cover" />
            ) : (
              <span className={`flex h-full w-full items-center justify-center ${dish.tone ?? "bg-mint text-brand"}`}>
                {Icon && <Icon className="h-[38%] w-[38%]" strokeWidth={1.6} />}
              </span>
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

const mobileBowls = [
  { img: photos.idliLeaf, cls: "right-0 top-[2%] w-[68%]", float: 3.2, spin: 26, delay: 0.45 },
  { img: photos.palakPaneer, cls: "left-[2%] top-[44%] w-[50%]", float: 3.8, spin: -32, delay: 0.55 },
  { img: photos.paneerTikka, cls: "right-[9%] top-[60%] w-[34%]", float: 2.9, spin: 22, delay: 0.65 },
];

/** Types "Coach-approved" letter by letter, holds, erases, and loops. */
const BADGE = "Coach-approved";
function TypedBadgeText({ reduce }: { reduce: boolean }) {
  const [n, setN] = useState(reduce ? BADGE.length : 0);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    if (reduce) return;
    let delay: number;
    if (!erasing && n < BADGE.length) delay = n === 0 ? 450 : 85; // typing
    else if (!erasing) delay = 2200; // hold the full word
    else if (n > 0) delay = 35; // erasing
    else delay = 0;
    const t = setTimeout(() => {
      if (!erasing && n < BADGE.length) setN(n + 1);
      else if (!erasing) setErasing(true);
      else if (n > 0) setN(n - 1);
      else setErasing(false);
    }, delay);
    return () => clearTimeout(t);
  }, [n, erasing, reduce]);

  return (
    <span className="inline-flex items-center">
      {BADGE.slice(0, n)}
      {!reduce && <span className="ml-px inline-block h-[1.1em] w-[1.5px] animate-pulse bg-white/90" />}
    </span>
  );
}

function MobileBowls({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute -right-[2%] top-0 h-[42vw] w-[34vw] sm:hidden">
      {mobileBowls.map((b, i) => (
        // Static wrapper positions; motion children own their transforms.
        // The coach-approved thali (first bowl) sits on top of the others, badge included.
        <div key={b.img} className={`absolute aspect-square ${b.cls} ${i === 0 ? "z-10" : ""}`}>
          <motion.div
            className="h-full w-full"
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: b.delay }}
          >
            <motion.div
              className="relative h-full w-full overflow-hidden rounded-full shadow-[0_14px_26px_-12px_rgba(14,26,19,0.55)] ring-[3px] ring-white"
              animate={reduce ? {} : { y: [0, -5, 0] }}
              transition={{ duration: b.float, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0"
                animate={reduce ? {} : { rotate: b.spin > 0 ? 360 : -360 }}
                transition={{ duration: Math.abs(b.spin), repeat: Infinity, ease: "linear" }}
              >
                <Image src={unsplash(b.img, 240)} alt="" fill sizes="30vw" className="object-cover" />
              </motion.div>
            </motion.div>
          </motion.div>
          {i === 0 && (
            // Static wrapper anchors the badge over the top of the thali, clear of the bowls below; the motion span only animates.
            <span className="absolute -left-5 -top-2.5 flex">
              <motion.span
                className="flex items-center gap-1 whitespace-nowrap rounded-full bg-brand px-2 py-1 text-[10px] font-bold leading-none text-white shadow-[0_8px_16px_-8px_rgba(14,26,19,0.6)] ring-2 ring-white"
                initial={{ opacity: 0, scale: 0.5, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.9 }}
              >
                <Check size={10} strokeWidth={3.5} className="shrink-0" />
                <TypedBadgeText reduce={reduce} />
              </motion.span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();
  const [d, setD] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const lastTouch = useRef(0); // time of the last user interaction
  const diet = diets[d];
  const total = diet.dishes.reduce((s, x) => ({ kcal: s.kcal + x.kcal, p: s.p + x.p }), { kcal: 0, p: 0 });
  const shown = picked !== null ? diet.dishes[picked] : null;

  // Spin: one angle drives the ring; each katori counter-rotates to stay upright.
  const angle = useMotionValue(0);
  const counter = useTransform(angle, (a) => -a);
  const textRing = useTransform(angle, (a) => -a * 0.6);
  const drag = useRef<{ a: number; start: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useAnimationFrame((_, delta) => {
    if (reduce || drag.current) return; // keeps spinning on hover; only a drag takes over
    angle.set(angle.get() + delta * 0.009); // ~9°/s
  });

  // Cycle diets quickly until someone interacts; resume 8s after.
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      if (over || picked !== null || Date.now() - lastTouch.current < 8000) return;
      setD((n) => (n + 1) % diets.length);
    }, 2800);
    return () => clearInterval(t);
  }, [reduce, over, picked]);

  const choose = (i: number) => {
    lastTouch.current = Date.now();
    setPicked(null);
    setD(i);
  };

  const pointerAngle = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { a: pointerAngle(e), start: angle.get() };
    lastTouch.current = Date.now();
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    let delta = pointerAngle(e) - drag.current.a;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    angle.set(drag.current.start + delta);
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <section id="top" className="relative isolate overflow-hidden bg-canvas pb-14 pt-28 lg:flex lg:min-h-[100svh] lg:items-center lg:pb-16 lg:pt-28">
      {/* Background: soft green wash + faint concentric rings */}
      <div aria-hidden className="pointer-events-none absolute -right-[20%] top-[10%] -z-10 h-[60rem] w-[60rem] rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.12),transparent_62%)] lg:-right-[10%] lg:top-[-10%]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-[-18rem] -z-10 h-[36rem] w-[36rem] rounded-full border border-brand/10" />
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-[-12rem] -z-10 h-[24rem] w-[24rem] rounded-full border border-brand/10" />

      <div className="container-x grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Copy */}
        <div className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1.5 text-xs font-semibold text-brand-deep max-[380px]:px-3 max-[380px]:text-[11px] sm:text-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            Personal plans from a real coach
          </motion.p>

          <div className="relative mt-6">
          {/* Phones: a few spinning katoris fill the space beside the short headline lines */}
          <MobileBowls reduce={!!reduce} />
          <h1 className="relative font-sans text-[11.5vw] font-medium leading-[0.95] tracking-[-0.065em] text-ink sm:text-[8.6vw] lg:text-[length:min(5vw,5.25rem)]">
            {/* Phones break each line in two so the bigger type doesn't wrap awkwardly. */}
            {[
              ["Nutrition", "coaching"],
              ["built on", "the food"],
            ].map(([a, b], i) => (
              <span key={a} className="mask-line">
                <motion.span
                  className="block pb-[0.06em]"
                  initial={reduce ? false : { y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.75, ease: EASE, delay: 0.05 + i * 0.08 }}
                >
                  {a}
                  <br className="sm:hidden" /> {b}
                </motion.span>
              </span>
            ))}
            <span className="mask-line">
              <motion.span
                className="block pb-[0.1em]"
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.75, ease: EASE, delay: 0.21 }}
              >
                you{" "}
                <span className="relative inline-block font-serif italic tracking-[-0.02em] text-brand">
                  already eat.
                  <motion.svg
                    aria-hidden
                    viewBox="0 0 300 20"
                    preserveAspectRatio="none"
                    className="absolute -bottom-[0.08em] left-0 h-[0.22em] w-full text-sprout"
                  >
                    <motion.path
                      d="M4 14 C 80 4, 200 4, 296 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
                    />
                  </motion.svg>
                </span>
              </motion.span>
            </span>
          </h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
            className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-stone max-[380px]:text-[15px] sm:text-lg"
          >
            A personal diet — and workout — plan made from dal, roti, sabzi, paneer and idli. Drafted in seconds, checked by a real coach, and adjusted as your body changes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 max-[380px]:gap-x-4"
          >
            <a
              href="#pricing"
              className="group inline-flex items-center gap-2.5 rounded-full bg-brand py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white max-[380px]:gap-2 max-[380px]:pl-4 max-[380px]:text-[13px] shadow-[0_14px_30px_-12px_rgba(22,163,74,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-deep"
            >
              Get your plan
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight size={14} />
              </span>
            </a>
            <a href="#sample" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink max-[380px]:text-[13px]">
              <span className="relative">
                See a sample day
                <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" />
              </span>
              <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-ink/10 border-t border-ink/10 pt-6"
          >
            {[
              { v: "24 hrs", l: "to your first plan" },
              { v: "100%", l: "coach-reviewed" },
              { v: "5 diets", l: "veg to vegan" },
            ].map((s, i) => (
              <div key={s.l} className={i ? "pl-4 sm:pl-6" : "pr-4"}>
                <dt className="text-2xl font-semibold tracking-[-0.04em] text-ink sm:text-3xl">{s.v}</dt>
                <dd className="mt-1 text-xs leading-snug text-stone sm:text-sm">{s.l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Thali */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.1 }}
            className="relative mx-auto w-full max-w-[34rem]"
          >
            <div
              ref={box}
              className="relative aspect-square w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
              onPointerEnter={(e) => e.pointerType === "mouse" && setOver(true)}
              onPointerLeave={() => {
                setOver(false);
                onUp();
              }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              {/* Mint disc */}
              <div aria-hidden className="absolute inset-[3%] rounded-full bg-mint" />

              {/* Rotating word ring */}
              <motion.svg aria-hidden viewBox="0 0 200 200" className="absolute inset-0 h-full w-full text-brand/50" style={{ rotate: textRing }}>
                <defs>
                  <path id="evo-ring" d="M100,100 m-93,0 a93,93 0 1,1 186,0 a93,93 0 1,1 -186,0" />
                </defs>
                <text fontSize="6.4" fontWeight="700" letterSpacing="2" fill="currentColor">
                  <textPath href="#evo-ring">
                    DAL ✦ ROTI ✦ SABZI ✦ PANEER ✦ IDLI ✦ POHA ✦ KHICHDI ✦ CHILLA ✦ DOSA ✦ RAJMA ✦ CHOLE ✦ UPMA ✦
                  </textPath>
                </text>
              </motion.svg>

              {/* Orbit ring */}
              <motion.div aria-hidden className="absolute inset-[12%] rounded-full border-2 border-dashed border-brand/25" style={{ rotate: angle }} />

              {/* Steel plate */}
              <div className="absolute inset-[27%] rounded-full bg-[radial-gradient(circle_at_35%_28%,#ffffff,#EEF1EE_45%,#D3D9D3_100%)] shadow-[0_30px_60px_-25px_rgba(14,26,19,0.55),inset_0_-6px_14px_rgba(0,0,0,0.08)]">
                <div className="absolute inset-[7%] rounded-full bg-[radial-gradient(circle_at_40%_30%,#ffffff,#F1F3F0_60%,#E2E7E2)] ring-1 ring-black/5" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-[14%] text-center">
                  <>
                    {shown ? (
                      <motion.div key={`dish-${shown.name}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.18 }}>
                        <p className="text-[clamp(0.65rem,2.6vw,0.95rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">{shown.name}</p>
                        <p className="mt-1 text-[clamp(1.2rem,5vw,1.9rem)] font-semibold tabular-nums leading-none tracking-[-0.05em] text-brand">{shown.kcal}</p>
                        <p className="text-[clamp(0.55rem,2vw,0.75rem)] font-medium text-ink/50">kcal · {shown.p}g protein</p>
                      </motion.div>
                    ) : (
                      <motion.div key="total" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.18 }}>
                        <p className="text-[clamp(0.5rem,1.8vw,0.7rem)] font-bold uppercase tracking-[0.18em] text-ink/40">Sample day</p>
                        <p className="mt-1 text-[clamp(1.5rem,6.5vw,2.6rem)] font-semibold tabular-nums leading-none tracking-[-0.05em] text-ink">
                          <Num value={total.kcal} />
                        </p>
                        <p className="mt-1 text-[clamp(0.55rem,2vw,0.8rem)] font-semibold text-brand">
                          kcal · <Num value={total.p} />g protein
                        </p>
                      </motion.div>
                    )}
                  </>
                </div>
              </div>

              {/* Floating cards (desktop) */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -left-[6%] top-[6%] hidden items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-[0_20px_40px_-18px_rgba(14,26,19,0.5)] ring-1 ring-ink/5 sm:flex"
                initial={{ opacity: 0, x: -20, rotate: -8 }}
                animate={{ opacity: 1, x: 0, rotate: -4, y: reduce ? 0 : [0, -6, 0] }}
                transition={{ opacity: { delay: 0.6 }, x: { delay: 0.6, type: "spring", stiffness: 200, damping: 18 }, y: { duration: 3.4, repeat: Infinity, ease: "easeInOut" } }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
                  <Check size={15} strokeWidth={3} />
                </span>
                <span>
                  <span className="block text-xs font-bold text-ink">Coach approved</span>
                  <span className="block text-[11px] text-ink/50">Sent to your dashboard</span>
                </span>
              </motion.div>

              <motion.div
                aria-hidden
                className="pointer-events-none absolute -right-[3%] bottom-[10%] hidden w-28 rounded-2xl bg-forest p-3 text-canvas shadow-[0_20px_40px_-18px_rgba(14,26,19,0.7)] sm:block"
                initial={{ opacity: 0, x: 20, rotate: 8 }}
                animate={{ opacity: 1, x: 0, rotate: 4, y: reduce ? 0 : [0, 7, 0] }}
                transition={{ opacity: { delay: 0.75 }, x: { delay: 0.75, type: "spring", stiffness: 200, damping: 18 }, y: { duration: 3.8, repeat: Infinity, ease: "easeInOut" } }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-canvas/50">Protein</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-[-0.04em] text-sprout">
                  <Num value={total.p} />g
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas/10">
                  <motion.span className="block h-full rounded-full bg-sprout" animate={{ width: `${Math.min(100, (total.p / 110) * 100)}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                </div>
              </motion.div>
              {/* Katoris on a spinning ring */}
              <motion.div className="absolute inset-0" style={{ rotate: angle }}>
                {diet.dishes.map((dish, i) => (
                  <Katori key={i} dish={dish} slot={SLOTS[i]} index={i} counter={counter} active={picked === i} onPick={setPicked} />
                ))}
              </motion.div>

            </div>

            {/* Diet tabs + what changed */}
            <div className="relative z-10 -mt-2 flex flex-col items-center gap-3 sm:-mt-4">
              <LayoutGroup id="hero-diet">
                <div className="hide-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-[0_14px_30px_-16px_rgba(14,26,19,0.45)] ring-1 ring-ink/5" role="tablist" aria-label="Diet">
                  {diets.map((x, i) => {
                    const on = i === d;
                    return (
                      <button
                        key={x.key}
                        role="tab"
                        aria-selected={on}
                        onClick={() => choose(i)}
                        className={`relative shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors sm:px-4 ${on ? "text-white" : "text-ink/60 hover:text-ink"}`}
                      >
                        {on && <motion.span layoutId="hero-diet-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
                        <span className="relative">{x.label}</span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>
              <div className="h-9">
                <>
                  <motion.p
                    key={diet.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-3.5 py-2 text-xs font-semibold text-canvas"
                  >
                    <ArrowLeftRight size={13} className="text-sprout" />
                    {diet.note}
                  </motion.p>
                </>
              </div>
              <p className="text-center text-xs text-ink/40">
                <span className="hidden sm:inline">Hover a bowl · drag to spin the plate</span>
                <span className="sm:hidden">Tap a bowl · swipe sideways to spin</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
