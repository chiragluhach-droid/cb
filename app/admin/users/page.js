import { db } from "@/lib/db";
import User from "@/models/User";
import Plan from "@/models/Plan";
import UsersTable from "./UsersTable";
import { plain } from "@/lib/userData";

export default async function Users() {
  await db();
  const users = await User.find({ role: "user" }).sort({ createdAt: -1 }).select("-passwordHash").lean();
  const plans = await Plan.find({ status: { $in: ["active", "review", "drafting"] } }).select("user status").lean();
  const planBy = {};
  for (const p of plans) (planBy[String(p.user)] ||= []).push(p.status);
  const rows = users.map((u) => ({
    id: String(u._id), name: u.name, email: u.email, stage: u.stage, diet: u.profile?.diet, conditions: (u.profile?.conditions || []).filter((c) => c !== "none"),
    status: u.subscription?.status || "none", plan: u.subscription?.plan, endsAt: u.subscription?.endsAt, lastLogAt: u.lastLogAt, onboarded: u.onboarded,
    planStatus: planBy[String(u._id)] || [], start: u.startWeightKg, weight: u.profile?.weightKg, createdAt: u.createdAt,
  }));
  return (
    <div style={{ maxWidth: 1300 }}>
      <h1 className="display" style={{ fontSize: 28 }}>all clients</h1>
      <UsersTable rows={plain(rows)} />
    </div>
  );
}
