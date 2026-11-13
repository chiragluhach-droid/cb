"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Check, Loader2, Plus, RotateCcw, Tag, Trash2, X } from "lucide-react";
import { Card, CardTitle } from "@/components/app/ui";
import { PageTitle } from "@/components/admin/bits";
import { PlanKind, inr } from "@/lib/plans";
import { PlanSettings, Settings, priceFor, reloadSettings, resetSettings, updateSettings, useSaveState, useSettings } from "@/lib/settings";

const input =
  "w-full rounded-xl bg-[#F4F5F1] px-3.5 py-2.5 text-sm text-ink outline-none ring-1 ring-transparent transition-shadow placeholder:text-ink/35 focus:bg-white focus:ring-brand";

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  };
  return (
    <div className="space-y-1.5">
      <AnimatePresence initial={false}>
        {items.map((f, i) => (
          <motion.div key={i} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <Check size={10} strokeWidth={3.5} />
            </span>
            <input value={f} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className={`${input} py-2`} aria-label={`Item ${i + 1}`} />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-red-50 hover:text-red-600">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      <form onSubmit={add} className="flex items-center gap-2 pl-7">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className={`${input} py-2`} />
        <button type="submit" aria-label="Add" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-colors hover:bg-brand">
          <Plus size={14} />
        </button>
      </form>
    </div>
  );
}

function PlanEditor({ kind, s }: { kind: PlanKind; s: Settings }) {
  const p = s.plans[kind];
  const set = (patch: Partial<PlanSettings>) => updateSettings((x) => ({ ...x, plans: { ...x.plans, [kind]: { ...x.plans[kind], ...patch } } }));
  const p90 = priceFor(s, kind, 90);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-ink/40">Plan</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink">{p.name}</p>
        </div>
        <span className="rounded-full bg-mint px-2.5 py-1 text-[0.6875rem] font-semibold text-brand-deep">30 & 90 days</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block rounded-2xl bg-forest p-4 text-canvas">
          <span className="text-[0.6875rem] font-semibold text-canvas/55">Monthly price</span>
          <span className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-sprout">₹</span>
            <input
              type="number"
              min={0}
              step={50}
              value={p.monthly}
              onChange={(e) => set({ monthly: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
              className="w-full bg-transparent text-2xl font-semibold tabular-nums tracking-[-0.04em] text-sprout outline-none"
              aria-label={`${p.name} monthly price`}
            />
          </span>
        </label>
        <div className="rounded-2xl bg-[#F7F8F5] p-4">
          <p className="text-[0.6875rem] font-semibold text-stone">30-day price</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.04em] text-ink">{inr(priceFor(s, kind, 30))}</p>
        </div>
        <div className="rounded-2xl bg-[#F7F8F5] p-4">
          <p className="text-[0.6875rem] font-semibold text-stone">90-day price</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.04em] text-ink">{inr(p90)}</p>
          <p className="text-[0.6875rem] text-brand-deep">saves {inr(p.monthly * 3 - p90)}</p>
        </div>
      </div>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-xs font-semibold text-ink/55">Tagline</span>
        <input value={p.tagline} onChange={(e) => set({ tagline: e.target.value })} className={input} />
      </label>

      <p className="mb-2 mt-5 text-xs font-semibold text-ink/55">What&apos;s included</p>
      <ListEditor items={p.features} onChange={(features) => set({ features })} placeholder="Add a feature" />
    </Card>
  );
}

export default function SubscriptionsPage() {
  const s = useSettings();
  const save = useSaveState();
  // Discount codes are private, so load the coach's full copy.
  useEffect(() => {
    reloadSettings();
  }, []);
  const [code, setCode] = useState("");
  const [pct, setPct] = useState(10);
  const [codeErr, setCodeErr] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const addCode = (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9]{3,16}$/.test(c)) return setCodeErr("Use 3–16 letters or numbers.");
    if (s.codes.some((x) => x.code === c)) return setCodeErr("That code already exists.");
    if (pct < 1 || pct > 90) return setCodeErr("Discount must be 1–90%.");
    updateSettings((x) => ({ ...x, codes: [...x.codes, { code: c, pct, active: true }] }));
    setCode("");
    setCodeErr("");
  };
  const setCodes = (fn: (c: Settings["codes"]) => Settings["codes"]) => updateSettings((x) => ({ ...x, codes: fn(x.codes) }));

  return (
    <div>
      <PageTitle
        eyebrow="Prices, plans and discount codes"
        title="Subscriptions"
        accent="& pricing."
        action={
          <a href="/#pricing" target="_blank" className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-ink/[0.08] transition-colors hover:ring-brand">
            See it on the site <ArrowUpRight size={14} />
          </a>
        }
      />
      <p className="mt-4 flex items-center gap-2 text-xs text-stone">
        {save === "saving" ? (
          <>
            <Loader2 size={13} className="animate-spin text-ink/40" /> Saving…
          </>
        ) : save === "error" ? (
          <span className="flex items-center gap-2 font-semibold text-red-600">
            <AlertTriangle size={13} /> Couldn&apos;t save — check your connection and try again.
          </span>
        ) : (
          <>
            <Check size={13} className="text-brand" /> {save === "saved" ? "Saved." : "Changes save as you type."} They show on the public site within about 30 seconds.
          </>
        )}
      </p>

      {/* Plans */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <PlanEditor kind="meal" s={s} />
        <PlanEditor kind="meal-workout" s={s} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <Card className="lg:col-span-5">
          <CardTitle>90-day extras</CardTitle>
          <p className="mb-3 text-xs text-stone">Shown on both plans when someone picks 90 days. 90 days is priced as two months.</p>
          <ListEditor items={s.ninetyDayExtras} onChange={(ninetyDayExtras) => updateSettings((x) => ({ ...x, ninetyDayExtras }))} placeholder="Add an extra" />
        </Card>

        {/* Codes */}
        <Card className="lg:col-span-7">
          <CardTitle action={<Tag size={15} className="text-ink/35" />}>Discount codes</CardTitle>
          <ul className="space-y-2">
            {s.codes.map((c) => (
              <li key={c.code} className={`flex items-center gap-3 rounded-2xl p-3 transition-colors ${c.active ? "bg-mint/60" : "bg-[#F7F8F5]"}`}>
                <span className={`rounded-lg px-2.5 py-1 font-mono text-sm font-bold tracking-wider ${c.active ? "bg-white text-brand-deep" : "bg-white/70 text-ink/40 line-through"}`}>{c.code}</span>
                <span className="flex items-center gap-1 text-sm font-semibold tabular-nums text-ink">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={c.pct}
                    onChange={(e) => setCodes((cs) => cs.map((x) => (x.code === c.code ? { ...x, pct: Math.min(90, Math.max(1, Number(e.target.value) || 1)) } : x)))}
                    className="w-12 rounded-lg bg-white px-1.5 py-1 text-right outline-none ring-1 ring-ink/10 focus:ring-brand"
                    aria-label={`${c.code} discount percent`}
                  />
                  % off
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <button
                    role="switch"
                    aria-checked={c.active}
                    aria-label={`${c.code} active`}
                    onClick={() => setCodes((cs) => cs.map((x) => (x.code === c.code ? { ...x, active: !x.active } : x)))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${c.active ? "bg-brand" : "bg-ink/15"}`}
                  >
                    <motion.span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" animate={{ left: c.active ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 32 }} />
                  </button>
                  <button onClick={() => setCodes((cs) => cs.filter((x) => x.code !== c.code))} aria-label={`Delete ${c.code}`} className="flex h-8 w-8 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </span>
              </li>
            ))}
            {s.codes.length === 0 && <li className="rounded-2xl bg-[#F7F8F5] px-4 py-5 text-center text-sm text-stone">No codes yet.</li>}
          </ul>
          <form onSubmit={addCode} className="mt-4 flex flex-wrap items-center gap-2">
            <input value={code} onChange={(e) => { setCode(e.target.value); setCodeErr(""); }} placeholder="NEWCODE" className={`${input} min-w-0 flex-1 font-mono uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal`} aria-label="New code" />
            <label className="flex items-center gap-1 text-sm font-semibold text-ink">
              <input type="number" min={1} max={90} value={pct} onChange={(e) => setPct(Number(e.target.value))} className={`${input} w-16 text-right`} aria-label="Percent off" />%
            </label>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-brand">
              <Plus size={14} /> Add code
            </button>
          </form>
          {codeErr && <p className="mt-2 text-xs font-medium text-red-600">{codeErr}</p>}
        </Card>
      </div>

      {/* Reset */}
      <div className="mt-8 flex flex-col gap-3 border-t border-ink/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-stone">Start over with the original prices, plan contents and codes.</p>
        {confirmReset ? (
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 py-1 pl-4 pr-1 text-xs font-semibold text-red-700">
            Reset prices, plans &amp; codes?
            <button
              onClick={() => {
                resetSettings();
                setConfirmReset(false);
              }}
              className="rounded-full bg-red-600 px-3 py-1.5 text-white"
            >
              Reset
            </button>
            <button onClick={() => setConfirmReset(false)} className="rounded-full px-2 py-1.5 text-red-700/70">
              Cancel
            </button>
          </span>
        ) : (
          <button onClick={() => setConfirmReset(true)} className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-ink/70 ring-1 ring-ink/[0.08] transition-colors hover:text-ink">
            <RotateCcw size={13} /> Reset to defaults
          </button>
        )}
      </div>
    </div>
  );
}
