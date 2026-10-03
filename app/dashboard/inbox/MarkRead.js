"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarkRead({ any }) {
  const router = useRouter();
  useEffect(() => {
    if (!any) return;
    const t = setTimeout(() => fetch("/api/notifications", { method: "POST" }).then(() => router.refresh()), 1500);
    return () => clearTimeout(t);
  }, [any, router]);
  return null;
}
