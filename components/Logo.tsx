import { RingMark } from "@/components/brand/Marks";
import { RingWordmark } from "@/components/brand/Lockups";

/** App-icon tile: the white progress ring ending in a leaf, on Evowell green. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-[28%] bg-brand ${className}`}>
      <RingMark className="h-[84%] w-[84%]" ink="#ffffff" leaf="#8AF0A0" track="rgba(255,255,255,0.2)" vein="#16A34A" />
    </span>
  );
}

/** The logo: "ev" + ring-as-"o" + "well". */
export function Wordmark({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return <RingWordmark tone={tone} className={className} />;
}
