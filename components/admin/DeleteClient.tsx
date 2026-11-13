"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2, X } from "lucide-react";
import type { User } from "@/lib/demo-store";
import { deleteClient } from "@/lib/admin";
import { inr } from "@/lib/plans";

/**
 * "Delete client" button + confirmation. `compact` shows just a trash icon
 * (for list rows). `onDeleted` runs after the client is gone.
 */
export function DeleteClientButton({ user, compact, onDeleted }: { user: User; compact?: boolean; onDeleted?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Delete ${user.name}`}
          title="Delete client"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50"
        >
          <Trash2 size={15} /> Delete client
        </button>
      )}
      <AnimatePresence>{open && <ConfirmDelete user={user} onClose={() => setOpen(false)} onDeleted={onDeleted} />}</AnimatePresence>
    </>
  );
}

function ConfirmDelete({ user, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const paidActive = user.access === "active" && user.subscription;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const go = async () => {
    setBusy(true);
    setError("");
    const r = await deleteClient(user.id);
    if (!r.ok) {
      setBusy(false);
      setError(r.error ?? "Couldn't delete.");
      return;
    }
    onClose();
    onDeleted?.();
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Delete ${user.name}`}
      data-lenis-prevent
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[1.75rem] bg-white p-6 sm:rounded-[1.75rem]"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={22} />
          </span>
          <button onClick={onClose} disabled={busy} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.05] disabled:opacity-40">
            <X size={16} />
          </button>
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-ink">Delete {user.name}?</h2>
        <p className="mt-1 break-all text-sm text-stone">{user.email}</p>
        <p className="mt-4 text-sm leading-relaxed text-ink/70">
          This permanently deletes their account, questionnaire, plan, daily logs, weigh-ins, photos and chat. <b className="text-ink">It can&apos;t be undone.</b> They can sign up again
          later as a new client.
        </p>
        {paidActive && (
          <p className="mt-3 rounded-2xl bg-warn/15 px-4 py-3 text-sm text-[#7A4F00]">
            They paid {inr(user.subscription!.amount)} and their plan is still active. Deleting doesn&apos;t refund them — refund from the Razorpay dashboard first if you need to.
          </p>
        )}
        {user.subscription && <p className="mt-3 text-xs text-ink/45">Payment records are kept for tax, without their name or contact details.</p>}
        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={onClose} disabled={busy} className="rounded-full bg-ink/[0.06] py-3.5 text-sm font-semibold text-ink disabled:opacity-50">
            Cancel
          </button>
          <button onClick={go} disabled={busy} className="flex items-center justify-center gap-2 rounded-full bg-red-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-70">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete forever
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
