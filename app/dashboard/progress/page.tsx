"use client";

import { ChangeEvent, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, Loader2, Minus, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardTitle } from "@/components/app/ui";
import { dayKey, newId, useSession } from "@/lib/demo-store";
import { WeightChart, fmtDay as fmt } from "@/components/app/WeightChart";

/** Shrink a photo to ~600px wide JPEG so it fits in browser storage. */
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const w = Math.min(600, img.width);
      const h = Math.round((img.height / img.width) * w);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image"));
    };
    img.src = url;
  });
}

export default function ProgressPage() {
  const { data, update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);

  if (!data?.profile) return null;
  const today = dayKey();
  const sorted = [...data.weights].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.at(-1)?.kg ?? data.profile.weight;
  const start = sorted[0]?.kg ?? data.profile.weight;
  const change = current - start;
  const todayEntry = data.weights.find((w) => w.date === today);
  const losing = data.profile.goal !== "build";
  const good = losing ? change <= 0 : change >= 0;

  const setToday = (kg: number) =>
    update((d) => ({ ...d, weights: [...d.weights.filter((w) => w.date !== today), { date: today, kg: Math.round(kg * 10) / 10 }] }));

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErr("");
    setBusy(true);
    try {
      const src = await downscale(f);
      update((d) => ({ ...d, photos: [{ id: newId(), date: today, src }, ...d.photos].slice(0, 12) }));
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const photos = [...data.photos].sort((a, b) => b.date.localeCompare(a.date));
  const first = photos.at(-1);
  const latest = photos[0];

  return (
    <div>
      <p className="text-sm font-medium text-stone">The trend matters, not the day</p>
      <h1 className="mt-1 text-[2.25rem] font-medium leading-[1] tracking-[-0.055em] text-ink sm:text-5xl">
        <span className="font-serif italic text-brand">Progress.</span>
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <Card className="lg:col-span-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-ink/45">Weight</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums tracking-[-0.05em] text-ink">
                {current.toFixed(1)} <span className="text-lg font-medium text-ink/40">kg</span>
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums ${good ? "bg-mint text-brand-deep" : "bg-warn/15 text-[#8A5A00]"}`}>
              {change <= 0 ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
              {change > 0 ? "+" : ""}
              {change.toFixed(1)} kg since start
            </span>
          </div>
          <WeightChart points={sorted.slice(-30)} />
        </Card>

        <Card className="lg:col-span-4">
          <CardTitle>Log today</CardTitle>
          <div className="flex items-center justify-between rounded-2xl bg-[#F7F8F5] p-2">
            <button onClick={() => setToday((todayEntry?.kg ?? current) - 0.1)} aria-label="Decrease" className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-ink/10">
              <Minus size={16} />
            </button>
            <span className="text-3xl font-semibold tabular-nums tracking-[-0.05em]">
              {(todayEntry?.kg ?? current).toFixed(1)}
              <span className="ml-1 text-sm font-medium text-ink/40">kg</span>
            </span>
            <button onClick={() => setToday((todayEntry?.kg ?? current) + 0.1)} aria-label="Increase" className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-canvas">
              <Plus size={16} />
            </button>
          </div>
          <button
            onClick={() => setToday(todayEntry?.kg ?? current)}
            className={`mt-3 w-full rounded-full py-3 text-sm font-semibold transition-colors ${todayEntry ? "bg-mint text-brand-deep" : "bg-brand text-white hover:bg-brand-deep"}`}
          >
            {todayEntry ? "Saved for today ✓" : "Save today's weight"}
          </button>
          <p className="mt-4 text-xs leading-relaxed text-stone">Weigh in the morning, after the bathroom, before breakfast. Daily ups and downs of 0.5–1 kg are just water.</p>
          {sorted.length > 0 && (
            <ul className="mt-5 space-y-1.5 border-t border-ink/[0.06] pt-4">
              {sorted
                .slice(-5)
                .reverse()
                .map((w) => (
                  <li key={w.date} className="flex justify-between text-sm">
                    <span className="text-stone">{w.date === today ? "Today" : fmt(w.date)}</span>
                    <span className="font-semibold tabular-nums">{w.kg.toFixed(1)} kg</span>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-12">
          <CardTitle
            action={
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-canvas transition-colors hover:bg-brand disabled:opacity-60"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />} Add photo
              </button>
            }
          >
            Progress photos
          </CardTitle>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

          {photos.length === 0 ? (
            <button onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed border-ink/10 py-14 text-center transition-colors hover:border-brand/40">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-brand">
                <Camera size={24} />
              </span>
              <span className="text-base font-semibold text-ink">Add your first progress photo</span>
              <span className="max-w-xs text-sm text-stone">Same spot, same light, every 2 weeks. Private to you and your coach.</span>
            </button>
          ) : (
            <>
              {first && latest && first.id !== latest.id && (
                <div className="mb-4 grid grid-cols-2 gap-2 sm:max-w-md">
                  {[first, latest].map((p, i) => (
                    <div key={p.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.src} alt={i ? "Latest progress photo" : "First progress photo"} className="h-full w-full object-cover" />
                      <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[0.6875rem] font-semibold text-white">{i ? `Now · ${fmt(p.date)}` : `Start · ${fmt(p.date)}`}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {photos.map((p) => (
                  <div key={p.id} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink/5">
                    <button onClick={() => setViewing(p.src)} className="h-full w-full" aria-label={`Open photo from ${fmt(p.date)}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.src} alt="" className="h-full w-full object-cover" />
                    </button>
                    <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[0.625rem] font-semibold text-white">{fmt(p.date)}</span>
                    <button
                      onClick={() => update((d) => ({ ...d, photos: d.photos.filter((x) => x.id !== p.id) }))}
                      aria-label="Delete photo"
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="mt-4 text-xs text-ink/40">Private to you and your coach. Your latest 12 photos are kept.</p>
        </Card>
      </div>

      <AnimatePresence>
        {viewing && (
          <motion.button
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewing(null)}
            aria-label="Close photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img src={viewing} alt="" initial={{ scale: 0.94 }} animate={{ scale: 1 }} className="max-h-[85svh] max-w-full rounded-2xl object-contain" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
