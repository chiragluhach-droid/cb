import { db } from "@/lib/db";
import Link from "next/link";
import User from "@/models/User";
import Payment from "@/models/Payment";
import Alert from "@/models/Alert";
import Plan from "@/models/Plan";
import DailyLog from "@/models/DailyLog";
import { istDate } from "@/lib/dates";
import { ActionButton } from "@/components/AdminActions";

const ALERT = { inactive: ["😶", "var(--butter)"], plateau: ["📉", "var(--sky)"], progress: ["🎯", "var(--lime)"], goal_reached: ["🏆", "var(--lime)"], renewal: ["⏳", "var(--orange)"], health: ["🩺", "var(--pink)"], review: ["🧾", "var(--lilac)"] };

export default async function Overview() {
  await db();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const weekAgo = istDate(new Date(Date.now() - 7 * 86400000));

  const [total, active, expiring, reviews, alerts, paid, loggers, recent] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "user", "subscription.status": "active" }),
    User.countDocuments({ "subscription.status": "active", "subscription.endsAt": { $lte: new Date(Date.now() + 7 * 86400000) } }),
    Plan.countDocuments({ status: { $in: ["review", "drafting"] } }),
    Alert.find({ resolved: false, type: { $ne: "review" } }).sort({ createdAt: -1 }).limit(30).populate("user", "name").lean(),
    Payment.find({ status: "paid", paidAt: { $gte: sixAgo } }).lean(),
    DailyLog.distinct("user", { date: { $gte: weekAgo } }),
    User.find({ role: "user" }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);
  const allTime = await Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: "$currency", sum: { $sum: "$amount" } } }]);
  const rev = Object.fromEntries(allTime.map((r) => [r._id, r.sum]));
  const monthINR = paid.filter((p) => p.paidAt >= monthStart && p.currency === "INR").reduce((s, p) => s + p.amount, 0);
  const monthUSD = paid.filter((p) => p.paidAt >= monthStart && p.currency === "USD").reduce((s, p) => s + p.amount, 0);

  // bars: last 6 months, USD converted at ~85 for a single view
  const months = Array.from({ length: 6 }, (_, k) => new Date(now.getFullYear(), now.getMonth() - 5 + k, 1));
  const bars = months.map((m) => {
    const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const v = paid.filter((p) => p.paidAt >= m && p.paidAt < next).reduce((s, p) => s + (p.currency === "USD" ? p.amount * 85 : p.amount), 0);
    return { label: m.toLocaleString("en-IN", { month: "short" }), v };
  });
  const maxBar = Math.max(1, ...bars.map((b) => b.v));

  const stats = [
    ["active clients", active, "var(--lime)"],
    ["logged this week", loggers.length, "var(--sky)"],
    ["plans to review", reviews, reviews ? "var(--pink)" : "#fffdf7", "/admin/reviews"],
    ["ending in 7 days", expiring, "var(--orange)"],
    ["revenue this month", `₹${monthINR.toLocaleString("en-IN")}${monthUSD ? ` + $${monthUSD}` : ""}`, "var(--butter)"],
    ["all-time revenue", `₹${(rev.INR || 0).toLocaleString("en-IN")}${rev.USD ? ` + $${rev.USD}` : ""}`, "#fffdf7"],
    ["total signups", total, "var(--lilac)"],
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      <div className="row between wrapflex">
        <h1 className="display" style={{ fontSize: "clamp(42px, 6vw, 72px)" }}>hey <span className="serif">coach</span> 👋</h1>
        <ActionButton url="/api/cron/reminders" method="GET" className="btn sm ghost" style={{ border: "var(--line)" }}>⚡ run reminders now</ActionButton>
      </div>
      <div className="grid g4" style={{ marginTop: 24 }}>
        {stats.map(([k, v, c, href]) => {
          const inner = (<><div className="v" style={{ fontSize: typeof v === "string" && v.length > 9 ? 24 : 36 }}>{v}</div><div className="k" style={{ color: "var(--ink)" }}>{k}</div></>);
          return href ? <Link key={k} href={href} className="card stat wobble" style={{ background: c }}>{inner}</Link> : <div key={k} className="card stat" style={{ background: c }}>{inner}</div>;
        })}
      </div>

      <div className="grid g2" style={{ marginTop: 22, alignItems: "start" }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">revenue · last 6 months (₹, USD ×85)</div>
          <div className="row" style={{ alignItems: "flex-end", gap: 12, height: 200, marginTop: 16 }}>
            {bars.map((b) => (
              <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <span className="mono" style={{ fontSize: 10 }}>{b.v ? `₹${Math.round(b.v / 1000)}k` : ""}</span>
                <div style={{ width: "100%", height: `${(b.v / maxBar) * 100}%`, minHeight: 4, background: "var(--lime)", border: "var(--line)", borderRadius: "8px 8px 0 0" }} />
                <span className="mono" style={{ fontSize: 11 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">newest clients</div>
          <div className="stack" style={{ marginTop: 12 }}>
            {recent.length === 0 && <p className="muted">no signups yet</p>}
            {recent.map((u) => (
              <Link key={String(u._id)} href={`/admin/users/${u._id}`} className="row between" style={{ padding: "8px 0", borderBottom: "1px dashed #c9c1ae" }}>
                <b>{u.name}</b>
                <span className="row" style={{ gap: 6 }}>
                  <span className={`pill ${u.subscription?.status === "active" ? "lime" : "gray"}`}>{u.subscription?.status === "active" ? `${u.subscription.plan}d` : u.onboarded ? "unpaid" : "signup only"}</span>
                  <span className="mono muted" style={{ fontSize: 11 }}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <h2 className="display" style={{ fontSize: 34, marginTop: 36 }}>alerts <span className="serif">to handle</span></h2>
      <div className="stack" style={{ marginTop: 14 }}>
        {alerts.length === 0 && <div className="card" style={{ padding: 24 }}>all clear ✨</div>}
        {alerts.map((a) => {
          const [e, c] = ALERT[a.type] || ["🔔", "#fffdf7"];
          return (
            <div key={String(a._id)} className="card row between wrapflex" style={{ padding: 14, gap: 12 }}>
              <div className="row" style={{ gap: 12 }}>
                <span style={{ width: 42, height: 42, borderRadius: "50%", border: "var(--line)", background: c, display: "grid", placeItems: "center", fontSize: 20, flex: "none" }}>{e}</span>
                <div>
                  <Link href={`/admin/users/${a.user?._id}`} style={{ fontWeight: 700, textDecoration: "underline" }}>{a.user?.name || "deleted user"}</Link>
                  <span className="pill gray" style={{ marginLeft: 8 }}>{a.type.replace("_", " ")}</span>
                  <div style={{ fontSize: 14 }}>{a.message}</div>
                </div>
              </div>
              <div className="row">
                <span className="mono muted" style={{ fontSize: 11 }}>{new Date(a.createdAt).toLocaleDateString("en-IN")}</span>
                <ActionButton url={`/api/admin/alerts/${a._id}`} method="PATCH" className="btn sm ghost" style={{ border: "var(--line)" }}>✓ done</ActionButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
