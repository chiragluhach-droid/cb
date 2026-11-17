"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, Mail, Phone, Trash2 } from "lucide-react";
import { QuestionnaireAnswers } from "@/components/admin/ClientPanels";
import { ClientAvatar, planLabel, timeAgo } from "@/components/admin/bits";
import { Lead, deleteLead } from "@/lib/admin";
import { formatPhone } from "@/lib/demo-store";

/**
 * People who answered the questionnaire and left their name, email and phone,
 * but never entered the email code, so no account was made.
 */
export function LeadsList({ leads }: { leads: Lead[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const remove = async (email: string) => {
    setBusy(true);
    setErr("");
    const r = await deleteLead(email);
    setBusy(false);
    if (!r.ok) return setErr(r.error ?? "Couldn't delete.");
    setConfirm(null);
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">
        Didn&apos;t finish sign-up <span className="text-ink/35">{leads.length}</span>
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-stone">
        They answered the questionnaire and left their details but never entered the email code, so they have no account and haven&apos;t paid. You can contact them directly.
      </p>
      <ul className="mt-4 divide-y divide-ink/[0.06] overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-ink/[0.06]">
        {leads.map((l) => {
          const isOpen = open === l.email;
          return (
            <li key={l.email}>
              <button
                onClick={() => setOpen(isOpen ? null : l.email)}
                aria-expanded={isOpen}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F7F8F5] sm:px-6 lg:grid-cols-[minmax(0,2.2fr)_1.6fr_1.2fr_1fr_1.25rem] lg:gap-4"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <ClientAvatar name={l.name} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{l.name}</span>
                    <span className="block truncate text-xs text-stone">{l.email}</span>
                  </span>
                </span>
                <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-ink/60 lg:hidden">Not signed up</span>
                <span className="col-span-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone lg:contents">
                  <span className="lg:text-sm">{formatPhone(l.phone)}</span>
                  <span className="font-medium text-ink/75 lg:text-sm">{l.plan ? planLabel(l.plan) : "—"}</span>
                  <span className="lg:text-sm">{timeAgo(l.updatedAt)}</span>
                </span>
                <ChevronDown size={16} className={`hidden text-ink/30 transition-transform lg:block ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="border-t border-ink/[0.06] bg-[#FBFBF9] px-4 py-5 sm:px-6">
                      <div className="flex flex-wrap gap-2">
                        <a href={`mailto:${l.email}`} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-canvas">
                          <Mail size={14} /> Email
                        </a>
                        <a href={`tel:${l.phone}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink ring-1 ring-ink/10">
                          <Phone size={14} /> Call
                        </a>
                        <a
                          href={`https://wa.me/${l.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink ring-1 ring-ink/10"
                        >
                          WhatsApp
                        </a>
                        {confirm === l.email ? (
                          <span className="inline-flex items-center gap-2 text-xs">
                            <span className="text-stone">Remove {l.name.split(" ")[0]}?</span>
                            <button disabled={busy} onClick={() => remove(l.email)} className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-2 font-semibold text-white disabled:opacity-60">
                              {busy && <Loader2 size={12} className="animate-spin" />} Delete
                            </button>
                            <button onClick={() => setConfirm(null)} className="font-semibold text-ink/60 hover:text-ink">
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirm(l.email)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                            <Trash2 size={14} /> Remove
                          </button>
                        )}
                      </div>
                      {err && confirm === l.email && <p className="mt-2 text-xs font-medium text-red-600">{err}</p>}
                      <p className="mt-4 text-xs text-stone">
                        First seen {new Date(l.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {l.updatedAt !== l.createdAt && <> · last tried {timeAgo(l.updatedAt)}</>}
                      </p>
                      <div className="mt-3">
                        {l.profile ? <QuestionnaireAnswers profile={l.profile} name={l.name} /> : <p className="text-sm text-stone">No questionnaire answers saved.</p>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
