"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MessageCircle } from "lucide-react";
import { ClientAvatar, PageTitle, StatusPill, timeAgo } from "@/components/admin/bits";
import { ChatThread } from "@/components/admin/ChatThread";
import { useAdmin } from "@/lib/admin";

export default function MessagesPage() {
  const { clients } = useAdmin();
  const threads = [...clients].sort((a, b) => b.unread - a.unread || (b.lastMessage?.at ?? 0) - (a.lastMessage?.at ?? 0));
  const [sel, setSel] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // ?c=<client id> opens that thread. On desktop the first thread opens by default.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const on = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", on);
    if (c) setSel(c);
    return () => mq.removeEventListener("change", on);
  }, []);

  const openId = sel ?? (isDesktop ? threads[0]?.user.id ?? null : null);
  const open = threads.find((t) => t.user.id === openId) ?? null;
  const unreadTotal = threads.reduce((s, t) => s + t.unread, 0);

  return (
    <div>
      <PageTitle eyebrow={unreadTotal ? `${unreadTotal} unread` : "All caught up"} title="Client" accent="messages." />

      <div className="mt-6 overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-ink/[0.06] lg:grid lg:h-[calc(100svh-15rem)] lg:min-h-[32rem] lg:grid-cols-[20rem_1fr]">
        {/* Threads */}
        <ul className={`divide-y divide-ink/[0.06] overflow-y-auto border-ink/[0.06] lg:block lg:border-r ${open ? "hidden" : "block"}`} data-lenis-prevent>
          {threads.map((t) => {
            const on = t.user.id === openId;
            return (
              <li key={t.user.id}>
                <button onClick={() => setSel(t.user.id)} className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${on ? "bg-mint/60" : "hover:bg-[#F7F8F5]"}`}>
                  <span className="relative">
                    <ClientAvatar name={t.user.name} />
                    {t.unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-brand px-1 text-[0.625rem] font-bold text-white ring-2 ring-white">{t.unread}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${t.unread ? "font-bold text-ink" : "font-semibold text-ink/80"}`}>{t.user.name}</span>
                      <span className="shrink-0 text-[0.6875rem] text-stone">{t.lastMessage ? timeAgo(t.lastMessage.at) : ""}</span>
                    </span>
                    <span className={`line-clamp-1 text-xs ${t.unread ? "font-medium text-ink/75" : "text-stone"}`}>
                      {t.lastMessage ? `${t.lastMessage.from === "coach" ? "You: " : ""}${t.lastMessage.text}` : "No messages yet"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Conversation */}
        {open ? (
          <div className="flex h-[calc(100svh-15rem)] min-h-[28rem] flex-col lg:h-auto lg:min-h-0">
            <div className="flex items-center gap-3 border-b border-ink/[0.06] px-4 py-3 sm:px-5">
              <button onClick={() => setSel(null)} aria-label="Back to threads" className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.05] lg:hidden">
                <ArrowLeft size={16} />
              </button>
              <ClientAvatar name={open.user.name} className="h-10 w-10 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{open.user.name}</p>
                <StatusPill status={open.status} className="!px-2 !py-0.5 !text-[0.625rem]" />
              </div>
              <Link href={`/admin/clients/${open.user.id}`} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink/[0.05] px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-canvas">
                Client <ArrowUpRight size={13} />
              </Link>
            </div>
            <ChatThread key={open.user.id} clientId={open.user.id} name={open.user.name} messages={open.data.messages} className="flex-1" />
          </div>
        ) : (
          <div className="hidden flex-col items-center justify-center gap-3 text-stone lg:flex">
            <MessageCircle size={28} className="text-ink/20" />
            <p className="text-sm">Pick a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
