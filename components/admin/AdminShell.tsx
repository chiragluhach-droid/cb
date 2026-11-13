"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, ClipboardCheck, CreditCard, LayoutGrid, Loader2, LogOut, MessageCircle, Users } from "lucide-react";
import { SealLogo } from "@/components/brand/SealLogo";
import { CoachAvatar } from "@/components/app/CoachAvatar";
import { adminSignOut, ensureSeeded, useAdmin } from "@/lib/admin";
import { coach } from "@/lib/site";

export default function AdminShell({ children }: { children: ReactNode }) {
  const { hydrated, signedIn, clients } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!signedIn) router.replace("/admin/login");
    else ensureSeeded();
  }, [hydrated, signedIn, router]);

  if (!hydrated || !signedIn) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-forest">
        <Loader2 className="animate-spin text-sprout" />
      </div>
    );
  }

  const reviews = clients.filter((c) => c.status === "review").length;
  const unread = clients.reduce((s, c) => s + c.unread, 0);
  const nav = [
    { href: "/admin", label: "Overview", icon: LayoutGrid },
    { href: "/admin/reviews", label: "Reviews", icon: ClipboardCheck, badge: reviews },
    { href: "/admin/clients", label: "Clients", icon: Users },
    { href: "/admin/messages", label: "Messages", icon: MessageCircle, badge: unread },
    { href: "/admin/subscriptions", label: "Subscriptions", short: "Plans", icon: CreditCard },
  ];
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  const signOut = () => {
    adminSignOut();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-[100svh] bg-[#F4F5F1]">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col bg-forest px-5 py-6 text-canvas lg:flex">
        <div className="flex items-center justify-between px-2">
          <Link href="/admin" aria-label="Evowell coach panel">
            <SealLogo tone="dark" alwaysWordmark size="h-10 w-10" text="text-[1.4rem]" />
          </Link>
          <span className="rounded-full bg-sprout/15 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-sprout">Coach</span>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Coach panel">
          {nav.map((n) => {
            const on = isActive(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[0.9375rem] font-semibold transition-colors ${on ? "text-forest" : "text-canvas/60 hover:bg-canvas/[0.06] hover:text-canvas"}`}
              >
                {on && <motion.span layoutId="admin-side-pill" className="absolute inset-0 rounded-2xl bg-sprout" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
                <Icon size={18} className="relative" />
                <span className="relative">{n.label}</span>
                {!!n.badge && (
                  <span className={`relative ml-auto min-w-[1.375rem] rounded-full px-1.5 py-0.5 text-center text-[0.6875rem] font-bold tabular-nums ${on ? "bg-forest text-sprout" : "bg-warn text-forest"}`}>
                    {n.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <a href="/" target="_blank" className="flex items-center justify-between rounded-2xl bg-canvas/[0.05] px-4 py-3 text-sm font-semibold text-canvas/70 transition-colors hover:bg-canvas/10 hover:text-canvas">
            View public site <ArrowUpRight size={15} />
          </a>
          <div className="flex items-center gap-3 px-1">
            <CoachAvatar className="h-10 w-10" online ring="ring-forest" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{coach.name}</span>
              <span className="block truncate text-xs text-canvas/50">Head coach · admin</span>
            </span>
            <button onClick={signOut} aria-label="Sign out" className="flex h-9 w-9 items-center justify-center rounded-full text-canvas/50 transition-colors hover:bg-canvas/10 hover:text-canvas">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar — phones/tablets */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-forest px-4 py-2 text-canvas lg:hidden">
        <Link href="/admin" aria-label="Evowell coach panel" className="flex items-center gap-2">
          <SealLogo tone="dark" alwaysWordmark size="h-9 w-9" text="text-[1.3rem]" />
          <span className="rounded-full bg-sprout/15 px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-sprout">Coach</span>
        </Link>
        <button onClick={signOut} aria-label="Sign out" className="flex items-center gap-2 rounded-full p-0.5 pr-2.5 text-xs font-semibold text-canvas/60">
          <CoachAvatar className="h-8 w-8" />
          <LogOut size={14} />
        </button>
      </header>

      <main className="pb-24 lg:pb-12 lg:pl-[17rem]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:py-10">{children}</div>
      </main>

      {/* Bottom tabs — phones/tablets */}
      <nav aria-label="Coach panel" className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/[0.06] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pt-1">
          {nav.map((n) => {
            const on = isActive(n.href);
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[0.59375rem] font-semibold transition-colors ${on ? "text-brand" : "text-ink/45"}`}>
                {on && <motion.span layoutId="admin-tab-pill" className="absolute inset-x-3 top-0 h-[3px] rounded-full bg-brand" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
                <span className="relative">
                  <Icon size={18} />
                  {!!n.badge && <span className="absolute -right-2 -top-1 min-w-[1rem] rounded-full bg-warn px-1 text-center text-[0.5625rem] font-bold leading-4 text-forest ring-2 ring-white">{n.badge}</span>}
                </span>
                {n.short ?? n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
