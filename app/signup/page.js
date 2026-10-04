"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";

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
      <div><label className="label">your name</label><input className="input" required placeholder="Riya Sharma" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><label className="label">email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><label className="label">password</label><input className="input" type="password" minLength={8} required placeholder="At least 8 characters" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
      <button className="btn lime" style={{ width: "100%", marginTop: 8 }} disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      <p className="muted" style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}>Already have an account? <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Sign in</Link></p>
    </form>
  );
}

export default function Signup() {
  return (
    <AuthShell title="Create your account" sub="Takes about 3 minutes. Your coach takes it from there.">
      <Suspense><SignupForm /></Suspense>
    </AuthShell>
  );
}
