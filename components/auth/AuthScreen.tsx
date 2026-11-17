"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { SealLogo } from "@/components/brand/SealLogo";
import { RingMark } from "@/components/brand/Marks";
import { Seal } from "@/components/brand/Seal";
import { photos, unsplash } from "@/lib/site";
import { User, canUseApp, loginWithPassword, logout, startAuth, useSession, verifyAuth } from "@/lib/demo-store";

type Mode = "login" | "signup";
type Props = { initialMode: Mode; plan: string | null; name: string; email: string; phone: string; next: string | null };

const EASE = [0.16, 1, 0.3, 1] as const;

const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

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

const inputCls = "h-full min-w-0 flex-1 bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-ink/30";

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
  { img: photos.avoToast, cls: "left-[6%] top-[14%] w-[22%]", d: 3.4 },
  { img: photos.salmon, cls: "right-[4%] top-[8%] w-[26%]", d: 4 },
  { img: photos.buddhaBowl, cls: "right-[10%] bottom-[10%] w-[20%]", d: 3.1 },
  { img: photos.berryOats, cls: "left-[12%] bottom-[6%] w-[18%]", d: 3.7 },
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
            {["Coach-reviewed", "Built around food you love", "Updates as you progress"].map((t) => (
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

/*
 * login  → email + password
 * forgot → email → we send a 6-digit code
 * reset  → code + new password → signed in
 * New accounts are made at the end of the questionnaire (/onboarding), not here.
 */
type Step = "login" | "forgot" | "reset" | "done";

function PasswordInput({ value, onChange, autoComplete, placeholder }: { value: string; onChange: (v: string) => void; autoComplete: string; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <input className={inputCls} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink/40 hover:text-ink">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </>
  );
}

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <span className="flex-1">{children}</span>
    </motion.div>
  );
}

const primaryBtn =
  "group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(22,163,74,0.8)] transition-all hover:bg-brand-deep disabled:opacity-70";

export default function AuthScreen(props: Props) {
  const router = useRouter();
  const { hydrated, user, data } = useSession();

  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState(props.email);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<{ text: string; noPassword?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  // Reset
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null); // dummy email mode: code shown on screen
  const [resendIn, setResendIn] = useState(0);
  const [resetDone, setResetDone] = useState(false);

  const signupHref = props.plan ? `/onboarding?plan=${encodeURIComponent(props.plan)}` : "/onboarding";

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const goTo = (s: Step) => {
    setStep(s);
    setErrors({});
    setFormError(null);
  };

  /** Where to go once signed in. */
  const finish = (u: User) => {
    const next = props.next && props.next.startsWith("/") && !props.next.startsWith("//") ? props.next : "/dashboard";
    // No paid plan yet → checkout (which sends anyone without answers to the questionnaire first).
    const dest = canUseApp(u) ? next : `/checkout?plan=${u.plan}`;
    setStep("done");
    setTimeout(() => router.push(dest), 900);
  };

  const login = async (e: FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (!validEmail(email)) er.email = "Enter a valid email address.";
    if (!password) er.password = "Enter your password.";
    setErrors(er);
    setFormError(null);
    if (Object.keys(er).length) return;
    setBusy(true);
    const res = await loginWithPassword(email.trim(), password);
    setBusy(false);
    if (!res.ok) {
      setFormError({ text: res.error, noPassword: res.noPassword });
      return;
    }
    setResetDone(false);
    finish(res.user);
  };

  const sendReset = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!validEmail(email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setErrors({});
    setFormError(null);
    setBusy(true);
    const res = await startAuth({ mode: "reset", email: email.trim() });
    setBusy(false);
    if (!res.ok) {
      if (res.wait) setResendIn(res.wait);
      if (step === "reset") setFormError({ text: res.error });
      else res.field === "email" ? setErrors({ email: res.error }) : setFormError({ text: res.error });
      return;
    }
    setDevCode(res.devCode ?? null);
    setOtp("");
    setNewPw("");
    setResendIn(30);
    setStep("reset");
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (newPw.length < 8) er.password = "Use at least 8 characters.";
    setErrors(er);
    setFormError(null);
    if (otp.length < 6) {
      setFormError({ text: "Enter the 6-digit code from the email." });
      return;
    }
    if (Object.keys(er).length) return;
    setBusy(true);
    const res = await verifyAuth(email.trim(), otp, { password: newPw });
    setBusy(false);
    if (!res.ok) {
      if (res.field === "password") setErrors({ password: res.error });
      else {
        setFormError({ text: res.error });
        setOtpError(true);
        setTimeout(() => setOtpError(false), 500);
      }
      return;
    }
    setResetDone(true);
    finish(res.user);
  };

  // Already signed in?
  const signedIn = hydrated && user && step === "login";

  return (
    <div className="min-h-[100svh] bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Visual — desktop */}
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-[100svh]">
        <VisualPanel mode="login" />
      </div>

      {/* Visual — phones: compact band */}
      <div className="relative isolate overflow-hidden bg-forest px-6 pb-14 pt-6 text-canvas lg:hidden">
        <div aria-hidden className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-brand/30 blur-3xl" />
        {/* Ring with the spinning seal in its hole (ring centre is 29/64 across the box). */}
        <div aria-hidden className="absolute -right-5 top-4 -z-10 h-44 w-44">
          <motion.div className="h-full w-full opacity-80" style={{ originX: 29 / 64, originY: 0.5 }} animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
            <RingMark className="h-full w-full" ink="#8AF0A0" leaf="#FAFAF8" track="rgba(250,250,248,0.07)" vein="#16A34A" />
          </motion.div>
          <span className="absolute left-[28.3%] top-[33%] h-[34%] w-[34%]">
            <Seal className="h-full w-full" color="#FAFAF8" spin="reverse" />
          </span>
        </div>
        <Link href="/" aria-label="Evowell home" className="inline-block">
          <SealLogo tone="dark" />
        </Link>
        <p className="mt-8 max-w-[14rem] font-sans text-[2rem] font-medium leading-[1] tracking-[-0.055em]">
          Your plan is <span className="font-serif italic text-sprout">waiting.</span>
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
                onClick={() => router.push(!data?.profile ? "/onboarding" : user && !canUseApp(user) ? `/checkout?plan=${user.plan}` : "/dashboard")}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                {!data?.profile ? "Start your questionnaire" : user && !canUseApp(user) ? "Continue to payment" : "Go to your dashboard"} <ArrowRight size={16} />
              </button>
              <button onClick={() => logout()} className="mt-4 w-full text-center text-sm font-semibold text-ink/50 underline-offset-2 transition-colors hover:text-ink hover:underline">
                Not you? Log out
              </button>
            </motion.div>
          ) : (
            <>
              {step === "login" && (
                <motion.form key="login" onSubmit={login} noValidate initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: EASE }} className="lg:mt-10">
                  <h1 className="text-4xl font-medium tracking-[-0.055em] text-ink sm:text-[2.75rem]">Welcome back.</h1>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">Log in with your email and password.</p>

                  <div className="mt-6 space-y-4">
                    <Field label="Email" icon={<Mail size={18} />} error={errors.email}>
                      <input className={inputCls} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                    </Field>
                    <div>
                      <Field label="Password" icon={<Lock size={18} />} error={errors.password}>
                        <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" placeholder="Your password" />
                      </Field>
                      <div className="mt-2 text-right">
                        <button type="button" onClick={() => goTo("forgot")} className="text-sm font-semibold text-brand-deep underline-offset-4 hover:underline">
                          Forgot password?
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {formError && (
                      <ErrorBox>
                        {formError.text}
                        {formError.noPassword && (
                          <button type="button" onClick={() => sendReset()} className="ml-1 font-semibold underline underline-offset-2">
                            Email me a code
                          </button>
                        )}
                      </ErrorBox>
                    )}
                  </AnimatePresence>

                  <button type="submit" disabled={busy} className={primaryBtn}>
                    {busy ? <Loader2 size={17} className="animate-spin" /> : null}
                    {busy ? "Logging in…" : "Log in"}
                    {!busy && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                  </button>

                  <p className="mt-5 text-center text-sm text-stone">
                    New to Evowell?{" "}
                    <Link href={signupHref} className="font-semibold text-ink underline-offset-4 hover:underline">
                      Get your plan
                    </Link>
                  </p>
                </motion.form>
              )}

              {step === "forgot" && (
                <motion.form key="forgot" onSubmit={sendReset} noValidate initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: EASE }} className="lg:mt-10">
                  <button type="button" onClick={() => goTo("login")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-ink">
                    <ArrowLeft size={15} /> Back to log in
                  </button>
                  <span className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-brand">
                    <KeyRound size={24} />
                  </span>
                  <h1 className="mt-6 text-4xl font-medium tracking-[-0.055em] text-ink">Reset your password.</h1>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">Enter the email on your account and we&apos;ll send you a 6-digit code.</p>
                  <div className="mt-6">
                    <Field label="Email" icon={<Mail size={18} />} error={errors.email}>
                      <input className={inputCls} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                    </Field>
                  </div>
                  <AnimatePresence>{formError && <ErrorBox>{formError.text}</ErrorBox>}</AnimatePresence>
                  <button type="submit" disabled={busy} className={primaryBtn}>
                    {busy ? <Loader2 size={17} className="animate-spin" /> : null}
                    {busy ? "Sending code…" : "Email me a code"}
                    {!busy && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                  </button>
                </motion.form>
              )}

              {step === "reset" && (
                <motion.form key="reset" onSubmit={reset} noValidate initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: EASE }} className="lg:mt-10">
                  <button type="button" onClick={() => goTo("forgot")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-ink">
                    <ArrowLeft size={15} /> Change email
                  </button>
                  <h1 className="mt-6 text-4xl font-medium tracking-[-0.055em] text-ink">Check your email.</h1>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">
                    Enter the code sent to <b className="break-all text-ink">{email.trim().toLowerCase()}</b>, then choose a new password.
                  </p>

                  {devCode && (
                    <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-warn bg-warn/10 px-4 py-3 text-sm">
                      <span>
                        <b>Email isn&apos;t connected yet.</b> Your code: <span className="font-mono tabular-nums tracking-widest">{devCode}</span>
                      </span>
                      <button type="button" onClick={() => setOtp(devCode)} className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-canvas">
                        Fill it in
                      </button>
                    </div>
                  )}
                  {!devCode && <p className="mt-3 text-xs text-ink/45">Can&apos;t see it? It can take a minute. Check your spam or Promotions folder too.</p>}

                  <div className="mt-6">
                    <OtpInput value={otp} disabled={busy} error={otpError} onChange={setOtp} />
                  </div>
                  <div className="mt-5">
                    <Field label="New password" icon={<Lock size={18} />} error={errors.password}>
                      <PasswordInput value={newPw} onChange={setNewPw} autoComplete="new-password" placeholder="At least 8 characters" />
                    </Field>
                  </div>

                  <AnimatePresence>{formError && <ErrorBox>{formError.text}</ErrorBox>}</AnimatePresence>

                  <button type="submit" disabled={busy} className={primaryBtn}>
                    {busy ? <Loader2 size={17} className="animate-spin" /> : null}
                    {busy ? "Saving…" : "Set password and log in"}
                    {!busy && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                  </button>

                  <p className="mt-6 text-sm text-stone">
                    Didn&apos;t get it?{" "}
                    {resendIn > 0 ? (
                      <span className="tabular-nums">Resend in 0:{String(resendIn).padStart(2, "0")}</span>
                    ) : (
                      <button type="button" onClick={() => sendReset()} className="font-semibold text-ink underline-offset-4 hover:underline">
                        Resend code
                      </button>
                    )}
                  </p>
                  <p className="mt-2 text-sm text-stone">Codes expire after 10 minutes.</p>
                </motion.form>
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
                  <h1 className="mt-6 text-3xl font-medium tracking-[-0.05em] text-ink">{resetDone ? "Password updated." : "Welcome back."}</h1>
                  <p className="mt-2 text-stone">Opening your account…</p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
