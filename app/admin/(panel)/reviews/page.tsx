"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Hourglass, Send, ShieldCheck } from "lucide-react";
import { Card, CardTitle } from "@/components/app/ui";
import { ClientAvatar, Empty, PageTitle, ProfileTags, planLabel, timeAgo } from "@/components/admin/bits";
import { coachSend, reviewPlan, useAdmin } from "@/lib/admin";
import { dayNames } from "@/lib/workouts";

export default function ReviewsPage() {
  const { clients } = useAdmin();
  const review = clients.filter((c) => c.status === "review").sort((a, b) => a.user.createdAt - b.user.createdAt);
  const pending = clients.filter((c) => c.status === "onboarding");

  return (
    <div>
      <PageTitle eyebrow={`${review.length} draft${review.length === 1 ? "" : "s"} waiting · oldest first`} title="Plan" accent="reviews." />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {review.map((c, i) => {
          const flags = c.data.profile ? reviewPlan(c.data.profile, c.data.planEdits).flags : [];
          return (
            <motion.div key={c.user.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/admin/clients/${c.user.id}`} className="group block h-full rounded-[1.75rem] bg-white p-5 ring-1 ring-ink/[0.06] transition-shadow hover:shadow-[0_24px_50px_-30px_rgba(14,26,19,0.55)] sm:p-6">
                <div className="flex items-start gap-3">
                  <ClientAvatar name={c.user.name} className="h-12 w-12 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold tracking-[-0.02em] text-ink">{c.user.name}</p>
                    <p className="text-xs text-stone">
                      {planLabel(c.user.plan)} · signed up {timeAgo(c.user.createdAt)}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-colors group-hover:bg-brand">
                    <ArrowRight size={15} />
                  </span>
                </div>
                {c.data.profile && (
                  <div className="mt-4">
                    <ProfileTags profile={c.data.profile} />
                  </div>
                )}
                <div className="mt-4 border-t border-ink/[0.06] pt-4">
                  {flags.length ? (
                    <ul className="space-y-1.5">
                      {flags.slice(0, 3).map((f) => (
                        <li key={`${f.day}-${f.slot}-${f.reason}`} className="flex items-start gap-2 text-sm">
                          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
                          <span className="text-ink/75">
                            <b className="font-semibold text-ink">{dayNames[f.day]} {f.slot}:</b> {f.dish} — {f.reason}
                          </span>
                        </li>
                      ))}
                      {flags.length > 3 && <li className="pl-6 text-xs text-stone">+{flags.length - 3} more</li>}
                    </ul>
                  ) : (
                    <p className="flex items-center gap-2 text-sm font-medium text-brand-deep">
                      <ShieldCheck size={15} /> No risk flags — check the totals and approve.
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
      {review.length === 0 && (
        <div className="mt-6">
          <Empty>No drafts waiting. New sign-ups land here as soon as they finish the questionnaire.</Empty>
        </div>
      )}

      <Card className="mt-6">
        <CardTitle action={<Hourglass size={15} className="text-ink/35" />}>Signed up, questionnaire not done</CardTitle>
        {pending.length ? (
          <ul className="space-y-2">
            {pending.map((c) => {
              const nudged = c.data.messages.some((m) => m.from === "coach" && /questionnaire/i.test(m.text));
              return (
                <li key={c.user.id} className="flex items-center gap-3 rounded-2xl bg-[#F7F8F5] p-3">
                  <ClientAvatar name={c.user.name} className="h-9 w-9 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{c.user.name}</span>
                    <span className="block text-xs text-stone">
                      {planLabel(c.user.plan)} · {timeAgo(c.user.createdAt)}
                    </span>
                  </span>
                  <button
                    disabled={nudged}
                    onClick={() => coachSend(c.user.id, `Hi ${c.user.name.split(" ")[0]}! Your plan is ready to be built — finish the short questionnaire in your dashboard and I'll review your first draft within a day.`)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-canvas transition-colors hover:bg-brand disabled:bg-mint disabled:text-brand-deep"
                  >
                    <Send size={12} /> {nudged ? "Reminder sent" : "Send reminder"}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Everyone who signed up has finished the questionnaire.</Empty>
        )}
      </Card>
    </div>
  );
}
