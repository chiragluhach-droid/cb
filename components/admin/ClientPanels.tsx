"use client";

import { useEffect, useState } from "react";
import { Check, Droplet, Footprints, Mail, Phone, Scale, Utensils } from "lucide-react";
import { Card, CardTitle } from "@/components/app/ui";
import { WeightChart, fmtDay } from "@/components/app/WeightChart";
import { stepGoal } from "@/components/app/meals";
import { inr } from "@/lib/plans";
import { activityLabel, condLabel, dietLabel, goalLabel, planLabel } from "@/components/admin/bits";
import { ClientRow, saveCoachNotes } from "@/lib/admin";
import { dayKey, formatPhone } from "@/lib/demo-store";
import { slotSplit, targets } from "@/lib/engine";

const lastDays = (n: number) => Array.from({ length: n }, (_, i) => dayKey(new Date(Date.now() - (n - 1 - i) * 86400000)));

export function ClientProgress({ row }: { row: ClientRow }) {
  const { data } = row;
  const profile = data.profile!;
  const weights = [...data.weights].sort((a, b) => a.date.localeCompare(b.date));
  const days14 = lastDays(14);
  const logged = days14.map((k) => data.days[k]).filter(Boolean);
  const avgWater = logged.length ? logged.reduce((s, d) => s + d!.water, 0) / logged.length : 0;
  const avgSteps = logged.length ? logged.reduce((s, d) => s + d!.steps, 0) / logged.length : 0;
  const goal = stepGoal(profile.activity);
  const losing = profile.goal !== "build";
  const good = row.change === null ? null : losing ? row.change <= 0 : row.change >= 0;

  const stats = [
    { icon: Scale, label: "Weight change", value: row.change === null ? "—" : `${row.change > 0 ? "+" : ""}${row.change} kg`, note: row.start ? `${row.start} → ${row.current} kg` : "No weigh-ins", tone: good === null ? "" : good ? "text-brand-deep" : "text-red-600" },
    { icon: Utensils, label: "Meals ticked · 7d", value: `${Math.round(row.adherence * 100)}%`, note: "of planned meals", tone: "" },
    { icon: Droplet, label: "Water · 14d avg", value: `${avgWater.toFixed(1)}`, note: "glasses a day", tone: "" },
    { icon: Footprints, label: "Steps · 14d avg", value: Math.round(avgSteps).toLocaleString("en-IN"), note: `goal ${goal.toLocaleString("en-IN")}`, tone: avgSteps >= goal * 0.9 ? "text-brand-deep" : "" },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="!p-4 sm:!p-5">
              <Icon size={16} className="text-brand" />
              <p className={`mt-3 text-2xl font-semibold tabular-nums tracking-[-0.04em] text-ink ${s.tone}`}>{s.value}</p>
              <p className="text-xs font-semibold text-ink">{s.label}</p>
              <p className="text-[0.6875rem] text-stone">{s.note}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <Card className="lg:col-span-7">
          <CardTitle action={<span className="text-xs text-stone">{weights.length} weigh-ins</span>}>Weight</CardTitle>
          <WeightChart points={weights} />
        </Card>

        <Card className="lg:col-span-5">
          <CardTitle action={<span className="text-xs text-stone">last 14 days</span>}>Daily logs</CardTitle>
          <div className="grid grid-cols-7 gap-1.5">
            {days14.map((k) => {
              const d = data.days[k];
              const n = d?.meals.length ?? 0;
              return (
                <div key={k} title={`${fmtDay(k)} · ${n}/${slotSplit.length} meals`} className="flex flex-col items-center gap-1">
                  <span
                    className={`flex aspect-square w-full items-center justify-center rounded-lg text-[0.6875rem] font-bold tabular-nums ${
                      !d ? "bg-ink/[0.04] text-ink/25" : n === slotSplit.length ? "bg-brand text-white" : n >= 2 ? "bg-brand/40 text-forest" : "bg-warn/40 text-forest"
                    }`}
                  >
                    {d ? n : "·"}
                  </span>
                  <span className="text-[0.5625rem] text-ink/40">{new Date(`${k}T00:00:00`).getDate()}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.6875rem] text-stone">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand" /> all meals</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand/40" /> 2–3</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-warn/40" /> 0–1</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-ink/[0.06]" /> no log</span>
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle action={<span className="text-xs text-stone">private to {row.user.name.split(" ")[0]} and you</span>}>Progress photos</CardTitle>
        {data.photos.length ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[...data.photos]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((p) => (
                <div key={p.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink/[0.04]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={`Progress photo, ${fmtDay(p.date)}`} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[0.625rem] font-semibold text-white">{fmtDay(p.date)}</span>
                </div>
              ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-[#F7F8F5] px-4 py-6 text-center text-sm text-stone">No photos yet. Clients add them from Progress every two weeks.</p>
        )}
      </Card>
    </div>
  );
}

export function ClientProfile({ row }: { row: ClientRow }) {
  const { user, data } = row;
  const p = data.profile;
  const [notes, setNotes] = useState(data.coachNotes ?? "");
  const [saved, setSaved] = useState(false);

  // Save notes a moment after typing stops.
  useEffect(() => {
    if (notes === (data.coachNotes ?? "")) return;
    const t = setTimeout(() => {
      saveCoachNotes(user.id, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 600);
    return () => clearTimeout(t);
  }, [notes, data.coachNotes, user.id]);

  const t = p ? targets(p) : null;
  const answers: [string, string][] = p
    ? [
        ["Goal", goalLabel[p.goal]],
        ["Diet", dietLabel[p.diet]],
        ["Sex · age", `${p.sex === "female" ? "Female" : "Male"} · ${p.age}`],
        ["Height · weight", `${p.height} cm · ${p.weight} kg`],
        ["Activity", activityLabel[p.activity]],
        ["Health", p.conditions.length ? p.conditions.map((c) => condLabel[c]).join(", ") : "None"],
        ["Allergies", p.allergies.length ? p.allergies.join(", ") : "None"],
        ["Dislikes", p.dislikes.trim() || "None"],
        ["Training", p.workoutPlace === "gym" ? "Gym" : "Home"],
      ]
    : [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <div className="space-y-4 lg:col-span-7 lg:space-y-6">
        <Card>
          <CardTitle>Questionnaire</CardTitle>
          {p ? (
            <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {answers.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-ink/[0.06] py-3 text-sm sm:block">
                  <dt className="text-stone">{k}</dt>
                  <dd className="text-right font-semibold capitalize text-ink sm:mt-0.5 sm:text-left">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="rounded-2xl bg-[#F7F8F5] px-4 py-6 text-center text-sm text-stone">Not filled in yet.</p>
          )}
          {t && (
            <p className="mt-4 text-xs text-stone">
              Targets: <b className="text-ink">{t.kcal} kcal</b> · {t.protein}g protein · {t.carbs}g carbs · {t.fat}g fat
            </p>
          )}
        </Card>

        <Card>
          <CardTitle action={<span className={`text-xs font-semibold text-brand-deep transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}>Saved</span>}>Coach notes</CardTitle>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder={`Private notes about ${user.name.split(" ")[0]} — only you see these.`}
            className="w-full resize-none rounded-2xl bg-[#F4F5F1] px-4 py-3 text-sm leading-relaxed text-ink outline-none ring-1 ring-transparent placeholder:text-ink/35 focus:ring-brand"
          />
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-5 lg:space-y-6">
        <Card>
          <CardTitle>Contact</CardTitle>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Mail size={15} className="text-ink/40" />
              <a href={`mailto:${user.email}`} className="truncate font-semibold text-ink hover:text-brand">
                {user.email}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={15} className="text-ink/40" />
              <a href={`tel:${user.phone}`} className="font-semibold text-ink hover:text-brand">
                {formatPhone(user.phone)}
              </a>
            </li>
            <li className="flex items-center gap-3 text-stone">
              <Check size={15} className="text-brand" /> Email and phone verified at sign-up
            </li>
          </ul>
        </Card>

        <Card className="bg-forest text-canvas ring-0">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-canvas/50">Subscription</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{planLabel(user.plan)}</p>
          <p className="text-sm text-canvas/55">
            Joined {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · started {fmtDay(data.startDate)}
          </p>
          <p className="mt-3 text-sm text-canvas/70">
            {user.access === "open" && "Online payments not switched on"}
            {user.access === "unpaid" && <span className="font-semibold text-warn">Not paid yet</span>}
            {user.subscription && (
              <>
                Paid {inr(user.subscription.amount)} on {new Date(user.subscription.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                <span className={user.access === "expired" ? "font-semibold text-warn" : ""}>
                  {user.access === "expired" ? "ended" : "until"} {new Date(user.subscription.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </>
            )}
          </p>
          {data.planStatus === "approved" && (
            <p className="mt-4 text-sm tabular-nums text-canvas/70">
              Day {row.day} of {row.total} · {row.total - row.day} days left
            </p>
          )}
        </Card>

      </div>
    </div>
  );
}
