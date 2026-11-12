"use client";

import { CSSProperties, ReactNode, useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Check, LucideIcon } from "lucide-react";

/** White rounded card used across the dashboard. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[1.75rem] bg-white p-5 ring-1 ring-ink/[0.06] sm:p-6 ${className}`}>{children}</div>;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/45">{children}</h2>
      {action}
    </div>
  );
}

/** A number that eases to its new value. */
export function Num({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const mv = useSpring(value, { stiffness: 140, damping: 22 });
  useEffect(() => {
    mv.set(value);
  }, [mv, value]);
  const text = useTransform(mv, (v) => v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
  return <motion.span>{text}</motion.span>;
}

/** Single-choice pills with a sliding highlight. */
export function Segmented<T extends string | number>({
  id,
  options,
  value,
  onChange,
  size = "md",
}: {
  id: string;
  options: { v: T; l: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl bg-ink/[0.05] p-1" role="radiogroup">
      {options.map((o) => {
        const on = o.v === value;
        return (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.v)}
            className={`relative flex-1 whitespace-nowrap rounded-xl font-semibold transition-colors ${size === "sm" ? "px-3 py-2 text-xs" : "px-3 py-2.5 text-sm"} ${
              on ? "text-canvas" : "text-ink/60 hover:text-ink"
            }`}
          >
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-xl bg-ink" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
            <span className="relative">{o.l}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Multi-choice chips. */
export function Chips<T extends string>({ options, value, onChange }: { options: { v: T; l: string }[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.v);
        return (
          <button
            key={o.v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o.v) : [...value, o.v])}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
              on ? "bg-brand text-white" : "bg-white text-ink/70 ring-1 ring-ink/10 hover:ring-ink/25"
            }`}
          >
            <motion.span animate={{ width: on ? 14 : 0, opacity: on ? 1 : 0 }} className="inline-flex overflow-hidden">
              <Check size={14} strokeWidth={3} />
            </motion.span>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

/** Big selectable card with an icon. */
export function ChoiceCard({ icon: Icon, title, body, on, onClick }: { icon: LucideIcon; title: string; body?: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`relative flex w-full items-start gap-4 rounded-[1.5rem] p-4 text-left transition-all duration-300 sm:p-5 ${
        on ? "bg-forest text-canvas shadow-[0_20px_40px_-24px_rgba(14,26,19,0.8)]" : "bg-white text-ink ring-1 ring-ink/10 hover:ring-ink/25"
      }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors ${on ? "bg-sprout text-forest" : "bg-mint text-brand"}`}>
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-base font-semibold tracking-[-0.02em]">{title}</span>
        {body && <span className={`mt-0.5 block text-sm leading-snug ${on ? "text-canvas/60" : "text-stone"}`}>{body}</span>}
      </span>
      <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? "border-sprout bg-sprout text-forest" : "border-ink/15"}`}>
        {on && <Check size={12} strokeWidth={3.5} />}
      </span>
    </button>
  );
}

export function RangeField({ label, unit, min, max, step = 1, value, onChange }: { label: string; unit: string; min: number; max: number; step?: number; value: number; onChange: (v: number) => void }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="block rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:p-5">
      <span className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-2xl font-semibold tabular-nums tracking-[-0.04em] text-ink">
          {value}
          <span className="ml-1 text-sm font-medium text-ink/40">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="evo-range-light mt-4"
        style={{ "--fill": `${fill}%` } as CSSProperties}
        aria-label={label}
      />
      <span className="mt-2 flex justify-between text-[11px] tabular-nums text-ink/35">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </span>
    </label>
  );
}

/** Thin progress bar. */
export function Bar({ value, className = "bg-brand", track = "bg-ink/[0.06]" }: { value: number; className?: string; track?: string }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full ${track}`}>
      <motion.div className={`h-full rounded-full ${className}`} initial={false} animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
    </div>
  );
}

/** Circular progress ring. */
export function Ring({ value, size = 96, stroke = 10, color = "#16A34A", track = "#E6F4EA", children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, value))) }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
