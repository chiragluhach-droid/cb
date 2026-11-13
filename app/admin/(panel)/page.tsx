"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, ArrowUpRight, ClipboardCheck, MessageCircle, ShieldCheck, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Card, CardTitle, Num } from "@/components/app/ui";
import { ClientAvatar, Empty, ProfileTags, planLabel, timeAgo } from "@/components/admin/bits";
import { useAdmin } from "@/lib/admin";
import { inr, parsePlan, plans } from "@/lib/plans";
import { priceFor, useSettings } from "@/lib/settings";
import { coach } from "@/lib/site";

const greeting = (h: number) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

export default function AdminOverview() {
  const { clients } = useAdmin();
  const settings = useSettings();
  const now = new Date();

  const review = clients.filter((c) => c.status === "review");
  const attention = clients.filter((c) => c.status === "attention");
  const onPlan = clients.filter((c) => c.data.planStatus === "approved");
  const unreadThreads = clients.filter((c) => c.unread > 0).sort((a, b) => (b.lastMessage?.at ?? 0) - (a.lastMessage?.at ?? 0));
  const unread = clients.reduce((s, c) => s + c.unread, 0);
  const avgAdherence = onPlan.length ? onPlan.reduce((s, c) => s + c.adherence, 0) / onPlan.length : 0;

  const booked = clients.reduce((s, c) => {
    const p = parsePlan(c.user.plan);
    return s + priceFor(settings, p.kind, p.duration);
  }, 0);
  const mix = (["meal", "meal-workout"] as const).flatMap((k) =>
    ([30, 90] as const).map((d) => ({ label: `${plans[k].name} · ${d}d`, n: clients.filter((c) => c.user.plan === `${k}-${d}`).length }))
  );
  const maxMix = Math.max(1, ...mix.map((m) => m.n));

  const kpis = [
    { label: "On a plan", value: onPlan.length, icon: Users, note: `${clients.length} clients in total`, href: "/admin/clients" },
    { label: "Awaiting review", value: review.length, icon: ClipboardCheck, note: review.length ? "Drafts ready for you" : "All caught up", href: "/admin/reviews", warn: review.length > 0 },
    { label: "Unread messages", value: unread, icon: MessageCircle, note: unreadThreads.length ? `From ${unreadThreads.length} client${unreadThreads.length === 1 ? "" : "s"}` : "Inbox zero", href: "/admin/messages", warn: unread > 0 },
    { label: "Meals ticked · 7 days", value: Math.round(avgAdherence * 100), suffix: "%", icon: ShieldCheck, note: "Average across active plans", href: "/admin/clients" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-stone">{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 text-[2.25rem] font-medium leading-[1] tracking-[-0.055em] text-ink sm:text-5xl">
            {greeting(now.getHours())}, <span className="font-serif italic text-brand">{coach.name}.</span>
          </h1>
        </div>
        {review.length > 0 && (
          <Link href={`/admin/clients/${review[0].user.id}`} className="group inline-flex w-fit items-center gap-2 rounded-full bg-ink py-2 pl-5 pr-2 text-sm font-semibold text-canvas transition-colors hover:bg-brand">
            Start reviewing
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-ink transition-transform group-hover:rotate-45">
              <ArrowUpRight size={14} />
            </span>
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={k.href} className="group block h-full rounded-[1.5rem] bg-white p-4 ring-1 ring-ink/[0.06] transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(14,26,19,0.5)] sm:p-5">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${k.warn ? "bg-warn/20 text-[#8A5A00]" : "bg-mint text-brand"}`}>
                  <Icon size={17} />
                </span>
                <p className="mt-4 text-3xl font-semibold tabular-nums tracking-[-0.05em] text-ink sm:text-4xl">
                  <Num value={k.value} />
                  {k.suffix}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">{k.label}</p>
                <p className="mt-0.5 text-xs text-stone">{k.note}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-4 lg:col-span-8 lg:space-y-6">
          {/* Review queue */}
          <Card>
            <CardTitle action={<Link href="/admin/reviews" className="text-xs font-semibold text-brand-deep">See all</Link>}>Review queue</CardTitle>
            {review.length ? (
              <ul className="space-y-2">
                {review.map((c) => (
                  <li key={c.user.id}>
                    <Link href={`/admin/clients/${c.user.id}`} className="group flex items-center gap-3 rounded-2xl bg-[#F7F8F5] p-3 transition-colors hover:bg-mint/70 sm:p-4">
                      <ClientAvatar name={c.user.name} />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-ink">
                          {c.user.name}
                          <span className="text-xs font-medium text-stone">{planLabel(c.user.plan)} · signed up {timeAgo(c.user.createdAt)}</span>
                        </p>
                        {c.data.profile && (
                          <div className="mt-1.5">
                            <ProfileTags profile={c.data.profile} />
                          </div>
                        )}
                      </div>
                      <span
                        className={`hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold sm:inline-flex ${
                          c.flags ? "bg-warn/20 text-[#8A5A00]" : "bg-mint text-brand-deep"
                        }`}
                      >
                        {c.flags ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                        {c.flags ? `${c.flags} flag${c.flags === 1 ? "" : "s"}` : "No flags"}
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No drafts waiting. New sign-ups land here once they finish the questionnaire.</Empty>
            )}
          </Card>

          {/* Adherence */}
          <Card>
            <CardTitle action={<span className="text-xs text-stone">Meals ticked, last 7 days</span>}>How clients are doing</CardTitle>
            {onPlan.length ? (
              <ul className="space-y-3">
                {[...onPlan]
                  .sort((a, b) => b.adherence - a.adherence)
                  .map((c, i) => {
                    const losing = c.data.profile?.goal !== "build";
                    const good = c.change === null ? null : losing ? c.change <= 0 : c.change >= 0;
                    return (
                      <li key={c.user.id}>
                        <Link href={`/admin/clients/${c.user.id}`} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,11rem)_1fr_6rem]">
                          <span className="flex min-w-0 items-center gap-2.5">
                            <ClientAvatar name={c.user.name} className="h-8 w-8 text-[0.6875rem]" />
                            <span className="truncate text-sm font-semibold text-ink">{c.user.name.split(" ")[0]}</span>
                          </span>
                          <span className="relative h-2.5 overflow-hidden rounded-full bg-ink/[0.06]">
                            <motion.span
                              className={`absolute inset-y-0 left-0 rounded-full ${c.adherence >= 0.75 ? "bg-brand" : c.adherence >= 0.6 ? "bg-warn" : "bg-red-400"}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.round(c.adherence * 100)}%` }}
                              transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </span>
                          <span className="flex items-center justify-end gap-2 text-xs tabular-nums">
                            <b className="text-ink">{Math.round(c.adherence * 100)}%</b>
                            {c.change !== null && (
                              <span className={`hidden items-center gap-0.5 sm:inline-flex ${good ? "text-brand-deep" : "text-red-600"}`}>
                                {c.change <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                                {c.change > 0 ? "+" : ""}
                                {c.change}kg
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <Empty>Once you approve a plan, the client&apos;s progress shows here.</Empty>
            )}
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4 lg:space-y-6">
          {/* Needs attention */}
          <Card className="bg-forest text-canvas ring-0">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-canvas/50">Needs attention</span>
              <AlertTriangle size={16} className="text-warn" />
            </div>
            {attention.length ? (
              <ul className="space-y-2">
                {attention.map((c) => (
                  <li key={c.user.id}>
                    <Link href={`/admin/clients/${c.user.id}`} className="flex items-start gap-3 rounded-2xl bg-canvas/[0.06] p-3 transition-colors hover:bg-canvas/10">
                      <ClientAvatar name={c.user.name} className="h-9 w-9 text-xs" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{c.user.name}</span>
                        {c.reasons.map((r) => (
                          <span key={r} className="block text-xs text-canvas/60">
                            {r}
                          </span>
                        ))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-canvas/60">Everyone&apos;s logging and moving in the right direction.</p>
            )}
          </Card>

          {/* Inbox */}
          <Card>
            <CardTitle action={<Link href="/admin/messages" className="text-xs font-semibold text-brand-deep">Inbox</Link>}>Waiting for a reply</CardTitle>
            {unreadThreads.length ? (
              <ul className="space-y-1">
                {unreadThreads.map((c) => (
                  <li key={c.user.id}>
                    <Link href={`/admin/messages?c=${c.user.id}`} className="flex items-start gap-3 rounded-2xl p-2 transition-colors hover:bg-ink/[0.03]">
                      <ClientAvatar name={c.user.name} className="h-9 w-9 text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-ink">{c.user.name}</span>
                          <span className="shrink-0 text-[0.6875rem] text-stone">{c.lastMessage && timeAgo(c.lastMessage.at)}</span>
                        </span>
                        <span className="line-clamp-2 text-xs text-stone">{c.lastMessage?.text}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No unread messages.</Empty>
            )}
          </Card>

          {/* Plans */}
          <Card>
            <CardTitle action={<Link href="/admin/subscriptions" className="text-xs font-semibold text-brand-deep">Manage</Link>}>Plans sold</CardTitle>
            <p className="text-3xl font-semibold tabular-nums tracking-[-0.05em] text-ink">{inr(booked)}</p>
            <p className="text-xs text-stone">Plan value at current prices · no online payments yet</p>
            <ul className="mt-5 space-y-2.5">
              {mix.map((m) => (
                <li key={m.label} className="text-xs">
                  <span className="flex justify-between">
                    <span className="font-medium text-ink/70">{m.label}</span>
                    <b className="tabular-nums text-ink">{m.n}</b>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                    <motion.span className="block h-full rounded-full bg-forest" initial={{ width: 0 }} animate={{ width: `${(m.n / maxMix) * 100}%` }} transition={{ duration: 0.7 }} />
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
