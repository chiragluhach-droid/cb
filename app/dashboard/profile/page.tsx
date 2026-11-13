"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BadgeCheck, LogOut, Pencil, RotateCcw } from "lucide-react";
import { Bar, Card, CardTitle } from "@/components/app/ui";
import { initials, planDay } from "@/components/app/Shell";
import { targets } from "@/lib/engine";
import { formatPhone, logout, useSession } from "@/lib/demo-store";
import { inr, parsePlan } from "@/lib/plans";
import { priceFor, useSettings } from "@/lib/settings";

const dietLabel = { veg: "Vegetarian", jain: "Jain", egg: "Eggetarian", nonveg: "Non-vegetarian", vegan: "Vegan" } as const;
const goalLabel = { lose: "Lose fat", tone: "Tone up", build: "Build muscle" } as const;
const actLabel = { sedentary: "Desk job", light: "Light", moderate: "Active", very: "Very active" } as const;

export default function ProfilePage() {
  const router = useRouter();
  const settings = useSettings();
  const { user, data, updateUser, resetData } = useSession();
  const [name, setName] = useState(user?.name ?? "");
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!user || !data?.profile) return null;
  const p = data.profile;
  const plan = parsePlan(user.plan);
  const { day, total } = planDay(data.startDate, plan.duration);
  const t = targets(p);

  const rows: [string, string][] = [
    ["Body", `${p.sex === "female" ? "Female" : "Male"} · ${p.age} yrs · ${p.height} cm`],
    ["Goal", `${goalLabel[p.goal]} · ${actLabel[p.activity]}`],
    ["Diet", dietLabel[p.diet]],
    ["Health", p.conditions.length ? p.conditions.join(", ").toUpperCase() : "None"],
    ["Allergies", p.allergies.length ? p.allergies.join(", ") : "None"],
    ["Dislikes", p.dislikes.trim() || "—"],
    ...(plan.kind === "meal-workout" ? ([["Training", p.workoutPlace === "gym" ? "Gym" : "Home"]] as [string, string][]) : []),
  ];

  return (
    <div>
      <h1 className="text-[2.25rem] font-medium leading-[1] tracking-[-0.055em] text-ink sm:text-5xl">
        <span className="font-serif italic text-brand">Profile.</span>
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-4 lg:col-span-7 lg:space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest text-xl font-bold text-sprout">{initials(user.name)}</span>
              <div className="min-w-0 flex-1">
                {editing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (name.trim().length >= 2) {
                        updateUser({ name: name.trim() });
                        setEditing(false);
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-label="Full name" className="h-11 min-w-0 flex-1 rounded-xl bg-[#F4F5F1] px-3 text-base font-semibold outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-brand" />
                    <button className="rounded-xl bg-ink px-4 text-sm font-semibold text-canvas">Save</button>
                  </form>
                ) : (
                  <p className="flex items-center gap-2 text-xl font-semibold tracking-[-0.03em] text-ink">
                    {user.name}
                    <button onClick={() => setEditing(true)} aria-label="Edit name" className="text-ink/35 hover:text-ink">
                      <Pencil size={15} />
                    </button>
                  </p>
                )}
                <p className="text-sm text-stone">Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
              </div>
            </div>
            <dl className="mt-6 divide-y divide-ink/[0.06] rounded-2xl bg-[#F7F8F5] px-4">
              {[
                ["Email", user.email],
                ["Mobile", formatPhone(user.phone)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-3.5">
                  <dt className="text-sm text-stone">{k}</dt>
                  <dd className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-ink">
                    <span className="truncate">{v}</span>
                    <BadgeCheck size={16} className="shrink-0 text-brand" aria-label="Verified" />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-ink/40">Email and phone are verified and used to sign in. Contact your coach to change them.</p>
          </Card>

          <Card>
            <CardTitle
              action={
                <Link href="/onboarding" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-deep hover:underline">
                  <Pencil size={12} /> Update answers
                </Link>
              }
            >
              Your questionnaire
            </CardTitle>
            <dl className="divide-y divide-ink/[0.06]">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-stone">{k}</dt>
                  <dd className="text-right text-sm font-semibold capitalize text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-ink/40">Updating your answers sends a new draft to your coach for review.</p>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-5 lg:space-y-6">
          <Card className="bg-forest text-canvas ring-0">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-canvas/50">Your plan</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{settings.plans[plan.kind].name}</p>
            <p className="text-sm text-canvas/55">
              {plan.duration}-day programme ·{" "}
              {user.subscription ? `paid ${inr(user.subscription.amount)}` : `${inr(priceFor(settings, plan.kind, plan.duration))} one-time`}
            </p>
            {user.subscription && (
              <p className="mt-1 text-sm text-canvas/55">
                Active until <b className="font-semibold text-canvas">{new Date(user.subscription.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</b>
              </p>
            )}
            <div className="mt-5">
              <Bar value={day / total} className="bg-sprout" track="bg-canvas/10" />
            </div>
            <p className="mt-2 text-sm tabular-nums text-canvas/60">
              Day {day} of {total} · {total - day} days left
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-canvas/[0.06] p-3">
                <p className="text-lg font-semibold tabular-nums text-sprout">{t.kcal.toLocaleString("en-IN")}</p>
                <p className="text-[0.6875rem] text-canvas/50">kcal / day</p>
              </div>
              <div className="rounded-2xl bg-canvas/[0.06] p-3">
                <p className="text-lg font-semibold tabular-nums">{t.protein}g</p>
                <p className="text-[0.6875rem] text-canvas/50">protein / day</p>
              </div>
            </div>
            {user.access === "active" ? (
              <Link href={`/checkout?plan=${plan.kind === "meal" ? "meal-workout" : plan.kind}-${plan.kind === "meal" ? plan.duration : 90}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sprout">
                {plan.kind === "meal" ? "Add workouts" : plan.duration === 30 ? "Go 90 days — 3rd month free" : "Extend your plan"} <ArrowUpRight size={14} />
              </Link>
            ) : (
              (plan.kind === "meal" || plan.duration === 30) && (
                <Link href="/#pricing" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sprout">
                  {plan.kind === "meal" ? "Add workouts" : "Go 90 days — 3rd month free"} <ArrowUpRight size={14} />
                </Link>
              )
            )}
          </Card>

          <Card>
            <CardTitle>Account</CardTitle>
            <div className="space-y-2">
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#F7F8F5] px-4 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.06]"
              >
                <LogOut size={16} /> Log out
              </button>
              {confirmReset ? (
                <div className="rounded-2xl bg-red-50 p-4 text-sm">
                  <p className="font-semibold text-red-700">Clear all your logs, photos and messages?</p>
                  <p className="mt-1 text-red-700/80">Your account stays. You&apos;ll redo the questionnaire.</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        resetData();
                        router.push("/onboarding");
                      }}
                      className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Yes, reset
                    </button>
                    <button onClick={() => setConfirmReset(false)} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink ring-1 ring-ink/10">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmReset(true)} className="flex w-full items-center gap-3 rounded-2xl bg-[#F7F8F5] px-4 py-3.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
                  <RotateCcw size={16} /> Start over
                </button>
              )}
            </div>
            <p className="mt-4 text-xs text-ink/40">Your data is saved to your Evowell account, so it&apos;s the same on every device you log in from.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
