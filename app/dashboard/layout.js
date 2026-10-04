import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { unreadCount } from "@/lib/userData";
import { coachName } from "@/lib/plans";
import SideNav from "@/components/SideNav";
import { RevealOnScroll } from "@/components/fx";
import "./dashboard.css";

export default async function DashLayout({ children }) {
  await db();
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/start");
  if (user.role !== "admin" && user.subscription?.status !== "active") redirect("/checkout");
  const unread = await unreadCount(user._id);
  const daysLeft = user.subscription?.endsAt ? Math.max(0, Math.ceil((user.subscription.endsAt - Date.now()) / 86400000)) : null;

  return (
    <div className="shell">
      <SideNav
        home="/dashboard"
        profileHref="/dashboard/profile"
        mobileExtra={daysLeft != null && (
          <a href="/checkout" className="chip" style={daysLeft <= 7 ? { color: "#9a3412", background: "var(--orange)", borderColor: "#fed7aa" } : undefined}>
            {daysLeft} days left
          </a>
        )}
        items={[
          ["/dashboard", "home", "today"],
          ["/dashboard/plan", "clipboard", "plan"],
          ["/dashboard/workout", "dumbbell", "workout"],
          ["/dashboard/progress", "chart", "progress"],
          ["/dashboard/inbox", "message", "coach", unread],
        ]}
        footer={
          <div className="card" style={{ padding: 14, boxShadow: "none", background: "var(--paper)" }}>
            <div className="row" style={{ gap: 10 }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--brand-100)", color: "var(--brand-700)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14 }}>{coachName().charAt(0)}</span>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Your coach</div>
                <b>{coachName()}</b>
              </div>
            </div>
            {daysLeft != null && (
              <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                {daysLeft} days left · <a href="/checkout" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Renew</a>
              </div>
            )}
          </div>
        }
      />
      <main className="main">
        <RevealOnScroll />
        {children}
      </main>
    </div>
  );
}
