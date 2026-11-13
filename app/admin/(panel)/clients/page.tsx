"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Segmented } from "@/components/app/ui";
import { ClientAvatar, Empty, PageTitle, StatusPill, dayAgo, planLabel } from "@/components/admin/bits";
import { ClientStatus, useAdmin } from "@/lib/admin";

type Filter = "all" | ClientStatus;

export default function ClientsPage() {
  const { clients } = useAdmin();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const count = (f: Filter) => (f === "all" ? clients.length : clients.filter((c) => c.status === f).length);
  const shown = clients.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    const t = q.trim().toLowerCase();
    return !t || c.user.name.toLowerCase().includes(t) || c.user.email.includes(t) || c.user.phone.includes(t.replace(/\s/g, ""));
  });

  return (
    <div>
      <PageTitle eyebrow={`${clients.length} clients`} title="All" accent="clients." />

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block lg:w-72">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or phone"
            className="w-full rounded-2xl bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none ring-1 ring-ink/[0.08] placeholder:text-ink/35 focus:ring-2 focus:ring-brand"
          />
        </label>
        <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 lg:mx-0 lg:flex-1 lg:px-0">
          <div className="w-max lg:w-auto">
            <Segmented<Filter>
              id="client-filter"
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { v: "all", l: `All ${count("all")}` },
                { v: "review", l: `In review ${count("review")}` },
                { v: "active", l: `On track ${count("active")}` },
                { v: "attention", l: `Attention ${count("attention")}` },
                { v: "onboarding", l: `Pending ${count("onboarding")}` },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-ink/[0.06]">
        <div className="hidden grid-cols-[minmax(0,2.2fr)_1.4fr_1fr_1.2fr_0.9fr_1fr_1.25rem] gap-4 border-b border-ink/[0.06] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40 lg:grid">
          <span>Client</span>
          <span>Plan</span>
          <span>Progress</span>
          <span>Meals · 7d</span>
          <span>Weight</span>
          <span>Last log</span>
          <span />
        </div>
        {shown.length ? (
          <ul className="divide-y divide-ink/[0.06]">
            {shown.map((c, i) => {
              const losing = c.data.profile?.goal !== "build";
              const good = c.change === null ? null : losing ? c.change <= 0 : c.change >= 0;
              const onPlan = c.data.planStatus === "approved";
              return (
                <motion.li key={c.user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <Link
                    href={`/admin/clients/${c.user.id}`}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 px-4 py-4 transition-colors hover:bg-[#F7F8F5] sm:px-6 lg:grid-cols-[minmax(0,2.2fr)_1.4fr_1fr_1.2fr_0.9fr_1fr_1.25rem] lg:gap-4"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="relative">
                        <ClientAvatar name={c.user.name} />
                        {c.unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-brand ring-2 ring-white" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{c.user.name}</span>
                        <span className="block truncate text-xs text-stone">{c.user.email}</span>
                      </span>
                    </span>
                    <span className="lg:hidden">
                      <StatusPill status={c.status} />
                    </span>

                    <span className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone lg:col-span-1 lg:block">
                      <span className="block font-medium text-ink/75">{planLabel(c.user.plan)}</span>
                      <span className="hidden lg:mt-1 lg:block">
                        <StatusPill status={c.status} />
                      </span>
                      <span className="lg:hidden">{onPlan ? `Day ${c.day} of ${c.total}` : "Not started"}</span>
                      <span className="lg:hidden">{onPlan ? `${Math.round(c.adherence * 100)}% meals` : ""}</span>
                      {c.change !== null && onPlan && (
                        <span className={`lg:hidden ${good ? "text-brand-deep" : "text-red-600"}`}>
                          {c.change > 0 ? "+" : ""}
                          {c.change} kg
                        </span>
                      )}
                    </span>

                    <span className="hidden text-sm tabular-nums text-ink lg:block">
                      {onPlan ? (
                        <>
                          Day {c.day}
                          <span className="text-ink/40"> / {c.total}</span>
                          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-ink/[0.06]">
                            <span className="block h-full rounded-full bg-forest" style={{ width: `${(c.day / c.total) * 100}%` }} />
                          </span>
                        </>
                      ) : (
                        <span className="text-ink/35">—</span>
                      )}
                    </span>

                    <span className="hidden items-center gap-2 lg:flex">
                      {onPlan ? (
                        <>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
                            <span
                              className={`block h-full rounded-full ${c.adherence >= 0.75 ? "bg-brand" : c.adherence >= 0.6 ? "bg-warn" : "bg-red-400"}`}
                              style={{ width: `${Math.round(c.adherence * 100)}%` }}
                            />
                          </span>
                          <span className="w-9 text-right text-xs font-semibold tabular-nums text-ink">{Math.round(c.adherence * 100)}%</span>
                        </>
                      ) : (
                        <span className="text-sm text-ink/35">—</span>
                      )}
                    </span>

                    <span className="hidden text-sm tabular-nums lg:block">
                      {c.change !== null && onPlan ? (
                        <span className={`inline-flex items-center gap-1 font-semibold ${good ? "text-brand-deep" : "text-red-600"}`}>
                          {c.change <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                          {c.change > 0 ? "+" : ""}
                          {c.change} kg
                        </span>
                      ) : (
                        <span className="text-ink/35">{c.current ? `${c.current} kg` : "—"}</span>
                      )}
                    </span>

                    <span className="hidden text-sm text-stone lg:block">{dayAgo(c.lastActive)}</span>
                    <ChevronRight size={16} className="hidden text-ink/25 transition-transform group-hover:translate-x-0.5 group-hover:text-ink lg:block" />
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        ) : (
          <div className="p-4">
            <Empty>No clients match that.</Empty>
          </div>
        )}
      </div>
    </div>
  );
}
