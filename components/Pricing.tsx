"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowUpRight, Check, Sparkles, Video } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import { PlanDef, defaultPlanKey, inr, lengthLabel, lengthsOf, parsePlanKey, perMonth, planKey, visiblePlans } from "@/lib/plans";
import { useSettings } from "@/lib/settings";

function Price({ value }: { value: number }) {
  return (
    <span className="relative inline-flex overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
        >
          {inr(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function PlanCard({ plan: p, days }: { plan: PlanDef; days: number }) {
  const o = p.options.find((x) => x.days === days)!;
  const dark = p.featured;
  // Compared with buying the shortest length repeatedly.
  const shortest = [...p.options].sort((a, b) => a.days - b.days)[0];
  const was = shortest && shortest.days < days ? Math.round((shortest.price / shortest.days) * days) : 0;
  const saves = was > o.price;

  return (
    <div
      className={`relative flex h-full flex-col rounded-[2rem] p-6 sm:p-8 ${
        dark ? "bg-forest text-canvas shadow-[0_40px_80px_-40px_rgba(14,26,19,0.8)]" : "bg-white text-ink ring-1 ring-ink/10"
      }`}
    >
      {p.featured && (
        <span className="absolute -top-3 right-6 -rotate-3 rounded-full bg-sprout px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-forest">Most popular</span>
      )}
      <p className={`text-[0.6875rem] font-bold uppercase tracking-[0.2em] ${dark ? "text-canvas/50" : "text-ink/45"}`}>{days}-day programme</p>
      <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{p.name}</h3>
      {p.tagline && <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-canvas/60" : "text-stone"}`}>{p.tagline}</p>}

      <div className="mt-6 flex items-end gap-3">
        <p className="text-5xl font-semibold tabular-nums tracking-[-0.05em]">
          <Price value={o.price} />
        </p>
        {saves && (
          <motion.p key={`was-${days}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={`pb-1.5 text-base tabular-nums line-through ${dark ? "text-canvas/35" : "text-ink/30"}`}>
            {inr(was)}
          </motion.p>
        )}
      </div>
      <p className={`mt-1 text-sm ${dark ? "text-canvas/55" : "text-stone"}`}>
        {o.badge && <b className={dark ? "text-sprout" : "text-brand-deep"}>{o.badge}</b>}
        {o.badge && " · "}
        {days > 31 ? `${inr(perMonth(o))}/month` : "One-time payment · no auto-renewal"}
      </p>

      <ul className="mb-8 mt-7 space-y-3">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[0.9375rem]">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${dark ? "bg-sprout text-forest" : "bg-brand text-white"}`}>
              <Check size={11} strokeWidth={3.5} />
            </span>
            {f}
          </li>
        ))}
        <AnimatePresence initial={false}>
          {o.perks.map((f, i) => (
            <motion.li
              key={`${days}-${f}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="overflow-hidden"
            >
              <span className={`flex items-start gap-3 text-[0.9375rem] font-semibold ${dark ? "text-sprout" : "text-brand-deep"}`}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${dark ? "bg-canvas text-forest" : "bg-ink text-canvas"}`}>
                  {/video|call/i.test(f) ? <Video size={11} /> : <Sparkles size={11} />}
                </span>
                {f}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <Link
        href={`/onboarding?plan=${planKey(p.id, days)}`}
        className={`group inline-flex items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold transition-colors duration-300 ${
          dark ? "bg-sprout text-forest hover:bg-canvas" : "bg-ink text-canvas hover:bg-brand"
        } mt-auto`}
      >
        Get {p.name}
        <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:rotate-45" />
      </Link>
    </div>
  );
}

export default function Pricing() {
  const s = useSettings();
  const lengths = lengthsOf(s.plans);
  const start = parsePlanKey(defaultPlanKey(s.plans))?.days ?? lengths[lengths.length - 1];
  const [picked, setPicked] = useState<number | null>(null);
  const days = picked !== null && lengths.includes(picked) ? picked : lengths.includes(start) ? start : lengths[lengths.length - 1];
  const shown = visiblePlans(s.plans).filter((p) => p.options.some((o) => o.days === days));
  // A badge for each length (e.g. "3rd month free"), taken from the plans that offer it.
  const badgeFor = (d: number) => visiblePlans(s.plans).flatMap((p) => p.options).find((o) => o.days === d && o.badge)?.badge;
  const cols = shown.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : shown.length === 2 ? "md:grid-cols-2" : "mx-auto max-w-xl";

  return (
    <section id="pricing" className="relative bg-canvas py-20 lg:py-32">
      <div className="container-x">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-14">
          <div>
            <Reveal>
              <span className="eyebrow">06 — Pricing</span>
            </Reveal>
            <AnimatedHeading
              text="Simple plans. / Pay once."
              className="mt-5 font-sans text-[11vw] font-normal leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-8xl"
            />
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-pretty text-base leading-relaxed text-stone">
              Pick a plan and a length. Longer programmes cost less per month, and some come with extras like 1:1 video calls.
            </p>
          </Reveal>
        </div>

        {lengths.length > 1 && (
          <Reveal className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <LayoutGroup id="duration">
              <div className="inline-flex max-w-full flex-wrap rounded-[1.5rem] bg-ink/[0.05] p-1 sm:rounded-full" role="radiogroup" aria-label="Programme length">
                {lengths.map((d) => {
                  const badge = badgeFor(d);
                  return (
                    <button
                      key={d}
                      role="radio"
                      aria-checked={days === d}
                      onClick={() => setPicked(d)}
                      className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition-colors sm:px-6 ${days === d ? "text-canvas" : "text-ink/60 hover:text-ink"}`}
                    >
                      {days === d && <motion.span layoutId="dur-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                      <span className="relative flex items-center gap-2">
                        {lengthLabel(d)}
                        {badge && <span className={`rounded-full px-2 py-0.5 text-[0.625rem] font-bold ${days === d ? "bg-sprout text-forest" : "bg-brand/15 text-brand-deep"}`}>{badge}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </Reveal>
        )}

        <div className={`grid grid-cols-1 gap-5 lg:gap-6 ${cols}`}>
          {shown.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08} className="h-full">
              <PlanCard plan={p} days={days} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-stone">
          <span>✓ Pay once, nothing renews</span>
          <span>✓ Plan within 24 hours of sign-up</span>
          <span>✓ Clients anywhere in the world</span>
        </Reveal>
      </div>
    </section>
  );
}
