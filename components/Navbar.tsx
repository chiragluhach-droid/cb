"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { nav } from "@/lib/site";
import { CHECKOUT_MODE } from "@/lib/plans";
import { LogoMark, Wordmark } from "@/components/Logo";

// The header stays visible until the hero is mostly scrolled past (80% of
// its height). Pages without the #top hero use 60% of the viewport instead.
const showZone = () => {
  const hero = document.getElementById("top");
  return hero ? hero.offsetHeight * 0.8 : window.innerHeight * 0.6;
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [goingDown, setGoingDown] = useState(false);
  const lastY = useRef(0);
  const [open, setOpen] = useState(false);
  const onHome = usePathname() === "/";

  // Once you scroll, the bar shrinks into a floating frosted "island".
  const island = scrolled;
  // Hides while scrolling down, slides back on any scroll up.
  const hidden = goingDown && !open;

  // Section links only exist on the homepage; elsewhere send them home first.
  const resolve = (href: string) => (href.startsWith("#") && !onHome ? `/${href}` : href);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const delta = y - lastY.current;
      const zone = showZone();
      if (y <= zone) setGoingDown(false);
      else if (Math.abs(delta) > 6) setGoingDown(delta > 0);
      if (Math.abs(delta) > 6 || y <= zone) lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: hidden ? "-130%" : 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 sm:px-4"
      >
        <div
          className={`mx-auto transition-all duration-500 ease-expo ${
            island
              ? "mt-3 max-w-[1120px] rounded-[2rem] bg-canvas/60 shadow-[0_12px_40px_-20px_rgba(10,10,10,0.35)] ring-1 ring-ink/10 backdrop-blur-xl"
              : "mt-0 max-w-[1600px] rounded-[0px] bg-transparent ring-0 ring-transparent"
          }`}
        >
          <nav
            className={`relative flex items-center justify-between transition-all duration-500 ease-expo ${
              island ? "py-2 pl-4 pr-2 sm:pl-5" : "px-3 py-5 sm:px-6 lg:px-12"
            }`}
          >
            <a href={onHome ? "#top" : "/"} className="flex items-center gap-2.5 text-ink" aria-label="Evowell home">
              <LogoMark className="h-8 w-8 sm:h-9 sm:w-9" />
              <Wordmark className="text-2xl sm:text-[1.65rem]" />
            </a>

            <ul className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-9 lg:flex xl:gap-12">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={resolve(item.href)} className="group relative whitespace-nowrap text-[15px] font-semibold text-ink">
                    {item.label}
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand transition-all duration-300 ease-expo group-hover:w-full" />
                  </a>
                </li>
              ))}
            </ul>

            <a
              href={resolve("#pricing")}
              className={`group hidden items-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-canvas transition-all duration-500 ease-expo hover:bg-brand md:inline-flex ${
                island ? "px-6 py-3" : "px-7 py-3.5"
              }`}
            >
              Get your plan
              <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>

            <button
              onClick={() => setOpen(true)}
              className="flex h-10 w-10 items-center justify-center text-ink lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </nav>
        </div>
      </motion.header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[70] flex flex-col bg-canvas lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            data-lenis-prevent
          >
            <div className="container-x flex items-center justify-between py-5">
              <span className="flex items-center gap-2 text-ink">
                <LogoMark className="h-7 w-7" />
                <Wordmark className="text-xl" />
              </span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/[0.06] text-ink transition-colors hover:bg-ink/10"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <ul className="container-x mt-4 flex flex-col">
              {nav.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={resolve(item.href)}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-3 font-sans text-2xl font-bold tracking-[-0.02em] text-ink active:opacity-60"
                  >
                    {item.label}
                    <span className="text-sm font-semibold text-ink/30">0{i + 1}</span>
                  </a>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + nav.length * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="container-x mt-auto pb-8"
            >
              <div className="border-t border-ink/10 pt-8">
                {CHECKOUT_MODE === "free" && (
                  <p className="mb-4 flex items-center gap-2 text-sm text-ink/60">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                    Early access — checkout is free right now
                  </p>
                )}
                <a
                  href={resolve("#pricing")}
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-semibold text-canvas active:bg-brand"
                >
                  Get your plan
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
