import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { coachName } from "@/lib/plans";
import Notification from "@/models/Notification";
import MarkRead from "./MarkRead";
import Icon from "@/components/Icon";

const ICON = { nudge: ["bell", "var(--butter)", "#854d0e"], checkin: ["ruler", "var(--sky)", "#075985"], renewal: ["clock", "var(--orange)", "#9a3412"], plan: ["clipboard", "var(--lime)", "#166534"], coach: ["message", "var(--lilac)", "#5b21b6"] };

export default async function Page() {
  await db();
  const user = await getUser();
  const items = await Notification.find({ user: user._id }).sort({ createdAt: -1 }).limit(60).lean();
  return (
    <div className="dpage" style={{ maxWidth: 760 }}>
      <MarkRead any={items.some((n) => !n.read)} />
      <div className="ph"><div><h1 className="display">Inbox</h1><p>Plan updates, reminders and notes from {coachName()}.</p></div></div>
      <div className="card list" style={{ marginTop: 18, overflow: "hidden" }}>
        {items.length === 0 && <div className="muted" style={{ padding: 32, textAlign: "center", fontSize: 14 }}>No messages yet.</div>}
        {items.map((n) => {
          const [icon, bg, fg] = ICON[n.kind] || ICON.coach;
          return (
            <div key={String(n._id)} className={`inbox-item ${n.read ? "" : "unread"}`}>
              <span className="track__ic" style={{ width: 36, height: 36, borderRadius: 10, background: bg, color: fg }}><Icon name={icon} size={18} /></span>
              <div style={{ flex: 1, minWidth: 0, paddingRight: n.read ? 0 : 14 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{n.title}</div>
                <div className="muted" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</div>
                <p style={{ marginTop: 6, fontSize: 14, whiteSpace: "pre-line", color: "var(--ink-2)" }}>{n.body}</p>
              </div>
              {!n.read && <span className="unread-dot" aria-label="unread" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
