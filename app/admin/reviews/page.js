import { db } from "@/lib/db";
import Link from "next/link";
import Plan from "@/models/Plan";

const REASON = { initial: ["first plan", "var(--lime)"], progress_adjust: ["weight dropped", "var(--sky)"], plateau: ["plateau", "var(--orange)"], stage_change: ["goal reached", "var(--pink)"], manual: ["manual", "var(--lilac)"] };

export default async function Reviews() {
  await db();
  const plans = await Plan.find({ status: { $in: ["review", "drafting"] } }).sort({ createdAt: 1 }).populate("user", "name profile.conditions profile.diet").lean();
  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 className="display" style={{ fontSize: "clamp(42px, 6vw, 72px)" }}>plan <span className="serif">reviews</span></h1>
      <p className="muted" style={{ marginTop: 6 }}>Nothing reaches a client until you approve it. Oldest first.</p>
      <div className="stack" style={{ marginTop: 24 }}>
        {plans.length === 0 && <div className="card" style={{ padding: 30 }}>inbox zero 🧘 no plans waiting.</div>}
        {plans.map((p) => {
          const [l, c] = REASON[p.reason] || REASON.manual;
          const hrs = Math.round((Date.now() - new Date(p.createdAt)) / 3600000);
          return (
            <Link key={String(p._id)} href={`/admin/users/${p.user?._id}?plan=${p._id}`} className="card row between wrapflex wobble" style={{ padding: 18, gap: 12 }}>
              <div>
                <b className="display" style={{ fontSize: 22 }}>{p.user?.name}</b>
                <div className="row wrapflex" style={{ gap: 6, marginTop: 6 }}>
                  <span className="pill" style={{ background: c }}>{l}</span>
                  <span className="pill gray">v{p.version}</span>
                  <span className="pill gray">{p.status === "drafting" ? "hand-written draft" : p.source === "ai" ? "ai draft" : "engine draft"}</span>
                  <span className="pill gray">{p.user?.profile?.diet}</span>
                  {(p.user?.profile?.conditions || []).filter((x) => x !== "none").map((x) => <span key={x} className="pill pink">{x}</span>)}
                </div>
              </div>
              <div className="row">
                <span className="mono" style={{ fontSize: 12, color: hrs > 12 ? "#b42318" : "var(--muted)" }}>waiting {hrs}h</span>
                <span className="btn sm lime">review →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
