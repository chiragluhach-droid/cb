"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Check, ChevronDown, ChevronUp, EyeOff, Link2, Loader2, Plus, RotateCcw, Tag, Trash2, Video, X } from "lucide-react";
import { Card, CardTitle } from "@/components/app/ui";
import { PageTitle } from "@/components/admin/bits";
import { inr, perMonth, planInfo, planKey } from "@/lib/plans";
import { PlanDef, PlanOption, Settings, reloadSettings, resetSettings, updateSettings, useSaveState, useSettings } from "@/lib/settings";
import { useAdmin } from "@/lib/admin";

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

/** A number box that only saves whole numbers inside the range (so a half-typed value never goes live). */
function NumberField({ value, onChange, min, max, className, label, prefix, suffix }: { value: number; onChange: (n: number) => void; min: number; max: number; className?: string; label: string; prefix?: string; suffix?: string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const n = Number(text);
  const ok = text.trim() !== "" && Number.isInteger(n) && n >= min && n <= max;
  return (
    <label className={`flex items-center gap-1 rounded-xl bg-[#F4F5F1] px-3 ring-1 transition-shadow focus-within:bg-white ${ok ? "ring-transparent focus-within:ring-brand" : "ring-red-400"} ${className ?? ""}`}>
      {prefix && <span className="text-sm font-semibold text-ink/45">{prefix}</span>}
      <input
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d]/g, "");
          setText(t);
          const v = Number(t);
          if (t !== "" && v >= min && v <= max) onChange(v);
        }}
        onBlur={() => setText(String(value))}
        aria-label={label}
        className="w-full min-w-0 bg-transparent py-2.5 text-sm font-semibold tabular-nums text-ink outline-none"
      />
      {suffix && <span className="shrink-0 text-xs font-semibold text-ink/45">{suffix}</span>}
    </label>
  );
}

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors ${on ? "bg-mint/70" : "bg-[#F7F8F5] hover:bg-[#F1F2EE]"}`}>
      <span className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-brand" : "bg-ink/15"}`}>
        <motion.span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" animate={{ left: on ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 32 }} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-stone">{hint}</span>
      </span>
    </button>
  );
}

const PRESETS = [7, 14, 30, 60, 90, 180, 365];
const newId = (name: string, taken: string[]) => {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30)
      .replace(/-+$/g, "") || "plan";
  let id = base;
  for (let i = 2; taken.includes(id); i++) id = `${base}-${i}`;
  return id;
};

function LengthRow({ o, all, onChange, onRemove, canRemove }: { o: PlanOption; all: PlanOption[]; onChange: (o: PlanOption) => void; onRemove: () => void; canRemove: boolean }) {
  const [open, setOpen] = useState(o.perks.length > 0);
  const dup = all.filter((x) => x.days === o.days).length > 1;
  return (
    <motion.li layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl bg-white p-3 ring-1 ring-ink/[0.07]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[6.5rem_8.5rem_1fr_auto]">
        <NumberField value={o.days} min={1} max={730} label="Length in days" suffix="days" onChange={(days) => onChange({ ...o, days })} />
        <NumberField value={o.price} min={0} max={1000000} label="Price" prefix="₹" onChange={(price) => onChange({ ...o, price })} />
        <input value={o.badge} onChange={(e) => onChange({ ...o, badge: e.target.value })} placeholder="Badge, e.g. 3rd month free" className={`${input} col-span-2 sm:col-span-1`} aria-label="Badge" />
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? "Remove this length" : "A plan needs at least one length"}
          className="col-span-2 flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-ink/40 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink/40 sm:col-span-1 sm:w-10"
        >
          <Trash2 size={14} /> <span className="sm:hidden">Remove</span>
        </button>
      </div>
      {dup && <p className="mt-2 text-xs font-medium text-red-600">Two lengths can&apos;t both be {o.days} days.</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-xs">
        <span className="tabular-nums text-stone">≈ {inr(perMonth(o))}/month</span>
        <label className="flex cursor-pointer items-center gap-2 font-semibold text-ink/70">
          <input type="checkbox" checked={o.calls} onChange={(e) => onChange({ ...o, calls: e.target.checked })} className="h-4 w-4 accent-[#16A34A]" />
          <Video size={13} /> 1:1 video calls
        </label>
        <button type="button" onClick={() => setOpen((v) => !v)} className="font-semibold text-brand-deep hover:underline">
          {open ? "Hide extras" : `Extras for this length${o.perks.length ? ` (${o.perks.length})` : ""}`}
        </button>
      </div>
      {open && (
        <div className="mt-3 border-t border-ink/[0.06] pt-3">
          <ListEditor items={o.perks} onChange={(perks) => onChange({ ...o, perks })} placeholder="e.g. Weekly check-in call" />
        </div>
      )}
    </motion.li>
  );
}

function PlanEditor({ plan: p, index, count, clients, startOpen }: { plan: PlanDef; index: number; count: number; clients: number; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const setPlans = (fn: (ps: PlanDef[]) => PlanDef[]) => updateSettings((x) => ({ ...x, plans: fn(x.plans) }));
  const set = (patch: Partial<PlanDef>) => setPlans((ps) => ps.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
  const setOptions = (options: PlanOption[]) => set({ options });
  const move = (dir: -1 | 1) =>
    setPlans((ps) => {
      const a = [...ps];
      const j = index + dir;
      if (j < 0 || j >= a.length) return ps;
      [a[index], a[j]] = [a[j], a[index]];
      return a;
    });
  const unused = PRESETS.filter((d) => !p.options.some((o) => o.days === d));
  const addLength = (days: number) => {
    const ref = p.options[0];
    const price = ref ? Math.round((ref.price / ref.days) * days) : 1499;
    setOptions([...p.options, { days, price, badge: "", perks: [], calls: false }].sort((a, b) => a.days - b.days));
  };
  const longest = [...p.options].sort((a, b) => b.days - a.days)[0];
  const link = typeof window !== "undefined" && longest ? `${window.location.origin}/onboarding?plan=${planKey(p.id, longest.days)}` : "";
  const prices = p.options.map((o) => o.price);

  return (
    <motion.div layout className={`overflow-hidden rounded-[1.75rem] bg-white ring-1 transition-shadow ${p.featured ? "ring-2 ring-brand/40" : "ring-ink/[0.07]"}`}>
      {/* Summary row */}
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <div className="flex flex-col">
          <button type="button" onClick={() => move(-1)} disabled={index === 0} aria-label="Move up" className="flex h-6 w-6 items-center justify-center rounded-md text-ink/40 hover:bg-ink/[0.05] hover:text-ink disabled:opacity-20">
            <ChevronUp size={15} />
          </button>
          <button type="button" onClick={() => move(1)} disabled={index === count - 1} aria-label="Move down" className="flex h-6 w-6 items-center justify-center rounded-md text-ink/40 hover:bg-ink/[0.05] hover:text-ink disabled:opacity-20">
            <ChevronDown size={15} />
          </button>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left" aria-expanded={open}>
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-lg font-semibold tracking-[-0.02em] text-ink">{p.name || "Untitled plan"}</span>
            {p.featured && <span className="rounded-full bg-sprout px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-forest">Most popular</span>}
            {!p.visible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-ink/55">
                <EyeOff size={10} /> Hidden
              </span>
            )}
            {p.workouts && <span className="rounded-full bg-mint px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-brand-deep">+ Workouts</span>}
          </span>
          <span className="mt-0.5 block truncate text-xs text-stone">
            {p.options.map((o) => `${o.days}d`).join(" · ")}
            {prices.length > 0 && ` · ${inr(Math.min(...prices))}${prices.length > 1 ? `–${inr(Math.max(...prices))}` : ""}`}
            {` · ${clients} client${clients === 1 ? "" : "s"}`}
          </span>
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Collapse" : "Expand"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F5F1] text-ink/60">
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-6 border-t border-ink/[0.06] bg-[#FBFBF9] p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink/55">Plan name</span>
                  <input value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. PCOS Care" className={`${input} bg-white text-base font-semibold`} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink/55">Tagline</span>
                  <input value={p.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="One line about who it's for" className={`${input} bg-white`} />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Toggle on={p.visible} onChange={(visible) => set({ visible })} label="Show on website" hint={p.visible ? "On the pricing section and checkout." : "Hidden. The plan link below still works."} />
                <Toggle
                  on={p.featured}
                  onChange={(featured) => setPlans((ps) => ps.map((x) => ({ ...x, featured: x.id === p.id ? featured : featured ? false : x.featured })))}
                  label="Most popular"
                  hint="Highlighted in green. Only one plan at a time."
                />
                <Toggle on={p.workouts} onChange={(workouts) => set({ workouts })} label="Includes workouts" hint="Adds training questions and the Workout tab." />
              </div>

              <div>
                <div className="mb-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Lengths &amp; prices</p>
                    <p className="text-xs text-stone">One-time price for each length. Clients pick one at checkout.</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {p.options.map((o, i) => (
                      <LengthRow
                        key={i}
                        o={o}
                        all={p.options}
                        canRemove={p.options.length > 1}
                        onChange={(next) => setOptions(p.options.map((x, j) => (j === i ? next : x)))}
                        onRemove={() => setOptions(p.options.filter((_, j) => j !== i))}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
                {p.options.length < 6 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-ink/45">Add a length:</span>
                    {unused.map((d) => (
                      <button key={d} type="button" onClick={() => addLength(d)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-ink/10 transition-colors hover:ring-brand">
                        <Plus size={12} /> {d} days
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-ink">What&apos;s included</p>
                <ListEditor items={p.features} onChange={(features) => set({ features })} placeholder="Add a feature" />
              </div>

              <div className="flex flex-col gap-3 border-t border-ink/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
                {link ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(link);
                      } catch {
                        window.prompt("Copy this link:", link);
                      }
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-brand-deep ring-1 ring-ink/10 hover:ring-brand"
                    title={link}
                  >
                    {copied ? <Check size={13} /> : <Link2 size={13} />} {copied ? "Copied" : "Copy sign-up link"}
                  </button>
                ) : (
                  <span />
                )}
                {clients > 0 ? (
                  <p className="text-xs text-stone">
                    {clients} client{clients === 1 ? " is" : "s are"} on this plan, so it can&apos;t be deleted. Switch off &ldquo;Show on website&rdquo; to stop selling it.
                  </p>
                ) : confirmDelete ? (
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 py-1 pl-4 pr-1 text-xs font-semibold text-red-700">
                    Delete {p.name || "this plan"}?
                    <button type="button" onClick={() => setPlans((ps) => ps.filter((x) => x.id !== p.id))} className="rounded-full bg-red-600 px-3 py-1.5 text-white">
                      Delete
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full px-2 py-1.5 text-red-700/70">
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={count <= 1}
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                  >
                    <Trash2 size={13} /> Delete plan
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** "+ New plan": name it, and it starts hidden so it can be finished before going live. */
function NewPlan({ onCreated }: { onCreated: (id: string) => void }) {
  const s = useSettings();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [copyFrom, setCopyFrom] = useState("");
  const full = s.plans.length >= 12;
  const create = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2) return;
    const id = newId(n, s.plans.map((p) => p.id));
    const base = s.plans.find((p) => p.id === copyFrom);
    const plan: PlanDef = base
      ? { ...base, id, name: n, visible: false, featured: false, features: [...base.features], options: base.options.map((o) => ({ ...o, perks: [...o.perks] })) }
      : { id, name: n, tagline: "", features: [], workouts: false, visible: false, featured: false, options: [{ days: 30, price: 1499, badge: "", perks: [], calls: false }] };
    updateSettings((x) => ({ ...x, plans: [...x.plans, plan] }));
    onCreated(id);
    setName("");
    setCopyFrom("");
    setOpen(false);
  };
  if (!open)
    return (
      <button
        type="button"
        disabled={full}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-brand disabled:opacity-40"
        title={full ? "Up to 12 plans" : undefined}
      >
        <Plus size={16} /> New plan
      </button>
    );
  return (
    <motion.form initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} onSubmit={create} className="flex w-full flex-col gap-2 rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/10 sm:flex-row sm:items-center">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Plan name, e.g. PCOS Care" className={`${input} sm:flex-1`} aria-label="New plan name" />
      <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} className={`${input} sm:w-56`} aria-label="Start from">
        <option value="">Start blank</option>
        {s.plans.map((p) => (
          <option key={p.id} value={p.id}>
            Copy of {p.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="submit" disabled={name.trim().length < 2} className="flex-1 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-brand disabled:opacity-40 sm:flex-none">
          Create
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink/55 hover:text-ink">
          Cancel
        </button>
      </div>
    </motion.form>
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
  const [justMade, setJustMade] = useState<string | null>(null);
  const { clients } = useAdmin();
  const clientsOn = (id: string) => clients.filter((c) => planInfo(s.plans, c.user.plan).id === id).length;

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
      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">Plans</h2>
            <p className="mt-1 max-w-xl text-sm text-stone">
              Shown in this order on the website. New plans start hidden, so you can set them up before they go live.
            </p>
          </div>
          <NewPlan onCreated={setJustMade} />
        </div>
        <div className="space-y-3">
          {s.plans.map((p, i) => (
            <PlanEditor key={p.id} plan={p} index={i} count={s.plans.length} clients={clientsOn(p.id)} startOpen={p.id === justMade} />
          ))}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Codes */}
        <Card className="lg:col-span-8">
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
        <p className="text-xs text-stone">Start over with the original two plans, prices and codes. Plans you added are removed.</p>
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
