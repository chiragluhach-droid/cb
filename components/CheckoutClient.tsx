"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowLeft, Check, CreditCard, Landmark, Loader2, Lock, Smartphone, Tag, X } from "lucide-react";
import { Duration, PlanKind, inr } from "@/lib/plans";
import { findCode, priceFor, useSettings } from "@/lib/settings";

type Mode = "free" | "paid";
/** `mode` previews a checkout mode; without it the Admin › Subscriptions setting applies. */
type Props = { initialKind: PlanKind; initialDuration: Duration; mode?: Mode };

const field =
  "w-full rounded-2xl bg-white px-4 py-3.5 text-[0.9375rem] text-ink outline-none ring-1 ring-ink/10 transition-shadow placeholder:text-ink/35 focus:ring-2 focus:ring-brand";

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 block text-xs font-medium text-red-600">
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

/* ───────────── Demo payment sheet (paid mode) ───────────── */

function PaySheet({ amount, onClose, onResult }: { amount: number; onClose: () => void; onResult: (ok: boolean) => void }) {
  const [method, setMethod] = useState<"upi" | "card" | "bank">("upi");
  const [busy, setBusy] = useState<null | boolean>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && busy === null && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [busy, onClose]);

  const simulate = (ok: boolean) => {
    setBusy(ok);
    setTimeout(() => onResult(ok), 1400);
  };

  const methods = [
    { id: "upi" as const, label: "UPI", icon: Smartphone },
    { id: "card" as const, label: "Card", icon: CreditCard },
    { id: "bank" as const, label: "Netbanking", icon: Landmark },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => busy === null && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Demo payment"
      data-lenis-prevent
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[2rem] bg-canvas p-6 sm:rounded-[2rem]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-warn/20 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[#8A5A00]">Demo payment</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.04em]">{inr(amount)}</p>
            <p className="text-sm text-stone">Evowell Nutrition & Training</p>
          </div>
          <button onClick={onClose} disabled={busy !== null} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.06] disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <LayoutGroup id="pay-method">
          <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-ink/[0.05] p-1">
            {methods.map((m) => {
              const Icon = m.icon;
              const on = method === m.id;
              return (
                <button key={m.id} onClick={() => setMethod(m.id)} className={`relative flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-semibold ${on ? "text-ink" : "text-ink/50"}`}>
                  {on && <motion.span layoutId="pay-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm" />}
                  <Icon size={17} className="relative" />
                  <span className="relative">{m.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-ink/60 ring-1 ring-ink/10">
          {method === "upi" && "UPI ID: yourname@upi"}
          {method === "card" && "Card: 4111 1111 1111 1111 · 12/30 · 123"}
          {method === "bank" && "Bank: Choose your bank"}
          <span className="mt-1 block text-xs text-ink/40">Placeholder fields — nothing here is sent anywhere.</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={() => simulate(false)}
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 rounded-full bg-ink/[0.06] py-3.5 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {busy === false ? <Loader2 size={15} className="animate-spin" /> : null}
            Simulate failure
          </button>
          <button
            onClick={() => simulate(true)}
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === true ? <Loader2 size={15} className="animate-spin" /> : <Lock size={14} />}
            Simulate success
          </button>
        </div>
        <p className="mt-4 text-center text-xs leading-relaxed text-ink/45">
          This is a dummy payment screen. No money moves. The real payment gateway and its webhook get connected later.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ───────────── Success ───────────── */

function Success({ name, email, phone, planId, planName, duration, orderId, free }: { name: string; email: string; phone: string; planId: string; planName: string; duration: Duration; orderId: string; free: boolean }) {
  const steps = [
    { t: "Create your account", s: "Verify your email and mobile number — takes a minute." },
    { t: "Answer the questionnaire", s: "Measurements, goal, diet, health and allergies — about 3 minutes." },
    { t: "Your coach reviews your plan", s: "Ready within 24 hours, then follow it on your dashboard." },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mx-auto max-w-2xl text-center">
      <motion.span
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand text-white shadow-[0_20px_40px_-15px_rgba(22,163,74,0.8)]"
      >
        <Check size={38} strokeWidth={3} />
      </motion.span>
      <h1 className="mt-8 font-sans text-5xl font-normal tracking-[-0.055em] text-ink sm:text-6xl">
        You&apos;re in, <span className="font-serif italic text-brand">{name.split(" ")[0]}.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-md text-pretty text-base leading-relaxed text-stone">
        {planName} · {duration} days {free ? "· early access" : "· paid"}. We&apos;ve noted {email} — this is a demo, so no email is actually sent.
      </p>
      <p className="mt-2 text-xs tabular-nums text-ink/40">Order {orderId}</p>

      <ol className="mx-auto mt-10 max-w-md space-y-3 text-left">
        {steps.map((s, i) => (
          <motion.li
            key={s.t}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.12 }}
            className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/10"
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-ink text-canvas" : "bg-ink/[0.06] text-ink/50"}`}>{i + 1}</span>
            <span>
              <span className="block font-semibold text-ink">{s.t}</span>
              <span className="block text-sm text-stone">{s.s}</span>
            </span>
          </motion.li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href={`/login?${new URLSearchParams({ mode: "signup", plan: planId, name, email, phone }).toString()}`}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
        >
          Create your account
        </Link>
        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-canvas transition-colors hover:bg-brand">
          Back to home
        </Link>
      </div>
    </motion.div>
  );
}

/* ───────────── Checkout ───────────── */

export default function CheckoutClient({ initialKind, initialDuration, mode }: Props) {
  const settings = useSettings();
  const plans = settings.plans;
  const ninetyDayExtras = settings.ninetyDayExtras;
  const free = (mode ?? settings.checkout) === "free";
  const [kind, setKind] = useState<PlanKind>(initialKind);
  const [duration, setDuration] = useState<Duration>(initialDuration);
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "India" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payFailed, setPayFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const price = priceFor(settings, kind, duration);
  const codeInfo = code ? findCode(settings, code) : null;
  const discount = codeInfo ? Math.round((price * codeInfo.pct) / 100) : 0;
  const afterDiscount = price - discount;
  const total = free ? 0 : afterDiscount;

  // Keep the URL in sync so the chosen plan survives a refresh.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("plan", `${kind}-${duration}`);
    window.history.replaceState(null, "", url);
  }, [kind, duration]);

  const applyCode = () => {
    const c = codeInput.trim().toUpperCase();
    if (!c) return;
    if (findCode(settings, c)) {
      setCode(c);
      setCodeError("");
    } else {
      setCode(null);
      setCodeError("That code isn't valid or has expired.");
    }
  };

  const validate = () => {
    const e: typeof errors = {};
    if (form.name.trim().length < 2) e.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email.";
    if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Please enter a phone number with at least 10 digits.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const finish = () => setOrderId(`EVO-${Date.now().toString(36).toUpperCase().slice(-6)}`);

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    setPayFailed(false);
    if (!validate()) return;
    if (free) {
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        finish();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 900);
    } else {
      setPaying(true);
    }
  };

  if (orderId) {
    return (
      <div className="container-x">
        <Success name={form.name.trim()} email={form.email} phone={form.phone} planId={`${kind}-${duration}`} planName={plans[kind].name} duration={duration} orderId={orderId} free={free} />
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  return (
    <div className="container-x">
      <Link href="/#pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition-colors hover:text-ink">
        <ArrowLeft size={15} /> Back to plans
      </Link>
      <h1 className="mt-6 font-sans text-[12vw] font-normal leading-[0.95] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl">
        {free ? (
          <>
            Claim your <span className="font-serif italic text-brand">early access.</span>
          </>
        ) : (
          <>
            Almost <span className="font-serif italic text-brand">there.</span>
          </>
        )}
      </h1>
      {free && <p className="mt-4 max-w-lg text-base text-stone">Checkout is free while we&apos;re in early access. No card needed.</p>}

      <form onSubmit={submit} noValidate className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-10 lg:col-span-7">
          {/* 1. Plan */}
          <section>
            <h2 className="flex items-center gap-3 text-xl font-semibold tracking-[-0.03em]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-canvas">1</span>
              Choose your plan
            </h2>
            <LayoutGroup id="co-dur">
              <div className="mt-5 inline-flex rounded-full bg-ink/[0.05] p-1" role="radiogroup" aria-label="Programme length">
                {([30, 90] as Duration[]).map((d) => (
                  <button
                    type="button"
                    key={d}
                    role="radio"
                    aria-checked={duration === d}
                    onClick={() => setDuration(d)}
                    className={`relative rounded-full px-5 py-2 text-sm font-semibold ${duration === d ? "text-canvas" : "text-ink/60"}`}
                  >
                    {duration === d && <motion.span layoutId="co-dur-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <span className="relative">{d} days</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Plan">
              {(Object.keys(plans) as PlanKind[]).map((k) => {
                const on = kind === k;
                return (
                  <button
                    type="button"
                    key={k}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setKind(k)}
                    className={`relative rounded-[1.5rem] p-5 text-left transition-all duration-300 ${on ? "bg-forest text-canvas" : "bg-white text-ink ring-1 ring-ink/10 hover:ring-ink/25"}`}
                  >
                    <span className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 ${on ? "border-sprout bg-sprout text-forest" : "border-ink/20"}`}>
                      {on && <Check size={12} strokeWidth={3.5} />}
                    </span>
                    <span className="block text-lg font-semibold tracking-[-0.02em]">{plans[k].name}</span>
                    <span className={`mt-1 block pr-8 text-sm ${on ? "text-canvas/60" : "text-stone"}`}>{plans[k].tagline}</span>
                    <span className="mt-4 block text-2xl font-semibold tabular-nums tracking-[-0.04em]">{inr(priceFor(settings, k, duration))}</span>
                    {duration === 90 && <span className={`text-xs font-semibold ${on ? "text-sprout" : "text-brand-deep"}`}>3rd month free · video calls included</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Details */}
          <section>
            <h2 className="flex items-center gap-3 text-xl font-semibold tracking-[-0.03em]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-canvas">2</span>
              Your details
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Full name" error={errors.name}>
                  <input className={field} value={form.name} onChange={set("name")} placeholder="Aanya Sharma" autoComplete="name" />
                </Field>
              </div>
              <Field label="Email" error={errors.email}>
                <input className={field} type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
              </Field>
              <Field label="Phone / WhatsApp" error={errors.phone}>
                <input className={field} type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" autoComplete="tel" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Country">
                  <select className={field} value={form.country} onChange={set("country")}>
                    {["India", "United Arab Emirates", "United Kingdom", "United States", "Canada", "Australia", "Singapore", "Other"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink/45">Demo form — nothing is stored or sent yet. The questionnaire comes after checkout.</p>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-5">
          <div className="rounded-[2rem] bg-white p-6 ring-1 ring-ink/10 lg:sticky lg:top-28 sm:p-7">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-ink/45">Order summary</p>
            <div className="mt-4 flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
              <div>
                <p className="text-lg font-semibold tracking-[-0.02em]">{plans[kind].name}</p>
                <p className="text-sm text-stone">{duration}-day programme · one-time</p>
              </div>
              <p className="text-lg font-semibold tabular-nums">{inr(price)}</p>
            </div>

            <ul className="space-y-2 border-b border-ink/10 py-5 text-sm">
              {plans[kind].features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-center gap-2 text-ink/70">
                  <Check size={14} className="text-brand" /> {f}
                </li>
              ))}
              {duration === 90 &&
                ninetyDayExtras.map((f) => (
                  <li key={f} className="flex items-center gap-2 font-semibold text-brand-deep">
                    <Check size={14} /> {f}
                  </li>
                ))}
            </ul>

            {/* Discount code */}
            <div className="border-b border-ink/10 py-5">
              {codeInfo ? (
                <div className="flex items-center justify-between rounded-2xl bg-mint px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-brand-deep">
                    <Tag size={14} /> {codeInfo.code} · {codeInfo.pct}% off
                  </span>
                  <button type="button" onClick={() => setCode(null)} className="text-xs font-semibold text-ink/50 hover:text-ink">
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value);
                        setCodeError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyCode();
                        }
                      }}
                      placeholder="Discount code"
                      className={`${field} py-3 uppercase placeholder:normal-case`}
                      aria-label="Discount code"
                    />
                    <button type="button" onClick={applyCode} className="shrink-0 rounded-2xl bg-ink px-5 text-sm font-semibold text-canvas transition-colors hover:bg-brand">
                      Apply
                    </button>
                  </div>
                  {codeError && <p className="mt-2 text-xs font-medium text-red-600">{codeError}</p>}
                </>
              )}
            </div>

            <dl className="space-y-2 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="tabular-nums">{inr(price)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-brand-deep">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{inr(discount)}</dd>
                </div>
              )}
              {free && (
                <div className="flex justify-between text-brand-deep">
                  <dt>Early access</dt>
                  <dd className="tabular-nums">−{inr(afterDiscount)}</dd>
                </div>
              )}
              <div className="flex items-end justify-between border-t border-ink/10 pt-4">
                <dt className="font-semibold">Total today</dt>
                <dd className="text-3xl font-semibold tabular-nums tracking-[-0.04em]">{inr(total)}</dd>
              </div>
            </dl>

            <AnimatePresence>
              {payFailed && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  Payment didn&apos;t go through (simulated). Nothing was charged — try again.
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-semibold text-canvas transition-colors duration-300 hover:bg-brand disabled:opacity-70"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
              {free ? "Claim early access · ₹0" : `Pay ${inr(total)}`}
            </button>
            <p className="mt-3 text-center text-xs text-ink/45">Pay once. Nothing renews automatically.</p>
          </div>
        </aside>
      </form>

      <AnimatePresence>
        {paying && (
          <PaySheet
            amount={total}
            onClose={() => setPaying(false)}
            onResult={(ok) => {
              setPaying(false);
              if (ok) {
                finish();
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else setPayFailed(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
