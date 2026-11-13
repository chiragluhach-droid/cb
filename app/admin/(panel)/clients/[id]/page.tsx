"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ClipboardList, Hourglass, LineChart, MessageCircle, Send, UserRound } from "lucide-react";
import { Card, Segmented } from "@/components/app/ui";
import { ClientAvatar, ProfileTags, StatusPill, planLabel } from "@/components/admin/bits";
import PlanReview from "@/components/admin/PlanReview";
import { ClientProfile, ClientProgress } from "@/components/admin/ClientPanels";
import { ChatThread } from "@/components/admin/ChatThread";
import { coachSend, useAdmin } from "@/lib/admin";

type Tab = "plan" | "progress" | "messages" | "profile";
const tabs: Tab[] = ["plan", "progress", "messages", "profile"];

export default function ClientPage() {
  const { id } = useParams<{ id: string }>();
  const { clients } = useAdmin();
  const row = clients.find((c) => c.user.id === id);
  const [tab, setTab] = useState<Tab>("plan");

  // Open a tab from the URL (?tab=messages) without useSearchParams.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (t && tabs.includes(t)) setTab(t);
  }, []);

  if (!row) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-ink">Client not found</p>
        <Link href="/admin/clients" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deep">
          <ArrowLeft size={14} /> All clients
        </Link>
      </div>
    );
  }

  const { user, data } = row;
  const first = user.name.split(" ")[0];
  const onPlan = data.planStatus === "approved";

  return (
    <div>
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/50 transition-colors hover:text-ink">
        <ArrowLeft size={15} /> Clients
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <ClientAvatar name={user.name} className="h-16 w-16 text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[2rem] font-medium leading-none tracking-[-0.05em] text-ink sm:text-4xl">{user.name}</h1>
            <StatusPill status={row.status} />
          </div>
          <p className="mt-1.5 text-sm text-stone">
            {planLabel(user.plan)}
            {onPlan ? ` · day ${row.day} of ${row.total}` : ""}
          </p>
          {data.profile && (
            <div className="mt-2">
              <ProfileTags profile={data.profile} />
            </div>
          )}
        </div>
        {row.reasons.length > 0 && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-xs text-red-700 sm:max-w-xs">
            {row.reasons.map((r) => (
              <p key={r}>• {r}</p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="w-max min-w-full sm:w-auto">
          <Segmented<Tab>
            id="client-tab"
            value={tab}
            onChange={setTab}
            options={[
              { v: "plan", l: <span className="inline-flex items-center gap-1.5"><ClipboardList size={14} /> {onPlan ? "Plan" : "Review"}{!onPlan && row.flags > 0 ? ` · ${row.flags}` : ""}</span> },
              { v: "progress", l: <span className="inline-flex items-center gap-1.5"><LineChart size={14} /> Progress</span> },
              { v: "messages", l: <span className="inline-flex items-center gap-1.5"><MessageCircle size={14} /> Chat{row.unread ? ` · ${row.unread}` : ""}</span> },
              { v: "profile", l: <span className="inline-flex items-center gap-1.5"><UserRound size={14} /> Profile</span> },
            ]}
          />
        </div>
      </div>

      <div className="mt-6">
        {tab === "plan" &&
          (data.profile ? (
            <PlanReview key={user.id} row={row} />
          ) : (
            <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:p-8">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink/[0.05] text-ink/50">
                <Hourglass size={24} />
              </span>
              <div className="flex-1">
                <p className="text-xl font-semibold tracking-[-0.03em] text-ink">{first} hasn&apos;t finished the questionnaire</p>
                <p className="mt-1 text-sm text-stone">The draft plan is built from their answers, so there&apos;s nothing to review yet.</p>
              </div>
              <button
                onClick={() => {
                  coachSend(user.id, `Hi ${first}! Finish the short questionnaire in your dashboard and I'll review your first plan within a day.`);
                  setTab("messages");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-brand"
              >
                <Send size={14} /> Send a reminder
              </button>
            </Card>
          ))}

        {tab === "progress" &&
          (data.profile ? (
            <ClientProgress row={row} />
          ) : (
            <Card>
              <p className="py-6 text-center text-sm text-stone">Progress shows once {first} has a plan.</p>
            </Card>
          ))}

        {tab === "messages" && (
          <div className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-ink/[0.06]">
            <ChatThread clientId={user.id} name={user.name} messages={data.messages} className="h-[calc(100svh-22rem)] min-h-[26rem]" />
          </div>
        )}

        {tab === "profile" && <ClientProfile row={row} />}
      </div>
    </div>
  );
}
