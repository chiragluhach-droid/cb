"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, Dumbbell, Home, LineChart, Loader2, LogOut, MessageCircle, UserRound } from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { SealLogo } from "@/components/brand/SealLogo";
import { Bar } from "@/components/app/ui";
import { canUseApp, logout, useSession } from "@/lib/demo-store";
import { parsePlan, plans } from "@/lib/plans";

export const appNav = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/dashboard/plan", label: "My plan", short: "Plan", icon: CalendarDays },
  { href: "/dashboard/workout", label: "Workout", icon: Dumbbell },
  { href: "/dashboard/progress", label: "Progress", icon: LineChart },
  { href: "/dashboard/coach", label: "Coach", icon: MessageCircle },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function planDay(startDate: string, total: number) {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const day = Math.floor((Date.now() - start) / 86400000) + 1;
  return { day: Math.max(1, Math.min(total, day)), total };
}

export default function Shell({ children }: { children: ReactNode }) {
  const { hydrated, user, data } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!canUseApp(user)) router.replace(`/checkout?plan=${user.plan}`);
    else if (!data?.profile) router.replace("/onboarding");
  }, [hydrated, user, data?.profile, router, pathname]);

  if (!hydrated || !user || !canUseApp(user) || !data?.profile) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-canvas">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  const plan = parsePlan(user.plan);
  const { day, total } = planDay(data.startDate, plan.duration);
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));
  const coachLast = data.messages[data.messages.length - 1];
  const coachDot = coachLast?.from === "coach" && !pathname.startsWith("/dashboard/coach");

  const signOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-[100svh] bg-[#F4F5F1]">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col border-r border-ink/[0.06] bg-white px-5 py-6 lg:flex">
        <Link href="/dashboard" className="px-2" aria-label="Evowell dashboard">
          <SealLogo alwaysWordmark size="h-10 w-10" text="text-[1.4rem]" />
        </Link>
        <nav className="mt-10 space-y-1" aria-label="Dashboard">
          {appNav.map((n) => {
            const on = isActive(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[0.9375rem] font-semibold transition-colors ${on ? "text-canvas" : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink"}`}
              >
                {on && <motion.span layoutId="side-pill" className="absolute inset-0 rounded-2xl bg-forest" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
                <Icon size={18} className={`relative ${on ? "text-sprout" : ""}`} />
                <span className="relative">{n.label}</span>
                {n.href === "/dashboard/coach" && coachDot && <span className="relative ml-auto h-2 w-2 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-[1.5rem] bg-mint p-4">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-brand-deep/70">{plans[plan.kind].name}</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              Day {day} <span className="font-medium text-ink/45">of {total}</span>
            </p>
            <div className="mt-3">
              <Bar value={day / total} track="bg-white" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-1">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-bold text-sprout">{initials(user.name)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
              <span className="block truncate text-xs text-stone">{user.email}</span>
            </span>
            <button onClick={signOut} aria-label="Log out" className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/[0.05] hover:text-ink">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar — phones/tablets */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/[0.06] bg-white/85 px-4 py-2 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" aria-label="Evowell dashboard">
          <SealLogo alwaysWordmark size="h-9 w-9" text="text-[1.3rem]" />
        </Link>
        <Link
          href="/dashboard/profile"
          aria-label="Profile"
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${isActive("/dashboard/profile") ? "bg-brand text-white" : "bg-forest text-sprout"}`}
        >
          {initials(user.name)}
        </Link>
      </header>

      <main className="pb-24 lg:pb-12 lg:pl-[17rem]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:py-10">{children}</div>
      </main>

      {/* Bottom tabs — phones/tablets */}
      <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/[0.06] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pt-1">
          {appNav.slice(0, 5).map((n) => {
            const on = isActive(n.href);
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[0.59375rem] font-semibold transition-colors ${on ? "text-brand" : "text-ink/45"}`}>
                {on && <motion.span layoutId="tab-pill" className="absolute inset-x-3 top-0 h-[3px] rounded-full bg-brand" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
                <span className="relative">
                  <Icon size={18} />
                  {n.href === "/dashboard/coach" && coachDot && <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />}
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
