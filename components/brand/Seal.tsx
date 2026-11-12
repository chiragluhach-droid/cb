import { CSSProperties } from "react";

/*
 * The Evowell "EW" seal, from the brand artwork. The PNGs in /public/brand
 * are white-on-transparent masks, so the mark can be painted any colour.
 */

const mask = (src: string, color: string): CSSProperties => ({
  backgroundColor: color,
  WebkitMaskImage: `url(${src})`,
  maskImage: `url(${src})`,
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
});

type Spin = boolean | "reverse";
// Uses Tailwind's built-in `spin` keyframes, slowed right down.
const spinCls = (spin?: Spin) =>
  spin === "reverse" ? "animate-[spin_22s_linear_infinite] [animation-direction:reverse]" : spin ? "animate-[spin_16s_linear_infinite]" : "";

/** Full seal: "EVOWELL" around the EW monogram. `spin` turns it slowly. */
export function Seal({ className = "h-24 w-24", color = "#0E1A13", label = "Evowell", spin }: { className?: string; color?: string; label?: string; spin?: Spin }) {
  return <span role="img" aria-label={label} className={`inline-block shrink-0 ${spinCls(spin)} ${className}`} style={mask("/brand/ew-seal.png", color)} />;
}

/** Just the EW monogram — for small spaces like avatars. */
export function Monogram({ className = "h-8 w-8", color = "#0E1A13", label = "Evowell" }: { className?: string; color?: string; label?: string }) {
  return <span role="img" aria-label={label} className={`inline-block shrink-0 ${className}`} style={mask("/brand/ew-monogram.png", color)} />;
}

/** Seal on a solid disc, like the original artwork. Spins slowly by default. */
export function SealBadge({ className = "h-24 w-24", disc = "#0E1A13", color = "#FAFAF8", spin = true }: { className?: string; disc?: string; color?: string; spin?: Spin }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`} style={{ backgroundColor: disc }}>
      <Seal className="h-[80%] w-[80%]" color={color} spin={spin} />
    </span>
  );
}
