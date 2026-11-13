"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Send, Video, X } from "lucide-react";
import { CoachAvatar } from "@/components/app/CoachAvatar";
import { coach } from "@/lib/site";
import { newId, useSession } from "@/lib/demo-store";
import { coachReply } from "@/lib/coach";
import { parsePlan } from "@/lib/plans";

const suggestions = ["Can I swap tonight's dinner?", "Wedding this weekend 😅", "Scale hasn't moved in 2 weeks", "Feeling hungry in the evenings"];

const time = (at: number) => new Date(at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const dayLabel = (at: number) => {
  const d = new Date(at);
  const t = new Date();
  const y = new Date();
  y.setDate(t.getDate() - 1);
  if (d.toDateString() === t.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

/** Next few call slots (demo). */
function slots() {
  const out: { label: string; day: string; at: Date }[] = [];
  for (let i = 1; out.length < 6 && i < 6; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0) continue;
    [10, 18].forEach((h) => {
      const at = new Date(d);
      at.setHours(h, 0, 0, 0);
      out.push({ day: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }), label: at.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }), at });
    });
  }
  return out.slice(0, 6);
}

export default function CoachPage() {
  const { user, data, update } = useSession();
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [booking, setBooking] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const count = data?.messages.length ?? 0;

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: count ? "smooth" : "auto" });
  }, [count, typing]);

  if (!user || !data) return null;
  const ninety = parsePlan(user.plan).duration === 90;

  const send = (msg: string) => {
    const m = msg.trim();
    if (!m || typing) return;
    setText("");
    update((d) => ({ ...d, messages: [...d.messages, { id: newId(), from: "me", text: m, at: Date.now() }] }));
    setTyping(true);
    timer.current = setTimeout(() => {
      setTyping(false);
      update((d) => ({ ...d, messages: [...d.messages, { id: newId(), from: "coach", text: coachReply(m, user.name), at: Date.now() }] }));
    }, 1400);
  };

  const book = (s: { day: string; label: string }) => {
    setBooking(false);
    send(`I'd like to book a video call on ${s.day} at ${s.label}.`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };

  let lastDay = "";

  return (
    <div className="flex h-[calc(100svh-11.5rem)] min-h-[24rem] flex-col lg:h-[calc(100svh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-t-[1.75rem] border-b border-ink/[0.06] bg-white p-4 sm:p-5">
        <CoachAvatar className="h-12 w-12" online />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{coach.name}</p>
          <p className="truncate text-xs text-brand-deep">Your Evowell coach · usually replies the same day</p>
        </div>
        {ninety ? (
          <button onClick={() => setBooking(true)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-canvas transition-colors hover:bg-brand">
            <Video size={14} /> <span className="hidden sm:inline">Book a</span> video call
          </button>
        ) : (
          <span className="hidden rounded-full bg-ink/[0.05] px-3 py-1.5 text-[0.6875rem] font-semibold text-ink/50 sm:inline">Video calls on 90-day plans</span>
        )}
      </div>

      {/* Messages */}
      <div ref={list} className="flex-1 space-y-2 overflow-y-auto bg-[#FBFBF9] px-4 py-5 sm:px-6" data-lenis-prevent>
        {data.messages.map((m) => {
          const dl = dayLabel(m.at);
          const showDay = dl !== lastDay;
          lastDay = dl;
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ink/35">{dl}</p>}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className={`flex items-end gap-2 ${m.from === "me" ? "justify-end" : "justify-start"}`}
              >
                {m.from !== "me" && <CoachAvatar className="h-7 w-7" />}
                <div
                  className={`max-w-[85%] rounded-[1.25rem] px-4 py-2.5 text-[0.9375rem] leading-relaxed sm:max-w-[70%] ${
                    m.from === "me" ? "rounded-br-md bg-forest text-canvas" : "rounded-bl-md bg-white text-ink ring-1 ring-ink/[0.06]"
                  }`}
                >
                  {m.text}
                  <span className={`mt-1 block text-right text-[0.625rem] ${m.from === "me" ? "text-canvas/45" : "text-ink/35"}`}>{time(m.at)}</span>
                </div>
              </motion.div>
            </div>
          );
        })}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2">
              <CoachAvatar className="h-7 w-7" />
              <span className="flex w-16 gap-1 rounded-[1.25rem] rounded-bl-md bg-white px-4 py-3.5 ring-1 ring-ink/[0.06]">
                {[0, 1, 2].map((n) => (
                  <motion.span key={n} className="h-1.5 w-1.5 rounded-full bg-ink/40" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: n * 0.12 }} />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="rounded-b-[1.75rem] border-t border-ink/[0.06] bg-white p-3 sm:p-4">
        <div className="hide-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={typing} className="shrink-0 rounded-full bg-mint px-3.5 py-2 text-xs font-semibold text-brand-deep transition-colors hover:bg-brand hover:text-white disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message your coach…"
            aria-label="Message"
            className="h-12 min-w-0 flex-1 rounded-full bg-[#F4F5F1] px-5 text-[0.9375rem] outline-none ring-1 ring-transparent placeholder:text-ink/35 focus:ring-brand"
          />
          <button type="submit" disabled={!text.trim() || typing} aria-label="Send" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-all hover:bg-brand-deep disabled:bg-ink/10 disabled:text-ink/30">
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Booking sheet */}
      <AnimatePresence>
        {booking && (
          <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBooking(false)}>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-[2rem] bg-canvas p-6 sm:rounded-[2rem]"
              role="dialog"
              aria-modal="true"
              aria-label="Book a video call"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-brand">
                    <CalendarCheck size={22} />
                  </span>
                  <p className="mt-4 text-xl font-semibold tracking-[-0.03em]">Book a 1:1 video call</p>
                  <p className="text-sm text-stone">20 minutes with {coach.name}, your coach. Included in your 90-day plan.</p>
                </div>
                <button onClick={() => setBooking(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.06]">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {slots().map((s) => (
                  <button key={s.at.toISOString()} onClick={() => book(s)} className="rounded-2xl bg-white p-3 text-left ring-1 ring-ink/10 transition-all hover:ring-brand">
                    <span className="block text-xs text-stone">{s.day}</span>
                    <span className="block text-base font-semibold">{s.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink/40">Demo — picking a slot sends a booking request in the chat.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
