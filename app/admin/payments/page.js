import { db } from "@/lib/db";
import Link from "next/link";
import Payment from "@/models/Payment";

export default async function Payments() {
  await db();
  const list = await Payment.find().sort({ createdAt: -1 }).limit(300).populate("user", "name email").lean();
  return (
    <div style={{ maxWidth: 1200 }}>
      <h1 className="display" style={{ fontSize: "clamp(42px, 6vw, 72px)" }}>pay<span className="serif">ments</span></h1>
      <div className="card tablewrap" style={{ marginTop: 20 }}>
        <table className="table">
          <thead><tr><th>date</th><th>client</th><th>plan</th><th>amount</th><th>code</th><th>status</th><th>provider / id</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={7} className="muted">no payments yet</td></tr>}
            {list.map((p) => (
              <tr key={String(p._id)}>
                <td className="mono">{new Date(p.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td>{p.user ? <Link href={`/admin/users/${p.user._id}`} style={{ textDecoration: "underline" }}>{p.user.name}</Link> : "–"}</td>
                <td>{p.plan}-day</td>
                <td className="mono"><b>{p.currency === "USD" ? "$" : "₹"}{p.amount?.toLocaleString("en-IN")}</b>{p.discount ? <span className="muted"> (−{p.discount})</span> : ""}</td>
                <td className="mono">{p.coupon || "–"}</td>
                <td><span className={`pill ${p.status === "paid" ? "lime" : p.status === "failed" ? "pink" : "gray"}`}>{p.status}</span></td>
                <td className="mono muted" style={{ fontSize: 12 }}>{p.provider} · {p.paymentId || p.orderId || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
