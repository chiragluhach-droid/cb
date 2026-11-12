import { BowlMark, RingMark, SproutMark } from "@/components/brand/Marks";

type Tone = "light" | "dark";

const inkFor = (t: Tone) => (t === "dark" ? "#FAFAF8" : "#0E1A13");

/** 01 · Sprout mark + lowercase "evowell". */
export function SproutLockup({ tone = "light", className = "text-4xl" }: { tone?: Tone; className?: string }) {
  const ink = inkFor(tone);
  return (
    <span className={`inline-flex items-center gap-[0.22em] font-sans font-semibold tracking-[-0.055em] ${className}`} style={{ color: ink }}>
      <SproutMark className="h-[1.3em] w-[1.3em]" ink={ink} leaf={tone === "dark" ? "#8AF0A0" : "#16A34A"} leaf2={tone === "dark" ? "#16A34A" : "#8AF0A0"} vein={tone === "dark" ? "#0E1A13" : "#ffffff"} />
      evowell
    </span>
  );
}

/** 02 · Katori mark + "Evo" sans / "well" serif italic. */
export function BowlLockup({ tone = "light", className = "text-4xl" }: { tone?: Tone; className?: string }) {
  const ink = inkFor(tone);
  return (
    <span className={`inline-flex items-center gap-[0.2em] ${className}`} style={{ color: ink }}>
      <BowlMark className="h-[1.3em] w-[1.3em]" ink={ink} leaf={tone === "dark" ? "#8AF0A0" : "#16A34A"} vein={tone === "dark" ? "#0E1A13" : "#ffffff"} />
      <span className="leading-none">
        <span className="font-sans font-semibold tracking-[-0.055em]">Evo</span>
        <span className="font-serif text-[1.08em] italic tracking-[-0.02em]" style={{ color: tone === "dark" ? "#8AF0A0" : "#16A34A" }}>
          well
        </span>
      </span>
    </span>
  );
}

/** 03 · "ev" + ring-as-"o" + "well" — the wordmark is the logo. */
export function RingWordmark({ tone = "light", className = "text-5xl" }: { tone?: Tone; className?: string }) {
  const ink = inkFor(tone);
  return (
    <span className={`inline-flex items-baseline font-sans font-semibold tracking-[-0.055em] ${className}`} style={{ color: ink }}>
      ev
      {/* Ring sized to the x-height and dropped so its bottom sits on the baseline. */}
      <RingMark
        className="relative top-[0.14em] mx-[-0.05em] inline-block h-[0.86em] w-[0.86em]"
        ink={tone === "dark" ? "#8AF0A0" : "#16A34A"}
        leaf={tone === "dark" ? "#FAFAF8" : "#8AF0A0"}
        track="transparent"
        vein={tone === "dark" ? "#16A34A" : "#0E1A13"}
      />
      well
    </span>
  );
}
