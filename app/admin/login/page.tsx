import type { Metadata } from "next";
import AdminLogin from "@/components/admin/AdminLogin";

export const metadata: Metadata = { title: "Coach sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return <AdminLogin />;
}
