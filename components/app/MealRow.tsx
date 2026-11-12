"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Check, RotateCcw, Utensils, X } from "lucide-react";
import { Dish, servingsLabel } from "@/lib/engine";
import { unsplash } from "@/lib/site";
import type { PlannedMeal } from "@/components/app/meals";

export function DishThumb({ dish, size = "h-14 w-14" }: { dish: Dish | null; size?: string }) {
  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-mint text-brand ${size}`}>
      {dish?.img ? <Image src={unsplash(dish.img, 200)} alt="" fill sizes="64px" className="object-cover" /> : <Utensils size={18} />}
    </span>
  );
}

export function MealRow({
  meal,
  done,
  onToggle,
  onSwap,
  readOnly = false,
}: {
  meal: PlannedMeal;
  done?: boolean;
  onToggle?: () => void;
  onSwap?: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-[1.25rem] p-2.5 pr-3 transition-colors sm:gap-4 sm:p-3 ${done ? "bg-mint/60" : "bg-[#F7F8F5]"}`}>
      <DishThumb dish={meal.dish} size="h-14 w-14 sm:h-16 sm:w-16" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">
          {meal.label} · {meal.time}
          {meal.swapped && <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] tracking-[0.1em] text-brand-deep">Swapped</span>}
        </p>
        <p className={`truncate text-[15px] font-semibold tracking-[-0.01em] transition-colors ${done ? "text-ink/50 line-through decoration-ink/20" : "text-ink"}`}>
          {meal.dish ? meal.dish.name : "Your coach plans this one"}
        </p>
        {meal.dish && (
          <p className="truncate text-xs text-stone">
            {servingsLabel(meal.servings)} · {meal.kcal} kcal · <span className="font-semibold text-brand-deep">{meal.protein}g P</span>
          </p>
        )}
      </div>
      {!readOnly && meal.dish && (
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={onSwap} aria-label={`Swap ${meal.label}`} className="flex h-10 w-10 items-center justify-center rounded-full text-ink/45 transition-colors hover:bg-white hover:text-ink">
            <ArrowLeftRight size={17} />
          </button>
          <button
            onClick={onToggle}
            aria-pressed={done}
            aria-label={done ? `Mark ${meal.label} not eaten` : `Mark ${meal.label} eaten`}
            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-90 ${done ? "border-brand bg-brand text-white" : "border-ink/15 bg-white text-transparent hover:border-brand/50"}`}
          >
            <AnimatePresence initial={false}>
              {done ? (
                <motion.span key="on" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                  <Check size={18} strokeWidth={3} />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </button>
        </div>
      )}
    </div>
  );
}

export function SwapSheet({
  open,
  title,
  options,
  canReset,
  onPick,
  onReset,
  onClose,
}: {
  open: boolean;
  title: string;
  options: { dish: Dish; servings: number; kcal: number; protein: number }[];
  canReset: boolean;
  onPick: (dishId: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85svh] w-full max-w-lg flex-col rounded-t-[2rem] bg-canvas sm:rounded-[2rem]"
          >
            <div className="flex items-start justify-between gap-4 p-5 pb-3 sm:p-6 sm:pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">Swap a dish</p>
                <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink">{title}</p>
                <p className="mt-0.5 text-sm text-stone">Portions are adjusted to keep your calories on track.</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/[0.06]">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6" data-lenis-prevent>
              {canReset && (
                <button onClick={onReset} className="flex w-full items-center gap-3 rounded-[1.25rem] border border-dashed border-ink/15 p-3 text-left text-sm font-semibold text-ink/70 hover:border-ink/30">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/[0.05]">
                    <RotateCcw size={17} />
                  </span>
                  Back to my coach&apos;s pick
                </button>
              )}
              {options.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-stone">No other dishes fit this meal yet — ask your coach to add some.</p>}
              {options.map((o) => (
                <button key={o.dish.id} onClick={() => onPick(o.dish.id)} className="flex w-full items-center gap-3 rounded-[1.25rem] bg-white p-2.5 pr-4 text-left ring-1 ring-ink/[0.06] transition-all hover:ring-brand/40">
                  <DishThumb dish={o.dish} size="h-12 w-12" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink">{o.dish.name}</span>
                    <span className="block truncate text-xs text-stone">{o.dish.serving}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums">{o.kcal}</span>
                    <span className="block text-[11px] font-semibold tabular-nums text-brand-deep">{o.protein}g P</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
