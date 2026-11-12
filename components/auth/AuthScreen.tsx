"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronDown, Loader2, Mail, Phone, ShieldCheck, Sparkles, User } from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { SealLogo } from "@/components/brand/SealLogo";
import { RingMark } from "@/components/brand/Marks";
import { Seal } from "@/components/brand/Seal";
import { photos, unsplash } from "@/lib/site";
import { PlanId, parsePlan, plans } from "@/lib/plans";
import { DEMO_OTP, checkLogin, checkSignup, completeLogin, completeSignup, maskPhone, useSession } from "@/lib/demo-store";

type Mode = "login" | "signup";
type Props = { initialMode: Mode; plan: string | null; name: string; email: string; phone: string; next: string | null };

const EASE = [0.16, 1, 0.3, 1] as const;

const dials = [
  { code: "+91", label: "IN", digits: 10 },
  { code: "+971", label: "AE", digits: 9 },
  { code: "+44", label: "UK", digits: 10 },
  { code: "+1", label: "US", digits: 10 },
  { code: "+61", label: "AU", digits: 9 },
  { code: "+65", label: "SG", digits: 8 },
];

const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const validPhone = (dial: string, n: string) => (dial === "+91" ? /^[6-9]\d{9}$/.test(n) : /^\d{7,11}$/.test(n));

/* ───────────── Pieces ───────────── */

function Field({ label, icon, error, children }: { label: string; icon: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <span
        className={`flex h-14 items-center gap-3 rounded-2xl bg-white px-4 ring-1 transition-shadow focus-within:ring-2 ${
          error ? "ring-red-400 focus-within:ring-red-500" : "ring-ink/10 focus-within:ring-brand"
        }`}
      >
        <span className={error ? "text-red-500" : "text-ink/35"}>{icon}</span>
        {children}
      </span>
      <AnimatePresence>
        {error && (
          <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="block overflow-hidden">
            <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

const inputCls = "h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/30";

/** Six boxes; typing advances, backspace goes back, pasting fills all. */
function OtpInput({ value, onChange, error, disabled }: { value: string; onChange: (v: string) => void; error: boolean; disabled: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    refs.current[Math.min(value.length, 5)]?.focus();
    // focus the next empty box whenever the value changes
  }, [value.length]);

  const setAt = (i: number, ch: string) => {
    const arr = value.padEnd(6, " ").split("");
    arr[i] = ch;
    onChange(arr.join("").replace(/\s+$/g, "").replace(/\s/g, ""));
  };
  const onKey = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) setAt(i, "");
      else if (i > 0) {
        onChange(value.slice(0, i - 1));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (digits) {
      e.preventDefault();
      onChange(digits);
    }
  };

  return (
    <motion.div className="grid grid-cols-6 gap-2 sm:gap-3" animate={error ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const ch = value[i] ?? "";
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled}
            value={ch}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(-1);
              if (!d) return;
              if (i > value.length) onChange((value + d).slice(0, 6));
              else setAt(i, d);
            }}
            onKeyDown={onKey(i)}
            onPaste={onPaste}
            className={`aspect-[4/5] w-full rounded-2xl bg-white text-center text-2xl font-semibold tabular-nums text-ink outline-none ring-1 transition-all focus:ring-2 sm:text-3xl ${
              error ? "ring-red-400 focus:ring-red-500" : ch ? "ring-brand/50 focus:ring-brand" : "ring-ink/10 focus:ring-brand"
            }`}
          />
        );
      })}
    </motion.div>
  );
}

/* ───────────── Visual panel ───────────── */

const orbit = [
  { img: photos.idliLeaf, cls: "left-[6%] top-[14%] w-[22%]", d: 3.4 },
  { img: photos.palakPaneer, cls: "right-[4%] top-[8%] w-[26%]", d: 4 },
  { img: photos.khichdi, cls: "right-[10%] bottom-[10%] w-[20%]", d: 3.1 },
  { img: photos.rotiSabzi, cls: "left-[12%] bottom-[6%] w-[18%]", d: 3.7 },
];

function VisualPanel({ mode }: { mode: Mode }) {
  return (
    <div className="relative isolate flex h-full flex-col overflow-hidden bg-forest px-8 py-10 text-canvas xl:px-14 xl:py-12">
      <div aria-hidden className="absolute -right-32 -top-32 -z-10 h-[36rem] w-[36rem] rounded-full bg-brand/25 blur-3xl" />
      <Link href="/" aria-label="Evowell home" className="w-fit">
        <SealLogo tone="dark" alwaysWordmark />
      </Link>

      {/* Ring + floating katoris */}
      <div aria-hidden className="relative mx-auto my-8 aspect-square w-full max-w-[26rem] flex-1">
        {/* The ring's centre sits at (29, 32) in RingMark's 64-unit box, so the box is nudged right
            by 3/64 of its width to put the ring dead-centre, and it spins around that same point. */}
        <div className="absolute bottom-[12%] left-[15.56%] right-[8.44%] top-[12%]">
          <motion.div className="h-full w-full" style={{ originX: 29 / 64, originY: 0.5 }} animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
            <RingMark className="h-full w-full" ink="#8AF0A0" leaf="#FAFAF8" track="rgba(250,250,248,0.07)" vein="#16A34A" />
          </motion.div>
        </div>
        {orbit.map((o, i) => (
          <div key={o.img} className={`absolute aspect-square ${o.cls}`}>
            <motion.div
              className="relative h-full w-full overflow-hidden rounded-full shadow-[0_20px_40px_-18px_rgba(0,0,0,0.8)] ring-4 ring-forest-2"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0, y: [0, -8, 0] }}
              transition={{ scale: { type: "spring", stiffness: 220, damping: 16, delay: 0.2 + i * 0.1 }, rotate: { delay: 0.2 + i * 0.1 }, y: { duration: o.d, repeat: Infinity, ease: "easeInOut" } }}
            >
              <Image src={unsplash(o.img, 300)} alt="" fill sizes="140px" className="object-cover" />
            </motion.div>
          </div>
        ))}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* The ring's hole is ~31% of this box wide; 27% leaves a little breathing room. */}
          <Seal className="h-[27%] w-[27%]" color="#FAFAF8" spin="reverse" />
        </motion.div>
      </div>

      <>
        <motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE }}>
          <h2 className="font-sans text-4xl font-medium leading-[1] tracking-[-0.055em] xl:text-5xl">
            {mode === "login" ? (
              <>
                Your plan is <span className="font-serif italic text-sprout">waiting.</span>
              </>
            ) : (
              <>
                Eat better, <span className="font-serif italic text-sprout">not different.</span>
              </>
            )}
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Coach-reviewed", "Built from ghar ka khana", "Updates as you progress"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-canvas/[0.07] px-3 py-1.5 text-xs font-medium text-canvas/80 ring-1 ring-canvas/10">
                <Check size={12} className="text-sprout" strokeWidth={3} /> {t}
              </span>
            ))}
          </div>
        </motion.div>
      </>
    </div>
  );
}

/* ───────────── Screen ───────────── */

type Step = "details" | "otp" | "done";

export default function AuthScreen(props: Props) {
  const router = useRouter();
  const { hydrated, user, data } = useSession();

  const [mode, setMode] = useState<Mode>(props.initialMode);
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState(props.name);
  const [email, setEmail] = useState(props.email);
  const [dial, setDial] = useState("+91");
  const [num, setNum] = useState(props.phone);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [formError, setFormError] = useState<{ text: string; switchTo?: Mode } | null>(null);
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [justSent, setJustSent] = useState(false);

  const planId = (() => {
    const p = parsePlan(props.plan);
    return `${p.kind}-${p.duration}` as PlanId;
  })();
  const planInfo = parsePlan(planId);
  const dialInfo = dials.find((d) => d.code === dial) ?? dials[0];
  const fullPhone = `${dial}${num}`;

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep("details");
    setErrors({});
    setFormError(null);
    setOtp("");
  };

  const sendCode = (e: FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (mode === "signup" && name.trim().length < 2) er.name = "Please enter your full name.";
    if (!validEmail(email)) er.email = "Enter a valid email address.";
    if (!validPhone(dial, num)) er.phone = dial === "+91" ? "Enter a 10-digit Indian mobile number." : "Enter a valid mobile number.";
    setErrors(er);
    setFormError(null);
    if (Object.keys(er).length) return;

    const res = mode === "signup" ? checkSignup(email, fullPhone) : checkLogin(email, fullPhone);
    if (!res.ok) {
      if (res.field) setErrors({ [res.field]: res.error });
      setFormError({
        text: res.error,
        switchTo: mode === "signup" && res.error.includes("Log in") ? "login" : mode === "login" && res.error.includes("Sign up") ? "signup" : undefined,
      });
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setStep("otp");
      setOtp("");
      setOtpError(false);
      setResendIn(30);
      setJustSent(true);
    }, 700);
  };

  const verify = (code: string) => {
    if (code.length < 6 || busy) return;
    setBusy(true);
    setTimeout(() => {
      if (code !== DEMO_OTP) {
        setBusy(false);
        setOtpError(true);
        setTimeout(() => setOtpError(false), 500);
        return;
      }
      let dest = props.next && props.next.startsWith("/") ? props.next : "/dashboard";
      if (mode === "signup") {
        completeSignup({ name, email, phone: fullPhone, plan: planId });
        dest = "/onboarding";
      } else {
        completeLogin(email);
      }
      setStep("done");
      setTimeout(() => router.push(dest), 900);
    }, 650);
  };

  // Already signed in?
  const signedIn = hydrated && user && step === "details";

  return (
    <div className="min-h-[100svh] bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Visual — desktop */}
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-[100svh]">
        <VisualPanel mode={mode} />
      </div>

      {/* Visual — phones: compact band */}
      <div className="relative isolate overflow-hidden bg-forest px-6 pb-14 pt-6 text-canvas lg:hidden">
        <div aria-hidden className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-brand/30 blur-3xl" />
        <motion.div aria-hidden className="absolute -right-10 top-10 -z-10 h-44 w-44 opacity-80" style={{ originX: 29 / 64, originY: 0.5 }} animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
          <RingMark className="h-full w-full" ink="#8AF0A0" leaf="#FAFAF8" track="rgba(250,250,248,0.07)" vein="#16A34A" />
        </motion.div>
        <Link href="/" aria-label="Evowell home" className="inline-block">
          <SealLogo tone="dark" />
        </Link>
        <p className="mt-8 max-w-[14rem] font-sans text-[2rem] font-medium leading-[1] tracking-[-0.055em]">
          {mode === "login" ? (
            <>
              Your plan is <span className="font-serif italic text-sprout">waiting.</span>
            </>
          ) : (
            <>
              Eat better, <span className="font-serif italic text-sprout">not different.</span>
            </>
          )}
        </p>
      </div>

      {/* Form */}
      <div className="relative -mt-8 rounded-t-[2rem] bg-canvas px-6 pb-12 pt-8 sm:px-10 lg:mt-0 lg:flex lg:min-h-[100svh] lg:items-center lg:justify-center lg:rounded-none lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="hidden items-center gap-2 text-sm font-semibold text-ink/50 transition-colors hover:text-ink lg:inline-flex">
            <ArrowLeft size={15} /> Back to site
          </Link>

          {signedIn ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:mt-10">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-brand">
                <ShieldCheck size={26} />
              </span>
              <h1 className="mt-6 text-4xl font-medium tracking-[-0.05em] text-ink">You&apos;re signed in.</h1>
              <p className="mt-2 text-base text-stone">
                As <b className="text-ink">{user!.name}</b> · {user!.email}
              </p>
              <button
                onClick={() => router.push(data?.profile ? "/dashboard" : "/onboarding")}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                {data?.profile ? "Go to your dashboard" : "Finish your questionnaire"} <ArrowRight size={16} />
              </button>
            </motion.div>
          ) : (
            <>
              {/* Tabs */}
              {step === "details" && (
                <LayoutGroup id="auth-tabs">
                  <div className="grid grid-cols-2 gap-1 rounded-full bg-ink/[0.05] p-1 lg:mt-10" role="tablist">
                    {(["login", "signup"] as Mode[]).map((m) => (
                      <button
                        key={m}
                        role="tab"
                        aria-selected={mode === m}
                        onClick={() => switchMode(m)}
                        className={`relative rounded-full py-2.5 text-sm font-semibold transition-colors ${mode === m ? "text-canvas" : "text-ink/55 hover:text-ink"}`}
                      >
                        {mode === m && <motion.span layoutId="auth-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
                        <span className="relative">{m === "login" ? "Log in" : "Sign up"}</span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
              )}

              <>
                {step === "details" && (
                  <motion.form
                    key={`details-${mode}`}
                    onSubmit={sendCode}
                    noValidate
                    initial={{ opacity: 0, x: mode === "signup" ? 24 : -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: mode === "signup" ? -24 : 24 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="mt-8"
                  >
                    <h1 className="text-4xl font-medium tracking-[-0.055em] text-ink sm:text-[2.75rem]">{mode === "login" ? "Welcome back." : "Create your account."}</h1>
                    <p className="mt-2 text-[15px] leading-relaxed text-stone">
                      {mode === "login"
                        ? "Enter the email and phone number on your account. We'll text you a code."
                        : "Email and phone are both needed — your coach uses them to reach you."}
                    </p>

                    {mode === "signup" && (
                      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-mint px-4 py-3">
                        <span className="flex items-center gap-2 text-sm">
                          <Sparkles size={15} className="text-brand" />
                          <span>
                            <b className="text-ink">{plans[planInfo.kind].name}</b> <span className="text-ink/55">· {planInfo.duration} days</span>
                          </span>
                        </span>
                        <Link href="/#pricing" className="text-xs font-semibold text-brand-deep hover:underline">
                          Change
                        </Link>
                      </div>
                    )}

                    <div className="mt-6 space-y-4">
                      {mode === "signup" && (
                        <Field label="Full name" icon={<User size={18} />} error={errors.name}>
                          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Aanya Sharma" autoComplete="name" />
                        </Field>
                      )}
                      <Field label="Email" icon={<Mail size={18} />} error={errors.email}>
                        <input className={inputCls} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                      </Field>
                      <Field label="Mobile number" icon={<Phone size={18} />} error={errors.phone}>
                        <span className="relative flex h-full items-center">
                          <select
                            value={dial}
                            onChange={(e) => setDial(e.target.value)}
                            aria-label="Country code"
                            className="h-full appearance-none bg-transparent pr-5 text-[15px] font-semibold text-ink outline-none"
                          >
                            {dials.map((d) => (
                              <option key={d.code} value={d.code}>
                                {d.code} {d.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="pointer-events-none absolute right-0 text-ink/40" />
                        </span>
                        <span className="h-6 w-px bg-ink/10" />
                        <input
                          className={inputCls}
                          type="tel"
                          inputMode="numeric"
                          value={num}
                          onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, dialInfo.digits + 1))}
                          placeholder={dial === "+91" ? "98765 43210" : "Mobile number"}
                          autoComplete="tel-national"
                        />
                      </Field>
                    </div>

                    <AnimatePresence>
                      {formError && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                          <AlertCircle size={17} className="mt-0.5 shrink-0" />
                          <span className="flex-1">
                            {formError.text}
                            {formError.switchTo && (
                              <button type="button" onClick={() => switchMode(formError.switchTo!)} className="ml-1 font-semibold underline underline-offset-2">
                                {formError.switchTo === "login" ? "Log in" : "Sign up"}
                              </button>
                            )}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={busy}
                      className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(22,163,74,0.8)] transition-all hover:bg-brand-deep disabled:opacity-70"
                    >
                      {busy ? <Loader2 size={17} className="animate-spin" /> : null}
                      {busy ? "Sending code…" : "Send verification code"}
                      {!busy && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                    </button>

                    <p className="mt-5 text-center text-sm text-stone">
                      {mode === "login" ? "New to Evowell? " : "Already have an account? "}
                      <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")} className="font-semibold text-ink underline-offset-4 hover:underline">
                        {mode === "login" ? "Create an account" : "Log in"}
                      </button>
                    </p>
                    <p className="mt-6 text-center text-xs leading-relaxed text-ink/40">Demo sign-in — accounts are saved in this browser only. No SMS is actually sent.</p>
                  </motion.form>
                )}

                {step === "otp" && (
                  <motion.div key="otp" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease: EASE }} className="lg:mt-10">
                    <button onClick={() => setStep("details")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-ink">
                      <ArrowLeft size={15} /> Edit details
                    </button>
                    <span className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-brand">
                      <Phone size={24} />
                    </span>
                    <h1 className="mt-6 text-4xl font-medium tracking-[-0.055em] text-ink">Check your phone.</h1>
                    <p className="mt-2 text-[15px] leading-relaxed text-stone">
                      Enter the 6-digit code sent to <b className="whitespace-nowrap text-ink">{maskPhone(dial, num)}</b>.
                    </p>

                    <AnimatePresence>
                      {justSent && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-warn bg-warn/10 px-4 py-3 text-sm">
                          <span>
                            <b>Demo code:</b> <span className="font-mono tabular-nums tracking-widest">{DEMO_OTP}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setOtp(DEMO_OTP);
                              verify(DEMO_OTP);
                            }}
                            className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-canvas"
                          >
                            Fill it in
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-6">
                      <OtpInput
                        value={otp}
                        disabled={busy}
                        error={otpError}
                        onChange={(v) => {
                          setOtp(v);
                          if (v.length === 6) verify(v);
                        }}
                      />
                    </div>
                    <div className="mt-3 h-5 text-sm">
                      {otpError ? (
                        <span className="font-medium text-red-600">That code didn&apos;t match. Try again.</span>
                      ) : busy ? (
                        <span className="inline-flex items-center gap-2 text-stone">
                          <Loader2 size={14} className="animate-spin" /> Verifying…
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-6 text-sm text-stone">
                      Didn&apos;t get it?{" "}
                      {resendIn > 0 ? (
                        <span className="tabular-nums">Resend in 0:{String(resendIn).padStart(2, "0")}</span>
                      ) : (
                        <button
                          onClick={() => {
                            setResendIn(30);
                            setJustSent(true);
                          }}
                          className="font-semibold text-ink underline-offset-4 hover:underline"
                        >
                          Resend code
                        </button>
                      )}
                    </p>
                    <p className="mt-2 text-sm text-stone">
                      We&apos;ll also email <b className="text-ink">{email.trim().toLowerCase()}</b> your plan updates.
                    </p>
                  </motion.div>
                )}

                {step === "done" && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-16 text-center lg:mt-10">
                    <motion.span
                      initial={{ scale: 0, rotate: -60 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 14 }}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-white shadow-[0_20px_40px_-15px_rgba(22,163,74,0.8)]"
                    >
                      <Check size={38} strokeWidth={3} />
                    </motion.span>
                    <h1 className="mt-6 text-3xl font-medium tracking-[-0.05em] text-ink">{mode === "signup" ? "Account created." : "Welcome back."}</h1>
                    <p className="mt-2 text-stone">{mode === "signup" ? "Next: a 3-minute questionnaire." : "Opening your dashboard…"}</p>
                  </motion.div>
                )}
              </>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
