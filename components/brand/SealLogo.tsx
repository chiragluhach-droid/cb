import { Wordmark } from "@/components/Logo";
import { SealBadge } from "@/components/brand/Seal";

/**
 * Spinning seal + "ev◯well" wordmark. On phones (below md) only the seal shows,
 * unless `alwaysWordmark` is set.
 */
export function SealLogo({
  tone = "light",
  // Standard logo size — matches the site header (46px seal / ~26px wordmark on desktop).
  size = "h-11 w-11 sm:h-[2.875rem] sm:w-[2.875rem]",
  text = "text-[1.6rem]",
  alwaysWordmark = false,
}: {
  tone?: "light" | "dark";
  size?: string;
  text?: string;
  alwaysWordmark?: boolean;
}) {
  const dark = tone === "dark";
  return (
    <span className="inline-flex items-center gap-2">
      <SealBadge
        className={`shadow-[0_8px_20px_-10px_rgba(14,26,19,0.7)] ${size}`}
        disc={dark ? "#FAFAF8" : "#0E1A13"}
        color={dark ? "#0E1A13" : "#FAFAF8"}
      />
      <span className={alwaysWordmark ? "" : "hidden md:inline"}>
        <Wordmark tone={tone} className={`whitespace-nowrap ${text}`} />
      </span>
    </span>
  );
}
