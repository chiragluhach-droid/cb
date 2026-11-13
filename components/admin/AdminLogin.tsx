"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ClipboardCheck, KeyRound, Loader2, MessageCircle, ShieldCheck, Wand2 } from "lucide-react";
import { SealLogo } from "@/components/brand/SealLogo";
import { Seal } from "@/components/brand/Seal";
import { RingMark } from "@/components/brand/Marks";
import { CoachAvatar } from "@/components/app/CoachAvatar";
import { ADMIN_CODE, ADMIN_EMAIL, adminSignIn, useAdmin } from "@/lib/admin";
import { coach } from "@/lib/site";

const field =
  "w-full rounded-2xl bg-white px-4 py-3.5 text-[15px] text-ink outline-none ring-1 ring-ink/10 transition-shadow placeholder:text-ink/35 focus:ring-2 focus:ring-brand";

export default function AdminLogin() {
  const router = useRouter();
  const { hydrated, signedIn } = useAdmin();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && signedIn && !busy) router.replace("/admin");
  }, [hydrated, signedIn, busy, router]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    setTimeout(() => {
      if (adminSignIn(email, code)) router.push("/admin");
      else {
        setBusy(false);
        setError("That email and passcode don't match the coach account.");
      }
    }, 600);
  };

  return (
    <div className="min-h-[100svh] bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Visual */}
      <div className="relative isolate hidden overflow-hidden bg-forest p-10 text-canvas lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:flex-col">
        <div aria-hidden className="absolute -left-32 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand/25 blur-3xl" />
        <Link href="/" aria-label="Evowell home" className="w-fit">
          <SealLogo tone="dark" alwaysWordmark />
        </Link>

        <div aria-hidden className="relative mx-auto my-8 aspect-square w-full max-w-[22rem] flex-1">
          <div className="absolute bottom-[12%] left-[15.56%] right-[8.44%] top-[12%]">
            <motion.div className="h-full w-full" style={{ originX: 29 / 64, originY: 0.5 }} animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
              <RingMark className="h-full w-full" ink="#8AF0A0" leaf="#FAFAF8" track="rgba(250,250,248,0.07)" vein="#16A34A" />
            </motion.div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Seal className="h-[27%] w-[27%]" color="#FAFAF8" spin="reverse" />
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sprout">Coach panel</p>
          <h1 className="mt-3 text-5xl font-medium leading-[0.98] tracking-[-0.055em]">
            Every plan, <span className="font-serif italic text-sprout">signed off by you.</span>
          </h1>
          <ul className="mt-6 space-y-2.5 text-sm text-canvas/65">
            {[
              [ClipboardCheck, "Review drafts with risk warnings and a checklist"],
              [MessageCircle, "Reply to clients and adjust their plans"],
              [ShieldCheck, "Set prices, codes and checkout from Subscriptions"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof ClipboardCheck;
              return (
                <li key={t as string} className="flex items-center gap-2.5">
                  <I size={15} className="text-sprout" /> {t as string}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Form */}
      <div className="flex min-h-[100svh] flex-col px-6 py-6 sm:px-10 lg:py-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
            <ArrowLeft size={15} /> Back to site
          </Link>
          <span className="lg:hidden">
            <SealLogo />
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="flex items-center gap-3">
            <CoachAvatar className="h-14 w-14" online />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/40">Coach sign in</p>
              <p className="text-lg font-semibold tracking-[-0.02em] text-ink">Welcome back, {coach.name}</p>
            </div>
          </div>
          <h2 className="mt-8 text-[2.5rem] font-medium leading-[1] tracking-[-0.055em] text-ink sm:text-5xl">
            Open the <span className="font-serif italic text-brand">coach panel.</span>
          </h2>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Coach email</span>
              <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="coach@…" className={field} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Passcode</span>
              <span className="relative block">
                <KeyRound size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  autoComplete="current-password"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 digits"
                  className={`${field} pl-11 tracking-[0.3em] placeholder:tracking-normal`}
                />
              </span>
            </label>
            {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-semibold text-canvas transition-colors hover:bg-brand disabled:opacity-70"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              Sign in <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-mint p-4">
            <Wand2 size={16} className="mt-0.5 shrink-0 text-brand-deep" />
            <div className="text-sm text-brand-deep">
              <p className="font-semibold">Demo coach account</p>
              <p className="mt-0.5 text-brand-deep/75">
                {ADMIN_EMAIL} · passcode {ADMIN_CODE}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmail(ADMIN_EMAIL);
                  setCode(ADMIN_CODE);
                  setError("");
                }}
                className="mt-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-deep ring-1 ring-brand/20 transition-colors hover:bg-brand hover:text-white"
              >
                Fill in demo details
              </button>
            </div>
          </div>
          <p className="mt-6 text-xs text-ink/40">Client? <Link href="/login" className="font-semibold text-ink/60 underline-offset-2 hover:underline">Log in to your dashboard</Link></p>
        </div>
      </div>
    </div>
  );
}
