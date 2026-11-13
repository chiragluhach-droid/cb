import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import { photos, unsplash } from "@/lib/site";

export default function FinalCta() {
  return (
    <section className="bg-canvas pb-6 pt-20 lg:pt-28">
      <div className="container-x">
        <div className="relative isolate overflow-hidden rounded-[2rem] px-6 py-16 text-canvas sm:px-12 sm:py-20 lg:px-16 lg:py-28">
          <Image src={unsplash(photos.thali, 1800)} alt="" fill sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/85 to-forest/30" />
          <Reveal>
            <span className="-rotate-2 inline-block rounded-full bg-sprout px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-forest">Your plan in 24 hours</span>
          </Reveal>
          <AnimatedHeading
            text="Ready to start / eating better?"
            className="mt-6 max-w-3xl font-sans text-[11vw] font-normal leading-[0.98] tracking-[-0.055em] text-canvas sm:text-6xl lg:text-8xl"
          />
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-canvas/70">
              Answer a few questions. Your coach will have your first plan ready within a day — built from the food on your table.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#pricing"
                className="group inline-flex items-center gap-3 rounded-full bg-sprout py-2.5 pl-6 pr-2.5 text-sm font-bold text-forest transition-transform duration-300 ease-expo hover:-rotate-2 hover:scale-105"
              >
                Get your plan
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sprout transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight size={15} />
                </span>
              </a>
              <a href="#sample" className="text-sm font-semibold text-canvas/80 underline-offset-4 hover:text-canvas hover:underline">
                See a sample day first
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
