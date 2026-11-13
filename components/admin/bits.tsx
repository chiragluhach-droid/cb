"use client";

import { ReactNode } from "react";
import type { ClientStatus } from "@/lib/admin";
import type { Profile } from "@/lib/demo-store";
import { parsePlan, plans } from "@/lib/plans";
import { initials } from "@/components/app/Shell";

export const dietLabel = { veg: "Veg", jain: "Jain", egg: "Egg", nonveg: "Non-veg", vegan: "Vegan" } as const;
export const goalLabel = { lose: "Fat loss", tone: "Tone up", build: "Muscle gain" } as const;
export const condLabel = { pcos: "PCOS", thyroid: "Thyroid", diabetes: "Diabetes", bp: "BP" } as const;
export const activityLabel = { sedentary: "Sedentary", light: "Lightly active", moderate: "Moderately active", very: "Very active" } as const;

export const planLabel = (id: string) => {
  const p = parsePlan(id);
  return `${plans[p.kind].name} · ${p.duration}d`;
};

export const statusMeta: Record<ClientStatus, { label: string; cls: string; dot: string }> = {
  review: { label: "In review", cls: "bg-warn/15 text-[#8A5A00]", dot: "bg-warn" },
  active: { label: "On track", cls: "bg-mint text-brand-deep", dot: "bg-brand" },
  attention: { label: "Needs attention", cls: "bg-red-50 text-red-700", dot: "bg-red-500" },
  onboarding: { label: "Questionnaire pending", cls: "bg-ink/[0.05] text-ink/55", dot: "bg-ink/30" },
};

export function StatusPill({ status, className = "" }: { status: ClientStatus; className?: string }) {
  const m = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${m.cls} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

const tints = ["bg-[#DCEFE2] text-brand-deep", "bg-[#F6E7C8] text-[#7A5200]", "bg-[#E4E1F5] text-[#4B3F96]", "bg-[#F7DCDC] text-[#9A2F2F]", "bg-[#D9ECF2] text-[#1F5E73]"];

/** Initials avatar with a stable colour per client. */
export function ClientAvatar({ name, className = "h-10 w-10 text-sm" }: { name: string; className?: string }) {
  const tint = tints[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % tints.length];
  return <span className={`flex shrink-0 items-center justify-center rounded-full font-bold ${tint} ${className}`}>{initials(name)}</span>;
}

export function timeAgo(t: number) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export const dayAgo = (key: string | null) => {
  if (!key) return "—";
  const d = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(`${key}T00:00:00`).getTime()) / 86400000);
  return d <= 0 ? "Today" : d === 1 ? "Yesterday" : `${d} days ago`;
};

/** Short tags for a client's questionnaire (diet, goal, conditions, allergies). */
export function ProfileTags({ profile, dark = false }: { profile: Profile; dark?: boolean }) {
  const tags = [dietLabel[profile.diet], goalLabel[profile.goal], ...profile.conditions.map((c) => condLabel[c]), ...profile.allergies.map((a) => `No ${a}`)];
  return (
    <span className="flex flex-wrap gap-1.5">
      {tags.map((t, i) => (
        <span
          key={t}
          className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
            i > 1 ? (dark ? "bg-warn/20 text-warn" : "bg-warn/15 text-[#8A5A00]") : dark ? "bg-canvas/10 text-canvas/70" : "bg-ink/[0.05] text-ink/60"
          }`}
        >
          {t}
        </span>
      ))}
    </span>
  );
}

export function PageTitle({ eyebrow, title, accent, action }: { eyebrow: string; title: string; accent?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-stone">{eyebrow}</p>
        <h1 className="mt-1 text-[2.25rem] font-medium leading-[1] tracking-[-0.055em] text-ink sm:text-5xl">
          {title} {accent && <span className="font-serif italic text-brand">{accent}</span>}
        </h1>
      </div>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-[#F7F8F5] px-4 py-8 text-center text-sm text-stone">{children}</div>;
}
