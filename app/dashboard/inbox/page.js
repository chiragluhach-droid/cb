import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { coachName } from "@/lib/plans";
import Notification from "@/models/Notification";
import MarkRead from "./MarkRead";

const ICON = { nudge: "👀", checkin: "📏", renewal: "⏳", plan: "📋", coach: "💬" };
const BG = { nudge: "var(--butter)", checkin: "var(--sky)", renewal: "var(--orange)", plan: "var(--lime)", coach: "var(--lilac)" };

export default async function Page() {
  await db();
  const user = await getUser();
  const items = await Notification.find({ user: user._id }).sort({ createdAt: -1 }).limit(60).lean();
  return (
    <div style={{ maxWidth: 820 }}>
      <MarkRead any={items.some((n) => !n.read)} />
      <h1 className="display" style={{ fontSize: "clamp(42px, 6vw, 76px)" }}>from <span className="serif">{coachName()}</span></h1>
      <p className="muted" style={{ marginTop: 6 }}>Plan updates, check-in reminders and notes from your coach.</p>
      <div className="stack" style={{ marginTop: 26 }}>
        {items.length === 0 && <div className="card" style={{ padding: 30, textAlign: "center" }}>nothing yet, all quiet 🌙</div>}
        {items.map((n, k) => (
          <div key={String(n._id)} className="card reveal" style={{ padding: 18, display: "flex", gap: 14, transitionDelay: `${Math.min(k, 8) * 40}ms`, outline: n.read ? "none" : "3px solid var(--pink)", outlineOffset: 3 }}>
            <span style={{ fontSize: 26, width: 50, height: 50, flex: "none", borderRadius: "50%", border: "var(--line)", background: BG[n.kind], display: "grid", placeItems: "center" }}>{ICON[n.kind]}</span>
            <div style={{ flex: 1 }}>
              <div className="row between wrapflex"><b className="display" style={{ fontSize: 20 }}>{n.title}</b><span className="mono muted" style={{ fontSize: 11 }}>{new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span></div>
              <p style={{ marginTop: 4, whiteSpace: "pre-line" }}>{n.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
