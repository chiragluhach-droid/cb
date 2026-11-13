"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertTriangle, Check, PenLine, RotateCcw, Send, ShieldCheck, X } from "lucide-react";
import { Card, CardTitle } from "@/components/app/ui";
import { DishThumb } from "@/components/app/MealRow";
import { planWeekday, slotShare } from "@/components/app/meals";
import { ClientRow, Flag, approvePlan, coachSend, dishChoices, reviewPlan, setPlanEdit } from "@/lib/admin";
import { Slot, portion, servingsLabel } from "@/lib/engine";
import { dayNames } from "@/lib/workouts";
import AiAssistant from "@/components/admin/AiAssistant";

const checklist = [
  { id: "kcal", label: "Calories match the goal" },
  { id: "protein", label: "Protein target met" },
  { id: "portions", label: "Portions realistic for home cooking" },
  { id: "prefs", label: "Client's dislikes respected" },
] as const;

function DishPicker({ row, day, slot, onClose }: { row: ClientRow; day: number; slot: Slot; onClose: () => void }) {
  const profile = row.data.profile!;
  const plan = planWeekday(profile, day, row.data.planEdits);
  const draft = planWeekday(profile, day);
  const current = plan.meals.find((m) => m.slot === slot)!;
  const draftDish = draft.meals.find((m) => m.slot === slot)!.dish;
  const slotKcal = plan.targets.kcal * slotShare(slot);

  const pick = (id: string) => {
    setPlanEdit(row.user.id, day, slot, id === draftDish?.id ? null : id);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-forest/50 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85svh] w-full max-w-lg flex-col rounded-t-[2rem] bg-canvas sm:rounded-[2rem]"
        role="dialog"
        aria-modal="true"
        aria-label="Choose a dish"
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-ink/40">
              {dayNames[day]} · {current.label}
            </p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">Choose a dish</p>
            <p className="text-sm text-stone">~{Math.round(slotKcal)} kcal for this meal. Flagged dishes don&apos;t suit {row.user.name.split(" ")[0]}.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/[0.06]">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 pb-6" data-lenis-prevent>
          {dishChoices(profile, slot).map(({ dish, warning }) => {
            const p = portion(dish, slotKcal);
            const on = current.dish?.id === dish.id;
            return (
              <button
                key={dish.id}
                onClick={() => pick(dish.id)}
                className={`flex w-full items-center gap-3 rounded-2xl p-2.5 pr-4 text-left transition-all ${
                  on ? "bg-forest text-canvas" : warning ? "bg-warn/[0.07] ring-1 ring-warn/30 hover:ring-warn/60" : "bg-white ring-1 ring-ink/[0.06] hover:ring-brand"
                }`}
              >
                <DishThumb dish={dish} size="h-12 w-12" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{dish.name}</span>
                  <span className={`block text-xs ${on ? "text-canvas/55" : "text-stone"}`}>
                    {servingsLabel(p.servings)} · {p.kcal} kcal · {p.protein}g protein
                  </span>
                  {warning && (
                    <span className={`mt-0.5 flex items-center gap-1 text-xs font-semibold ${on ? "text-warn" : "text-[#8A5A00]"}`}>
                      <AlertTriangle size={11} /> {warning}
                    </span>
                  )}
                </span>
                {draftDish?.id === dish.id && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] font-bold ${on ? "bg-canvas/10 text-canvas/70" : "bg-ink/[0.05] text-ink/50"}`}>Draft</span>}
                {on && <Check size={16} className="shrink-0 text-sprout" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PlanReview({ row }: { row: ClientRow }) {
  const profile = row.data.profile!;
  const first = row.user.name.split(" ")[0];
  const { days, flags, totals, targets } = reviewPlan(profile, row.data.planEdits);
  const approved = row.data.planStatus === "approved";

  const [sel, setSel] = useState(() => (flags.length ? flags[0].day : 0));
  const [picker, setPicker] = useState<Slot | null>(null);
  const [ticked, setTicked] = useState<string[]>([]);
  const [note, setNote] = useState(`Hi ${first}, your plan is approved ✓ I've built it around ${profile.diet === "nonveg" ? "your usual meals" : "the food you already eat"} — tick meals off as you go and message me anytime.`);
  const [sent, setSent] = useState(false);

  const day = days[sel];
  const tot = totals[sel];
  const dayFlags = (d: number, s?: Slot) => flags.filter((f) => f.day === d && (!s || f.slot === s));
  const offDays = totals.filter((t) => !t.kcalOk).length;
  const lowDays = totals.filter((t) => !t.proteinOk).length;
  const edits = Object.keys(row.data.planEdits ?? {}).length;
  const ready = flags.length === 0 && ticked.length === checklist.length;

  const hint: Record<string, { ok: boolean; text: string }> = {
    kcal: { ok: offDays === 0, text: offDays ? `${offDays} day${offDays === 1 ? "" : "s"} more than 12% off ${targets.kcal} kcal` : `All 7 days within 12% of ${targets.kcal} kcal` },
    protein: { ok: lowDays === 0, text: lowDays ? `${lowDays} day${lowDays === 1 ? "" : "s"} under 85% of ${targets.protein}g` : `All 7 days at ${targets.protein}g or close` },
    portions: { ok: true, text: "Servings are in quarter steps, ¾ to 2 per meal" },
    prefs: { ok: !flags.some((f) => f.reason.startsWith("client dislikes")), text: profile.dislikes.trim() ? `Dislikes: ${profile.dislikes.trim()}` : "No dislikes given" },
  };

  const approve = () => {
    approvePlan(row.user.id, note);
    setTicked([]);
  };
  const sendUpdate = () => {
    coachSend(row.user.id, note.trim() || `I've updated your plan, ${first} — have a look in My plan.`);
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <div className="space-y-4 lg:col-span-8 lg:space-y-6">
        {approved && (
          <div className="flex items-start gap-3 rounded-[1.5rem] bg-mint p-4 text-brand-deep sm:items-center">
            <ShieldCheck size={20} className="shrink-0" />
            <p className="text-sm">
              <b>Approved{row.data.approvedAt ? ` on ${new Date(row.data.approvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}.</b> Changes you make here go straight to {first}&apos;s plan — send a note so they know.
            </p>
          </div>
        )}

        {/* Week strip */}
        <LayoutGroup id={`review-${row.user.id}`}>
          <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-7 sm:px-0">
            {dayNames.map((n, i) => {
              const on = i === sel;
              const f = dayFlags(i).length;
              const t = totals[i];
              return (
                <button
                  key={n}
                  onClick={() => setSel(i)}
                  aria-pressed={on}
                  className={`relative flex min-w-[3.75rem] shrink-0 flex-col items-center gap-1 rounded-2xl py-3 transition-colors ${on ? "text-canvas" : "bg-white text-ink ring-1 ring-ink/[0.06] hover:ring-ink/20"}`}
                >
                  {on && <motion.span layoutId="review-day" className="absolute inset-0 rounded-2xl bg-forest" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
                  <span className={`relative text-[0.6875rem] font-semibold ${on ? "text-canvas/60" : "text-ink/45"}`}>{n}</span>
                  <span className={`relative text-xs font-semibold tabular-nums ${on ? "text-canvas" : "text-ink/70"}`}>{t.kcal}</span>
                  <span
                    className={`relative flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[0.625rem] font-bold ${
                      f ? "bg-warn text-forest" : t.kcalOk && t.proteinOk ? (on ? "bg-sprout text-forest" : "bg-mint text-brand") : on ? "bg-canvas/15 text-canvas" : "bg-ink/[0.06] text-ink/50"
                    }`}
                  >
                    {f ? f : <Check size={11} strokeWidth={3.5} />}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <Card>
          <CardTitle
            action={
              <span className={`text-xs font-semibold tabular-nums ${tot.kcalOk && tot.proteinOk ? "text-brand-deep" : "text-[#8A5A00]"}`}>
                {tot.kcal} / {targets.kcal} kcal · {tot.protein} / {targets.protein}g
              </span>
            }
          >
            {dayNames[sel]} · day {sel + 1}
          </CardTitle>
          <motion.ul key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-2">
            {day.meals.map((m) => {
              const f = dayFlags(sel, m.slot);
              return (
                <li key={m.slot} className={`flex items-center gap-3 rounded-2xl p-2.5 sm:p-3 ${f.length ? "bg-warn/[0.08] ring-1 ring-warn/40" : "bg-[#F7F8F5]"}`}>
                  <DishThumb dish={m.dish} size="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6875rem] font-semibold text-ink/45">
                      {m.label} · {m.time}
                      {m.edited &&
                        (row.data.aiDraft?.picks[`${sel}-${m.slot}`] === m.dish?.id ? (
                          <span className="ml-1.5 rounded-full bg-sprout px-1.5 py-px text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-forest">AI</span>
                        ) : (
                          <span className="ml-1.5 rounded-full bg-forest px-1.5 py-px text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-sprout">Edited</span>
                        ))}
                    </p>
                    <p className="truncate text-sm font-semibold text-ink sm:text-[0.9375rem]">{m.dish?.name ?? "Nothing fits — choose a dish"}</p>
                    <p className="text-xs text-stone">
                      {m.dish ? `${servingsLabel(m.servings)} · ${m.kcal} kcal · ${m.protein}g protein` : ""}
                    </p>
                    {f.map((x: Flag) => (
                      <p key={x.reason} className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#8A5A00]">
                        <AlertTriangle size={11} /> {x.reason}
                      </p>
                    ))}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                    <button onClick={() => setPicker(m.slot)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${f.length ? "bg-ink text-canvas hover:bg-brand" : "bg-white text-ink ring-1 ring-ink/10 hover:ring-ink/30"}`}>
                      <PenLine size={12} /> {f.length ? "Fix" : "Change"}
                    </button>
                    {m.edited && (
                      <button onClick={() => setPlanEdit(row.user.id, sel, m.slot, null)} aria-label="Back to draft dish" className="inline-flex items-center justify-center gap-1 rounded-full px-2 py-1 text-[0.6875rem] font-semibold text-ink/45 hover:text-ink">
                        <RotateCcw size={11} /> Draft
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </motion.ul>
          <p className="mt-4 text-xs text-stone">
            The engine drafted this from {first}&apos;s answers. {edits ? `${edits} meal${edits === 1 ? "" : "s"} changed from the draft.` : "No changes yet."}
          </p>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-4 lg:space-y-6">
        <Card className="bg-forest text-canvas ring-0">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-canvas/50">Daily targets</p>
          <p className="mt-2 text-4xl font-semibold tabular-nums tracking-[-0.05em] text-sprout">{targets.kcal.toLocaleString("en-IN")}</p>
          <p className="text-sm text-canvas/55">kcal · Mifflin–St Jeor × activity × goal</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              ["Protein", targets.protein],
              ["Carbs", targets.carbs],
              ["Fat", targets.fat],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-canvas/[0.06] py-3">
                <p className="text-lg font-semibold tabular-nums">{v}g</p>
                <p className="text-[0.6875rem] text-canvas/50">{l}</p>
              </div>
            ))}
          </div>
        </Card>

        <AiAssistant row={row} />

        <Card>
          <CardTitle action={flags.length ? <AlertTriangle size={15} className="text-warn" /> : <ShieldCheck size={15} className="text-brand" />}>Risk check</CardTitle>
          {flags.length ? (
            <ul className="space-y-1.5">
              {flags.map((f) => (
                <li key={`${f.day}-${f.slot}-${f.reason}`}>
                  <button
                    onClick={() => {
                      setSel(f.day);
                      setPicker(f.slot);
                    }}
                    className="w-full rounded-2xl bg-warn/[0.08] px-3 py-2.5 text-left text-sm transition-colors hover:bg-warn/15"
                  >
                    <span className="block font-semibold text-ink">
                      {dayNames[f.day]} · <span className="capitalize">{f.slot}</span>
                    </span>
                    <span className="block text-xs text-[#8A5A00]">
                      {f.dish} — {f.reason}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-start gap-2 text-sm text-brand-deep">
              <Check size={15} className="mt-0.5 shrink-0" /> No allergens, condition clashes or disliked foods in the week.
            </p>
          )}
        </Card>

        <Card>
          <CardTitle>{approved ? "Send a plan update" : "Checklist & approve"}</CardTitle>
          {!approved && (
            <ul className="mb-4 space-y-1.5">
              {checklist.map((c) => {
                const on = ticked.includes(c.id);
                const h = hint[c.id];
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setTicked((t) => (on ? t.filter((x) => x !== c.id) : [...t, c.id]))}
                      aria-pressed={on}
                      className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${on ? "bg-mint/70" : "hover:bg-ink/[0.03]"}`}
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${on ? "border-brand bg-brand text-white" : "border-ink/20"}`}>
                        {on && <Check size={11} strokeWidth={3.5} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{c.label}</span>
                        <span className={`block text-xs ${h.ok ? "text-stone" : "font-semibold text-[#8A5A00]"}`}>{h.text}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/55">Note to {first}</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl bg-[#F4F5F1] px-4 py-3 text-sm leading-relaxed text-ink outline-none ring-1 ring-transparent focus:ring-brand"
            />
          </label>
          {approved ? (
            <button onClick={sendUpdate} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-canvas transition-colors hover:bg-brand">
              {sent ? <Check size={15} /> : <Send size={14} />} {sent ? "Sent to " + first : "Send note"}
            </button>
          ) : (
            <button
              onClick={approve}
              disabled={!ready}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-colors ${
                ready ? "bg-brand text-white hover:bg-brand-deep" : "cursor-not-allowed bg-ink/[0.06] text-ink/40"
              }`}
            >
              <ShieldCheck size={15} />
              {ready
                ? `Approve & send to ${first}`
                : flags.length
                  ? `Fix ${flags.length} flag${flags.length === 1 ? "" : "s"} first`
                  : `Tick ${checklist.length - ticked.length} more check${checklist.length - ticked.length === 1 ? "" : "s"}`}
            </button>
          )}
        </Card>
      </div>

      <AnimatePresence>{picker && <DishPicker row={row} day={sel} slot={picker} onClose={() => setPicker(null)} />}</AnimatePresence>
    </div>
  );
}

