"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Sparkles, Undo2 } from "lucide-react";
import { Card, CardTitle } from "@/components/app/ui";
import { ClientRow, applyAiDraft, undoAiDraft } from "@/lib/admin";
import { timeAgo } from "@/components/admin/bits";

type Status = { enabled: boolean; model: string; provider: string } | null;

/** "Draft with AI" / "Redo" for the coach. The result lands in the plan as edits, then the usual risk check and approval apply. */
export default function AiAssistant({ row }: { row: ClientRow }) {
  const [status, setStatus] = useState<Status>(null);
  const [instruction, setInstruction] = useState(row.data.aiDraft?.instruction ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const draft = row.data.aiDraft;

  useEffect(() => {
    let on = true;
    fetch("/api/ai-plan")
      .then((r) => r.json())
      .then((s) => on && setStatus(s))
      .catch(() => on && setStatus({ enabled: false, model: "", provider: "Groq" }));
    return () => {
      on = false;
    };
  }, []);

  const run = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy || !row.data.profile) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Questionnaire only — no name, email or phone leaves the browser.
        body: JSON.stringify({ profile: row.data.profile, previous: draft?.picks, instruction }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't draft a plan.");
      applyAiDraft(row.user.id, json.picks, { model: json.model, note: json.note, instruction: instruction.trim() || undefined });
    } catch (x) {
      setError((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sprout/25 blur-2xl" />
      <CardTitle action={status?.enabled ? <span className="rounded-full bg-mint px-2 py-0.5 text-[0.625rem] font-bold text-brand-deep">{status.provider}</span> : null}>AI assistant</CardTitle>

      {status && !status.enabled ? (
        <p className="relative text-sm text-stone">
          AI drafting is off. Add <code className="rounded bg-ink/[0.05] px-1 text-xs">GROQ_API_KEY</code> to <code className="rounded bg-ink/[0.05] px-1 text-xs">.env.local</code> and restart the dev server.
        </p>
      ) : (
        <form onSubmit={run} className="relative">
          <p className="text-sm text-stone">
            {draft ? "Not quite right? Redo for a different week, or steer it below." : "Let AI pick a fresh week from the dishes that suit this client. You still review and approve."}
          </p>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            maxLength={300}
            placeholder="Optional: more paneer, fewer rice dishes…"
            className="mt-3 w-full rounded-2xl bg-[#F4F5F1] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent placeholder:text-ink/35 focus:ring-brand"
            aria-label="Instruction for the AI"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={busy || !status}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest py-3 text-sm font-semibold text-canvas transition-colors hover:bg-brand disabled:opacity-60"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : draft ? <RefreshCw size={14} /> : <Sparkles size={14} className="text-sprout" />}
              {busy ? "Drafting…" : draft ? "Redo — try something else" : "Draft week with AI"}
            </button>
            {draft && !busy && (
              <button type="button" onClick={() => undoAiDraft(row.user.id)} aria-label="Undo AI draft" title="Back to the plan before AI" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] text-ink/60 transition-colors hover:bg-ink hover:text-canvas">
                <Undo2 size={15} />
              </button>
            )}
          </div>
          {error && <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{error}</p>}
          {draft && !error && (
            <motion.div key={draft.at} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl bg-mint/60 p-3.5">
              <p className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-deep">
                <Sparkles size={11} /> AI draft · {timeAgo(draft.at)}
              </p>
              {draft.note && <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{draft.note}</p>}
              <p className="mt-2 text-[0.6875rem] text-ink/45">{draft.model} · meals marked AI. Portions come from the engine.</p>
            </motion.div>
          )}
        </form>
      )}
    </Card>
  );
}
