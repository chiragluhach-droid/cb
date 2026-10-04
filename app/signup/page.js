"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, { PasswordInput } from "@/components/AuthShell";

function SignupForm() {
  const router = useRouter();
  const qs = useSearchParams();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const p = qs.get("plan");
    if (p) try { localStorage.setItem("khao_plan", p); } catch {}
  }, [qs]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error);
    router.push(j.next);
  };
  return (
    <form onSubmit={submit} className="stack">
      {err && <div className="err">{err}</div>}
      <div><label className="label" htmlFor="name">Your name</label><input id="name" className="input" autoComplete="name" required placeholder="Riya Sharma" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><label className="label" htmlFor="password">Password</label><PasswordInput id="password" autoComplete="new-password" minLength={8} required placeholder="At least 8 characters" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
      <button className="btn primary" style={{ width: "100%", marginTop: 8 }} disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      <p className="muted" style={{ fontSize: 12.5, textAlign: "center", marginTop: 4 }}>Free during early access. No card needed.</p>
    </form>
  );
}

export default function Signup() {
  return (
    <AuthShell title="Create your free account" sub="Takes about 3 minutes. Your coach takes it from there." footer={<>Already have an account? <Link href="/login">Sign in</Link></>}>
      <Suspense><SignupForm /></Suspense>
    </AuthShell>
  );
}
