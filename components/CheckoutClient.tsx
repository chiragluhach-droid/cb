"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Lock, ShieldCheck, Tag } from "lucide-react";
import { canUseApp, logout, reloadSession, useSession } from "@/lib/demo-store";
import { Duration, PlanId, PlanKind, inr } from "@/lib/plans";
import { priceFor, useSettings } from "@/lib/settings";

/*
 * Real checkout (Razorpay Standard Checkout).
 * The server works out the price and creates the order; the browser only opens
 * Razorpay's payment window and hands the result back to /api/pay/verify.
 */

type Props = { initialKind: PlanKind; initialDuration: Duration };

type Quote = { key: string; plan: PlanId; listPrice: number; discount: number; amount: number; code: string | null; pct: number; codeError?: string; paymentsOn: boolean; testMode: boolean };

type RzpSuccess = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RzpInstance = { open: () => void; on: (ev: "payment.failed", cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RzpInstance;
  }
}

let scriptPromise: Promise<boolean> | null = null;
function loadRazorpay() {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
  scriptPromise ??= new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

const post = async (url: string, body: unknown) => {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
};

const field =
  "w-full rounded-2xl bg-white px-4 py-3 text-[0.9375rem] text-ink outline-none ring-1 ring-ink/10 transition-shadow placeholder:text-ink/35 focus:ring-2 focus:ring-brand";

type Phase = "idle" | "starting" | "open" | "verifying" | "pending" | "done";

export default function CheckoutClient({ initialKind, initialDuration }: Props) {
  const router = useRouter();
  const settings = useSettings();
  const { hydrated, user, data } = useSession();
  const [kind, setKind] = useState<PlanKind>(initialKind);
  const [duration, setDuration] = useState<Duration>(initialDuration);
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState("");
  const [q, setQ] = useState<Quote | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [paid, setPaid] = useState<number | null>(null);
  const plan = `${kind}-${duration}` as PlanId;
  const quoteFor = useRef("");

  // Keep the chosen plan in the URL so it survives a refresh.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("plan", plan);
    window.history.replaceState(null, "", url);
  }, [plan]);

  // Guards: sign in first; skip checkout while payments are switched off.
  useEffect(() => {
    if (!hydrated || phase === "done") return;
    if (!user) router.replace(`/login?mode=signup&plan=${plan}`);
    else if (user.access === "open") router.replace(data?.profile ? "/dashboard" : "/onboarding");
  }, [hydrated, user, data?.profile, phase, plan, router]);

  // Server price for this plan + code.
  useEffect(() => {
    if (!user) return;
    const key = `${plan}|${code ?? ""}`;
    quoteFor.current = key;
    post("/api/pay/quote", { plan, code }).then(({ status, json }) => {
      if (quoteFor.current !== key) return;
      if (status !== 200) return setError(String(json.error ?? "Couldn't load the price."));
      const nq = { ...(json as unknown as Quote), key };
      setQ(nq);
      if (code && nq.codeError) {
        setCodeError(nq.codeError);
        setCode(null);
      }
    });
  }, [plan, code, user]);

  // Warm up the payment window so it opens instantly.
  useEffect(() => {
    if (user && user.access !== "open") loadRazorpay();
  }, [user]);

  // Bank still confirming: the webhook will unlock the account; keep checking.
  useEffect(() => {
    if (phase !== "pending") return;
    const t = setInterval(reloadSession, 5000);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (phase === "pending" && user && user.access === "active") setPhase("done");
  }, [phase, user]);

  const fresh = q && q.key === `${plan}|${code ?? ""}` ? q : null;
  const listPrice = fresh?.listPrice ?? priceFor(settings, kind, duration);
  const discount = fresh?.discount ?? 0;
  const total = fresh?.amount ?? listPrice;

  const applyCode = () => {
    const c = codeInput.trim().toUpperCase();
    if (!c) return;
    setCodeError("");
    setCode(c);
  };

  const verify = useCallback(async (r: RzpSuccess, amount: number) => {
    setPhase("verifying");
    const { status, json } = await post("/api/pay/verify", r).catch(() => ({ status: 0, json: {} as Record<string, unknown> }));
    if (json.ok) {
      setPaid(amount);
      await reloadSession();
      setPhase("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (json.pending || status === 0 || status >= 500) {
      setPaid(amount);
      setPhase("pending");
    } else {
      setError(String(json.error ?? "We couldn't confirm that payment."));
      setPhase("idle");
    }
  }, []);

  const pay = async () => {
    if (!user || phase !== "idle") return;
    setError("");
    setPhase("starting");
    const [ready, order] = await Promise.all([loadRazorpay(), post("/api/pay/order", { plan, code }).catch(() => null)]);
    if (!order || order.status !== 200) {
      setError(String(order?.json.error ?? "Couldn't start the payment. Check your connection."));
      return setPhase("idle");
    }
    if (!ready || !window.Razorpay) {
      setError("The payment window didn't load. Turn off any ad blocker for this page and try again.");
      return setPhase("idle");
    }
    const o = order.json as { orderId: string; amount: number; currency: string; keyId: string; prefill: Record<string, string> };
    const rzp = new window.Razorpay({
      key: o.keyId,
      amount: o.amount,
      currency: o.currency,
      order_id: o.orderId,
      name: "Evowell",
      description: `${settings.plans[kind].name} · ${duration} days`,
      prefill: o.prefill,
      notes: { plan },
      theme: { color: "#16A34A" },
      handler: (r: RzpSuccess) => verify(r, o.amount / 100),
      modal: { confirm_close: true, ondismiss: () => setPhase((p) => (p === "open" ? "idle" : p)) },
    });
    rzp.on("payment.failed", (r) => setError(r.error?.description || "The payment didn't go through. Nothing was charged — try again."));
    setPhase("open");
    rzp.open();
  };

  if (!hydrated || !user || user.access === "open") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  if (phase === "done" || phase === "pending") {
    const ready = phase === "done" && canUseApp(user);
    const next = data?.profile ? "/dashboard" : "/onboarding";
    return (
      <div className="container-x">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mx-auto max-w-xl text-center">
          <motion.span
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white ${ready ? "bg-brand shadow-[0_20px_40px_-15px_rgba(22,163,74,0.8)]" : "bg-ink"}`}
          >
            {ready ? <Check size={38} strokeWidth={3} /> : <Loader2 size={32} className="animate-spin" />}
          </motion.span>
          <h1 className="mt-8 font-sans text-[2.75rem] font-normal leading-[1] tracking-[-0.055em] text-ink sm:text-6xl">
            {ready ? (
              <>
                You&apos;re in, <span className="font-serif italic text-brand">{user.name.split(" ")[0]}.</span>
              </>
            ) : (
              <>
                Confirming <span className="font-serif italic text-brand">payment…</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-pretty text-base leading-relaxed text-stone">
            {ready ? (
              <>
                {paid !== null && <>We received {inr(paid)}. </>}
                Your {settings.plans[kind].name} runs until{" "}
                <b className="text-ink">{user.subscription ? new Date(user.subscription.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}</b>.
                {!data?.profile && " Next, a 3-minute questionnaire so Simone can build your plan."}
              </>
            ) : (
              "Your bank is still confirming. Please don't pay again — this page updates on its own, usually within a minute."
            )}
          </p>
          {ready && (
            <Link href={next} className="mt-10 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep">
              {data?.profile ? "Go to your dashboard" : "Start the questionnaire"} <ArrowRight size={16} />
            </Link>
          )}
        </motion.div>
      </div>
    );
  }

  const busy = phase !== "idle";
  const active = user.access === "active" && user.subscription;
  const expiry = (t: number) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="container-x">
      <Link href="/#pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition-colors hover:text-ink">
        <ArrowLeft size={15} /> Back to plans
      </Link>
      <h1 className="mt-6 font-sans text-[2.75rem] font-normal leading-[0.95] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl">
        {user.access === "expired" ? (
          <>
            Pick up <span className="font-serif italic text-brand">where you left off.</span>
          </>
        ) : active ? (
          <>
            Extend your <span className="font-serif italic text-brand">plan.</span>
          </>
        ) : (
          <>
            Almost <span className="font-serif italic text-brand">there.</span>
          </>
        )}
      </h1>
      <p className="mt-4 max-w-lg text-base text-stone">
        {user.access === "expired"
          ? "Your last programme has ended. Renew to unlock your dashboard and coach again — your history is all still here."
          : active
            ? `Your plan runs until ${expiry(user.subscription!.expiresAt)}. Paying now adds ${duration} days after that.`
            : "One payment, then a 3-minute questionnaire. Your coach reviews your plan within 24 hours."}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-10 lg:col-span-7">
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
                    disabled={busy}
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
              {(Object.keys(settings.plans) as PlanKind[]).map((k) => {
                const on = kind === k;
                return (
                  <button
                    type="button"
                    key={k}
                    role="radio"
                    aria-checked={on}
                    disabled={busy}
                    onClick={() => setKind(k)}
                    className={`relative rounded-[1.5rem] p-5 text-left transition-all duration-300 ${on ? "bg-forest text-canvas" : "bg-white text-ink ring-1 ring-ink/10 hover:ring-ink/25"}`}
                  >
                    <span className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 ${on ? "border-sprout bg-sprout text-forest" : "border-ink/20"}`}>
                      {on && <Check size={12} strokeWidth={3.5} />}
                    </span>
                    <span className="block text-lg font-semibold tracking-[-0.02em]">{settings.plans[k].name}</span>
                    <span className={`mt-1 block pr-8 text-sm ${on ? "text-canvas/60" : "text-stone"}`}>{settings.plans[k].tagline}</span>
                    <span className="mt-4 block text-2xl font-semibold tabular-nums tracking-[-0.04em]">{inr(priceFor(settings, k, duration))}</span>
                    {duration === 90 && <span className={`text-xs font-semibold ${on ? "text-sprout" : "text-brand-deep"}`}>3rd month free · video calls included</span>}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-semibold tracking-[-0.03em]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-canvas">2</span>
              Your account
            </h2>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-white p-5 ring-1 ring-ink/10">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{user.name}</p>
                <p className="truncate text-sm text-stone">
                  {user.email} · {user.phone}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await logout();
                  router.push(`/login?plan=${plan}`);
                }}
                className="text-xs font-semibold text-ink/50 underline-offset-2 hover:text-ink hover:underline"
              >
                Not you? Log out
              </button>
            </div>
            <p className="mt-3 text-xs text-ink/45">Your receipt goes to this email. Pay with UPI, card, netbanking or wallet.</p>
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-[2rem] bg-white p-6 ring-1 ring-ink/10 sm:p-7 lg:sticky lg:top-28">
            <div className="flex items-center justify-between">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-ink/45">Order summary</p>
              {fresh?.testMode && <span className="rounded-full bg-warn/20 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#8A5A00]">Test mode</span>}
            </div>
            <div className="mt-4 flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
              <div>
                <p className="text-lg font-semibold tracking-[-0.02em]">{settings.plans[kind].name}</p>
                <p className="text-sm text-stone">{duration}-day programme · one-time</p>
              </div>
              <p className="text-lg font-semibold tabular-nums">{inr(listPrice)}</p>
            </div>

            <ul className="space-y-2 border-b border-ink/10 py-5 text-sm">
              {settings.plans[kind].features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-center gap-2 text-ink/70">
                  <Check size={14} className="shrink-0 text-brand" /> {f}
                </li>
              ))}
              {duration === 90 &&
                settings.ninetyDayExtras.map((f) => (
                  <li key={f} className="flex items-center gap-2 font-semibold text-brand-deep">
                    <Check size={14} className="shrink-0" /> {f}
                  </li>
                ))}
            </ul>

            <div className="border-b border-ink/10 py-5">
              {code && fresh?.code ? (
                <div className="flex items-center justify-between rounded-2xl bg-mint px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-brand-deep">
                    <Tag size={14} /> {fresh.code} · {fresh.pct}% off
                  </span>
                  <button type="button" disabled={busy} onClick={() => setCode(null)} className="text-xs font-semibold text-ink/50 hover:text-ink">
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
                      className={`${field} uppercase placeholder:normal-case`}
                      aria-label="Discount code"
                    />
                    <button type="button" onClick={applyCode} disabled={busy || !!code} className="shrink-0 rounded-2xl bg-ink px-5 text-sm font-semibold text-canvas transition-colors hover:bg-brand disabled:opacity-60">
                      {code ? <Loader2 size={15} className="animate-spin" /> : "Apply"}
                    </button>
                  </div>
                  {codeError && <p className="mt-2 text-xs font-medium text-red-600">{codeError}</p>}
                </>
              )}
            </div>

            <dl className="space-y-2 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="tabular-nums">{inr(listPrice)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-brand-deep">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{inr(discount)}</dd>
                </div>
              )}
              <div className="flex items-end justify-between border-t border-ink/10 pt-4">
                <dt className="font-semibold">Total today</dt>
                <dd className="text-3xl font-semibold tabular-nums tracking-[-0.04em]">{inr(total)}</dd>
              </div>
            </dl>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={pay}
              disabled={busy || !fresh}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-semibold text-canvas transition-colors duration-300 hover:bg-brand disabled:opacity-70"
            >
              {busy || !fresh ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
              {phase === "verifying" ? "Confirming payment…" : phase === "open" ? "Complete payment in the window" : `Pay ${inr(total)}`}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-ink/45">
              <ShieldCheck size={13} /> Secured by Razorpay · pay once, nothing renews automatically
            </p>
            <p className="mt-2 text-center text-[0.6875rem] text-ink/40">
              By paying you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/refunds" className="underline underline-offset-2 hover:text-ink">
                refund policy
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
