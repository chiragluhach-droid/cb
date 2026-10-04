"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";

function LoginForm() {
  const router = useRouter();
  const qs = useSearchParams();
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error);
    const next = qs.get("next");
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : j.next);
    router.refresh();
  };
  return (
    <form onSubmit={submit} className="stack">
      {err && <div className="err">{err}</div>}
      <div><label className="label">email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><label className="label">password</label><input className="input" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
      <button className="btn lime" style={{ width: "100%", marginTop: 8 }} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <p className="muted" style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}>New to Khao? <Link href="/signup" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Create an account</Link></p>
    </form>
  );
}

export default function Login() {
  return (
    <AuthShell title="Welcome back" sub="Sign in to see today's meals and your progress.">
      <Suspense><LoginForm /></Suspense>
    </AuthShell>
  );
}
