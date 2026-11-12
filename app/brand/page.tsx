import type { Metadata } from "next";
import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BowlMark, RingMark, SproutMark } from "@/components/brand/Marks";
import { BowlLockup, RingWordmark, SproutLockup } from "@/components/brand/Lockups";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Logo concepts",
  robots: { index: false, follow: false },
};

const G = "#16A34A";
const S = "#8AF0A0";
const F = "#0E1A13";

type Concept = {
  no: string;
  name: string;
  idea: string;
  why: string[];
  mark: (variant: "light" | "green" | "dark", cls: string) => ReactNode;
  lockup: (tone: "light" | "dark") => ReactNode;
};

const concepts: Concept[] = [
  {
    no: "01",
    name: "Sprout",
    idea: "A lowercase e whose crossbar grows into a two-leaf sprout. Together they read as “ev” — as in evolve.",
    why: ["Friendly and human, not clinical", "The sprout says growth and progress", "Distinct silhouette at app-icon size"],
    mark: (v, cls) =>
      v === "light" ? (
        <SproutMark className={cls} />
      ) : v === "green" ? (
        <SproutMark className={cls} ink="#fff" leaf={S} leaf2="#fff" vein={G} />
      ) : (
        <SproutMark className={cls} ink="#FAFAF8" leaf={S} leaf2={G} vein={F} />
      ),
    lockup: (t) => <SproutLockup tone={t} className="text-4xl sm:text-5xl" />,
  },
  {
    no: "02",
    name: "Katori",
    idea: "The top of the e is a leaf, the bottom is a katori bowl, and the crossbar is the bowl’s rim. Food and growth in one letter.",
    why: ["Says “Indian home food” without a single word", "Pairs with the site’s serif-italic accent", "Strong, simple shape — works in one colour"],
    mark: (v, cls) =>
      v === "light" ? (
        <BowlMark className={cls} />
      ) : v === "green" ? (
        <BowlMark className={cls} ink="#fff" leaf={S} vein={F} />
      ) : (
        <BowlMark className={cls} ink="#FAFAF8" leaf={S} vein={F} />
      ),
    lockup: (t) => <BowlLockup tone={t} className="text-4xl sm:text-5xl" />,
  },
  {
    no: "03",
    name: "Ring",
    idea: "The progress ring from the app — about 80% full — finishing in a leaf. In the wordmark it becomes the “o” of evowell.",
    why: ["Ties the brand to the dashboard clients use daily", "The wordmark itself is the logo", "Most modern and app-like of the three"],
    mark: (v, cls) =>
      v === "light" ? (
        <RingMark className={cls} />
      ) : v === "green" ? (
        <RingMark className={cls} ink="#fff" leaf={S} track="rgba(255,255,255,0.18)" vein={G} />
      ) : (
        <RingMark className={cls} ink={S} leaf="#FAFAF8" track="rgba(250,250,248,0.08)" vein={G} />
      ),
    lockup: (t) => <RingWordmark tone={t} className="text-5xl sm:text-6xl" />,
  },
];

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center justify-center rounded-[1.75rem] ${className}`}>{children}</div>;
}

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-canvas pb-24 pt-10 sm:pt-14">
      <div className="container-x">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-ink">
          <ArrowLeft size={15} /> Back to site
        </Link>
        <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Evowell · brand</p>
            <h1 className="mt-4 font-sans text-[11vw] font-medium leading-[0.95] tracking-[-0.06em] text-ink sm:text-6xl lg:text-7xl">
              Three logo <span className="font-serif italic text-brand">concepts.</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 ring-1 ring-ink/10">
            <LogoMark className="h-10 w-10" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/40">Current</p>
              <p className="text-sm font-semibold text-ink">Live-site icon, for comparison</p>
            </div>
          </div>
        </div>

        <div className="mt-14 space-y-20 lg:mt-20 lg:space-y-28">
          {concepts.map((c) => (
            <section key={c.no} className="border-t border-ink/10 pt-10 lg:pt-14">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-4">
                  <p className="text-sm font-semibold text-brand">Concept {c.no}</p>
                  <h2 className="mt-2 font-sans text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">{c.name}</h2>
                  <p className="mt-4 max-w-sm text-pretty text-base leading-relaxed text-stone">{c.idea}</p>
                  <ul className="mt-6 space-y-2">
                    {c.why.map((w) => (
                      <li key={w} className="flex items-start gap-2.5 text-sm font-medium text-ink">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 lg:col-span-8">
                  {/* Hero mark + icon tiles */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Panel className="col-span-2 row-span-2 aspect-square bg-white ring-1 ring-ink/10 sm:aspect-auto">{c.mark("light", "h-[62%] w-[62%] sm:h-56 sm:w-56")}</Panel>
                    <Panel className="aspect-square" >
                      <span className="flex h-[72%] w-[72%] items-center justify-center rounded-[22%] shadow-[0_18px_30px_-16px_rgba(14,26,19,0.6)]" style={{ background: G }}>
                        {c.mark("green", "h-[78%] w-[78%]")}
                      </span>
                    </Panel>
                    <Panel className="aspect-square">
                      <span className="flex h-[72%] w-[72%] items-center justify-center rounded-[22%] shadow-[0_18px_30px_-16px_rgba(14,26,19,0.6)]" style={{ background: F }}>
                        {c.mark("dark", "h-[78%] w-[78%]")}
                      </span>
                    </Panel>
                    <Panel className="aspect-square bg-mint">{c.mark("light", "h-[58%] w-[58%]")}</Panel>
                    <Panel className="aspect-square bg-forest">{c.mark("dark", "h-[58%] w-[58%]")}</Panel>
                  </div>

                  {/* Lockups */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Panel className="min-h-[9rem] bg-white px-6 py-8 ring-1 ring-ink/10">{c.lockup("light")}</Panel>
                    <Panel className="min-h-[9rem] bg-forest px-6 py-8">{c.lockup("dark")}</Panel>
                  </div>

                  {/* Size ramp + in-context header */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Panel className="justify-around gap-4 bg-white px-6 py-6 ring-1 ring-ink/10">
                      {[64, 40, 28, 20, 16].map((px) => (
                        <span key={px} className="flex flex-col items-center gap-2">
                          <span style={{ width: px, height: px }} className="flex">
                            {c.mark("light", "h-full w-full")}
                          </span>
                          <span className="text-[10px] tabular-nums text-ink/40">{px}px</span>
                        </span>
                      ))}
                    </Panel>
                    <Panel className="bg-ivory px-4 py-6">
                      <div className="flex w-full max-w-sm items-center justify-between rounded-full bg-white/80 py-2 pl-4 pr-2 shadow-[0_12px_30px_-18px_rgba(10,10,10,0.4)] ring-1 ring-ink/10">
                        {c.no === "03" ? <RingWordmark className="text-2xl" /> : c.no === "02" ? <BowlLockup className="text-xl" /> : <SproutLockup className="text-xl" />}
                        <span className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-canvas">Get your plan</span>
                      </div>
                    </Panel>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-20 text-center text-sm text-stone">
          Pick one (or mix — e.g. the Ring wordmark with the Katori icon) and it goes into the header, footer, favicon and app icon.
        </p>
      </div>
    </main>
  );
}
