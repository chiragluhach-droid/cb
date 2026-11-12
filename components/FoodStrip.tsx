import { CSSProperties } from "react";
import Image from "next/image";
import { Coffee, CookingPot, Egg, Fish, LucideIcon, Milk, Salad, Soup, Wheat } from "lucide-react";
import { photos, unsplash } from "@/lib/site";

type Item = { name: string; kcal: number; p: number; nonveg?: boolean; img?: string; icon?: LucideIcon; tone?: string };

const rowA: Item[] = [
  { name: "Idli + sambar", kcal: 300, p: 11, img: photos.idliLeaf },
  { name: "Roti, sabzi & dal", kcal: 520, p: 20, img: photos.rotiSabzi },
  { name: "Palak paneer", kcal: 540, p: 26, img: photos.palakPaneer },
  { name: "Moong dal khichdi", kcal: 470, p: 19, img: photos.khichdi },
  { name: "Paneer tikka", kcal: 270, p: 18, img: photos.paneerTikka },
  { name: "Ragi dosa", kcal: 300, p: 8, img: photos.dosa },
  { name: "Masala dosa", kcal: 380, p: 9, img: photos.masalaDosa },
  { name: "Home thali", kcal: 560, p: 21, img: photos.thali },
];

const rowB: Item[] = [
  { name: "Chicken curry", kcal: 560, p: 38, nonveg: true, img: photos.chickenCurry },
  { name: "Besan chilla", kcal: 290, p: 14, icon: CookingPot, tone: "bg-[#FCE7B2] text-[#8A5A00]" },
  { name: "Egg bhurji", kcal: 360, p: 22, nonveg: true, icon: Egg, tone: "bg-[#FFF3D6] text-[#8A5A00]" },
  { name: "Chana dal", kcal: 450, p: 18, img: photos.chanaDal },
  { name: "Vegetable poha", kcal: 310, p: 8, icon: Wheat, tone: "bg-[#FFF0C2] text-[#7A5B00]" },
  { name: "Fish tikka", kcal: 380, p: 36, nonveg: true, icon: Fish, tone: "bg-[#D7ECF7] text-[#1B5E80]" },
  { name: "Sprouts chaat", kcal: 230, p: 13, icon: Salad, tone: "bg-mint text-brand-deep" },
  { name: "Rajma chawal", kcal: 540, p: 20, icon: Soup, tone: "bg-[#F6DCD3] text-[#8A3A1F]" },
  { name: "Hung curd bowl", kcal: 240, p: 17, icon: Milk, tone: "bg-[#EEF1F6] text-[#3B4A6B]" },
  { name: "Masala chai", kcal: 90, p: 3, icon: Coffee, tone: "bg-[#EADBC8] text-[#6B4423]" },
];

/** India's food mark: green square-dot for veg, brown-red for non-veg (incl. egg). */
function DietMark({ nonveg }: { nonveg?: boolean }) {
  const c = nonveg ? "#A1371B" : "#16A34A";
  return (
    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]" style={{ borderColor: c }} aria-label={nonveg ? "Non-veg" : "Veg"}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
    </span>
  );
}

function Pill({ item }: { item: Item }) {
  const Icon = item.icon;
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-5 shadow-[0_10px_24px_-18px_rgba(14,26,19,0.6)] ring-1 ring-ink/[0.06] transition-all duration-300 ease-expo hover:-translate-y-1 hover:shadow-[0_18px_30px_-16px_rgba(14,26,19,0.5)] hover:ring-brand/40">
      <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-12 sm:w-12 ${item.tone ?? "bg-mint text-brand"}`}>
        {item.img ? <Image src={unsplash(item.img, 160)} alt="" fill sizes="48px" className="object-cover" /> : Icon && <Icon size={20} strokeWidth={1.8} />}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <DietMark nonveg={item.nonveg} />
          <span className="whitespace-nowrap text-sm font-semibold tracking-[-0.01em] text-ink sm:text-[15px]">{item.name}</span>
        </span>
        <span className="mt-0.5 block whitespace-nowrap text-xs tabular-nums text-stone">
          {item.kcal} kcal · <span className="font-semibold text-brand-deep">{item.p}g protein</span>
        </span>
      </span>
    </div>
  );
}

function Row({ items, reverse = false, duration }: { items: Item[]; reverse?: boolean; duration: string }) {
  return (
    <div className="group flex overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
      <div
        className={`flex w-max gap-3 group-hover:[animation-play-state:paused] sm:gap-4 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
        style={{ "--marquee-duration": duration } as CSSProperties}
      >
        {/* Two copies slide by half the track width for a seamless loop. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4" aria-hidden={copy === 1}>
            {items.map((it) => (
              <Pill key={it.name} item={it} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FoodStrip() {
  return (
    <section aria-label="Dishes we plan with" className="relative bg-canvas pb-6 pt-4 sm:pb-10">
      <div className="container-x mb-5 flex items-center gap-4 sm:mb-6">
        <span className="h-px flex-1 bg-ink/10" />
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-stone">
          Everyday Indian food, <span className="text-brand-deep">planned by your coach</span>
        </p>
        <span className="h-px flex-1 bg-ink/10" />
      </div>
      <div className="space-y-1 sm:space-y-2">
        <Row items={rowA} duration="55s" />
        <Row items={rowB} reverse duration="65s" />
      </div>
    </section>
  );
}
