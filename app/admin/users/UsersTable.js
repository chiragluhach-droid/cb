"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

const ago = (d) => {
  if (!d) return "never";
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  return days === 0 ? "today" : `${days}d ago`;
};

export default function UsersTable({ rows }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const list = useMemo(() => rows.filter((r) => {
    if (q && !`${r.name} ${r.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (f === "active") return r.status === "active";
    if (f === "inactive") return r.status === "active" && (!r.lastLogAt || Date.now() - new Date(r.lastLogAt) > 3 * 86400000);
    if (f === "expired") return r.status === "expired";
    if (f === "unpaid") return r.status === "none";
    if (f === "review") return r.planStatus.some((s) => s !== "active");
    return true;
  }), [rows, q, f]);

  return (
    <>
      <div className="row wrapflex" style={{ marginTop: 20, gap: 10 }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="toggle">
          {["all", "active", "inactive", "review", "expired", "unpaid"].map((x) => <button key={x} className={f === x ? "on" : ""} onClick={() => setF(x)}>{x}</button>)}
        </div>
        <span className="mono muted">{list.length} shown</span>
      </div>
      <div className="card tablewrap" style={{ marginTop: 16 }}>
        <table className="table">
          <thead><tr><th>client</th><th>subscription</th><th>phase</th><th>plan</th><th>weight</th><th>last log</th><th>joined</th></tr></thead>
          <tbody>
            {list.map((r) => {
              const left = r.endsAt ? Math.ceil((new Date(r.endsAt) - Date.now()) / 86400000) : null;
              return (
                <tr key={r.id}>
                  <td><Link href={`/admin/users/${r.id}`} style={{ fontWeight: 700, textDecoration: "underline" }}>{r.name}</Link><div className="muted" style={{ fontSize: 12 }}>{r.email}</div>
                    <div className="row wrapflex" style={{ gap: 4, marginTop: 4 }}>{r.diet && <span className="pill gray">{r.diet}</span>}{r.conditions.map((c) => <span key={c} className="pill pink">{c}</span>)}</div></td>
                  <td>{r.status === "active" ? <span className={`pill ${left <= 5 ? "orange" : "lime"}`}>{r.plan}d · {left}d left</span> : <span className="pill gray">{r.status === "none" ? (r.onboarded ? "unpaid" : "signup") : r.status}</span>}</td>
                  <td className="mono">{r.stage?.replace("_", " ")}</td>
                  <td>{r.planStatus.includes("active") && <span className="pill lime">live</span>} {r.planStatus.some((s) => s !== "active") && <span className="pill pink">needs review</span>}</td>
                  <td className="mono">{r.start ?? "–"} → {r.weight ?? "–"}</td>
                  <td className="mono" style={{ color: r.status === "active" && (!r.lastLogAt || Date.now() - new Date(r.lastLogAt) > 3 * 86400000) ? "#b42318" : undefined }}>{ago(r.lastLogAt)}</td>
                  <td className="mono muted">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
