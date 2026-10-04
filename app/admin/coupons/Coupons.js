"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/AdminActions";

export default function Coupons({ list }) {
  const router = useRouter();
  const [f, setF] = useState({ code: "", percentOff: "", flatOff: "", maxUses: "", expiresAt: "" });
  const [err, setErr] = useState("");
  const create = async (e) => {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/admin/coupons", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    if (!r.ok) return setErr(j.error);
    setF({ code: "", percentOff: "", flatOff: "", maxUses: "", expiresAt: "" });
    router.refresh();
  };
  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 className="display" style={{ fontSize: 28 }}>discount codes</h1>
      <form onSubmit={create} className="card" style={{ padding: 20, marginTop: 20, background: "var(--butter)" }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <div><label className="label">code</label><input className="input" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="DIWALI20" required /></div>
          <div><label className="label">% off</label><input className="input" type="number" value={f.percentOff} onChange={(e) => setF({ ...f, percentOff: e.target.value })} placeholder="20" /></div>
          <div><label className="label">or flat ₹ off</label><input className="input" type="number" value={f.flatOff} onChange={(e) => setF({ ...f, flatOff: e.target.value })} placeholder="500" /></div>
          <div><label className="label">max uses (0 = ∞)</label><input className="input" type="number" value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} placeholder="100" /></div>
          <div><label className="label">expires</label><input className="input" type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></div>
        </div>
        {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
        <button className="btn" style={{ marginTop: 14 }}>+ create code</button>
      </form>
      <div className="card tablewrap" style={{ marginTop: 20 }}>
        <table className="table">
          <thead><tr><th>code</th><th>discount</th><th>uses</th><th>expires</th><th>status</th><th></th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={6} className="muted">no codes yet</td></tr>}
            {list.map((c) => (
              <tr key={c._id}>
                <td className="mono"><b>{c.code}</b></td>
                <td>{c.percentOff ? `${c.percentOff}%` : ""}{c.percentOff && c.flatOff ? " + " : ""}{c.flatOff ? `₹${c.flatOff}` : ""}</td>
                <td className="mono">{c.uses}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                <td className="mono">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "never"}</td>
                <td><span className={`pill ${c.active ? "lime" : "gray"}`}>{c.active ? "active" : "paused"}</span></td>
                <td className="row">
                  <ActionButton url={`/api/admin/coupons/${c._id}`} method="PATCH" className="btn sm ghost" style={{ border: "var(--line)" }}>{c.active ? "pause" : "resume"}</ActionButton>
                  <ActionButton url={`/api/admin/coupons/${c._id}`} method="DELETE" className="btn sm ghost" confirm={`Delete ${c.code}?`}>🗑</ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
