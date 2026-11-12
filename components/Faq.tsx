"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedHeading from "@/components/ui/AnimatedHeading";

const faqs = [
  {
    q: "Is this a real coach or an app?",
    a: "Both. The app is where you track. Every plan is checked and signed off by your coach before you see it, and adjusted by hand whenever needed.",
  },
  {
    q: "I'm vegetarian / Jain / eggetarian. Will it work?",
    a: "Yes. You tell us exactly what you eat and what you don't. Jain means no onion, garlic or root veg. Vegan, egg and non-veg are covered too — no 'just eat chicken breast' plans.",
  },
  {
    q: "I have PCOS / thyroid / diabetes / high BP.",
    a: "Plans are built around it: lower-GI carbs for PCOS and diabetes, no soy for thyroid, lower salt for blood pressure. Always keep your doctor in the loop — we coach food and training, not medicine.",
  },
  {
    q: "What if I stop losing weight?",
    a: "That happens to everyone. If the scale doesn't move for 2–3 weeks, your plan gets reworked — different calories, steps or meal structure — and your coach approves the update.",
  },
  {
    q: "Do I need a gym?",
    a: "No. Pick home or gym on the Meal + Workout plans. Home plans need a mat and, optionally, a pair of dumbbells or a backpack.",
  },
  {
    q: "What's the difference between 30 and 90 days?",
    a: "90 days costs the same as two months, so the third month is free. The 90-day plans also include 1:1 video calls with your coach.",
  },
  {
    q: "Can I join from outside India?",
    a: "Yes. Clients anywhere can sign up. Plans use Indian home food, so they work wherever you cook.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-ivory py-20 lg:py-32">
      <div className="container-x">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <Reveal>
              <span className="eyebrow">07 — FAQ</span>
            </Reveal>
            <AnimatedHeading
              text="Questions, / answered."
              className="mt-5 font-sans text-[11vw] font-normal leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl"
            />
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xs text-pretty text-base leading-relaxed text-stone">Something else? Sign up and message your coach directly.</p>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <ul className="border-t border-ink/10">
              {faqs.map((f, i) => {
                const on = open === i;
                return (
                  <Reveal as="li" key={f.q} delay={i * 0.03} className="border-b border-ink/10">
                    <button onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="group flex w-full items-center gap-5 py-5 text-left sm:py-6">
                      <span className={`flex-1 text-lg font-semibold tracking-[-0.02em] transition-colors sm:text-2xl ${on ? "text-ink" : "text-ink/75 group-hover:text-ink"}`}>{f.q}</span>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${on ? "rotate-45 bg-brand text-white" : "bg-ink/[0.06] text-ink"}`}>
                        <Plus size={18} />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-2xl pb-6 pr-14 text-pretty text-base leading-relaxed text-stone">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
