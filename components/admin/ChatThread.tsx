"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { CoachAvatar } from "@/components/app/CoachAvatar";
import { ClientAvatar } from "@/components/admin/bits";
import { coachSend, markRead } from "@/lib/admin";
import type { Message } from "@/lib/demo-store";

const quick = ["Great week — keep going! 💪", "Log your weight tomorrow morning, before breakfast.", "I've updated your plan — have a look in My plan.", "Let's chat on a video call this week?"];

const time = (t: number) => new Date(t).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const dayLabel = (t: number) => {
  const d = new Date(t);
  const today = new Date();
  const y = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/** Coach's side of a client conversation. Marks the thread read while open. */
export function ChatThread({ clientId, name, messages, className = "" }: { clientId: string; name: string; messages: Message[]; className?: string }) {
  const [text, setText] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const lastAt = messages.at(-1)?.at ?? 0;
  const fromClient = messages.some((m) => m.from === "me");

  // Scroll down and mark read whenever a new message arrives.
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
    if (fromClient) markRead(clientId);
  }, [clientId, lastAt, fromClient]);

  const send = (t: string) => {
    coachSend(clientId, t);
    setText("");
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };

  let lastDay = "";
  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div ref={list} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#FBFBF9] px-4 py-5 sm:px-6" data-lenis-prevent>
        {messages.length === 0 && <p className="py-10 text-center text-sm text-stone">No messages yet. Say hello to {name.split(" ")[0]}.</p>}
        {messages.map((m) => {
          const dl = dayLabel(m.at);
          const showDay = dl !== lastDay;
          lastDay = dl;
          const mine = m.from === "coach";
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ink/35">{dl}</p>}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && <ClientAvatar name={name} className="h-7 w-7 text-[0.625rem]" />}
                <div
                  className={`max-w-[85%] rounded-[1.25rem] px-4 py-2.5 text-[0.9375rem] leading-relaxed sm:max-w-[70%] ${
                    mine ? "rounded-br-md bg-forest text-canvas" : "rounded-bl-md bg-white text-ink ring-1 ring-ink/[0.06]"
                  }`}
                >
                  {m.text}
                  <span className={`mt-1 block text-right text-[0.625rem] ${mine ? "text-canvas/45" : "text-ink/35"}`}>{time(m.at)}</span>
                </div>
                {mine && <CoachAvatar className="h-7 w-7" />}
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-ink/[0.06] bg-white p-3 sm:p-4">
        <div className="hide-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1">
          {quick.map((q) => (
            <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full bg-mint px-3.5 py-2 text-xs font-semibold text-brand-deep transition-colors hover:bg-brand hover:text-white">
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Reply to ${name.split(" ")[0]}…`}
            className="min-w-0 flex-1 rounded-full bg-[#F4F5F1] px-5 py-3.5 text-[0.9375rem] outline-none ring-1 ring-transparent transition-shadow placeholder:text-ink/35 focus:ring-brand"
            aria-label="Message"
          />
          <button type="submit" disabled={!text.trim()} aria-label="Send" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform active:scale-90 disabled:opacity-40">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
