import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import SideNav from "@/components/SideNav";
import Plan from "@/models/Plan";
import Alert from "@/models/Alert";

export default async function AdminLayout({ children }) {
  await db();
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/login");
  const [reviews, alerts] = await Promise.all([Plan.countDocuments({ status: { $in: ["review", "drafting"] } }), Alert.countDocuments({ resolved: false, type: { $ne: "review" } })]);
  return (
    <div className="shell">
      <SideNav
        home="/admin"
        items={[
          ["/admin", "grid", "overview", alerts],
          ["/admin/reviews", "inbox", "plan reviews", reviews],
          ["/admin/users", "users", "clients"],
          ["/admin/payments", "card", "payments"],
          ["/admin/coupons", "tag", "coupons"],
        ]}
        footer={<div className="chip" style={{ justifyContent: "center" }}>Admin workspace</div>}
      />
      <main className="main">{children}</main>
    </div>
  );
}
