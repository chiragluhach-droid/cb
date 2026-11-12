import { CSSProperties, Fragment } from "react";

type TickerProps = {
  items: string[];
  reverse?: boolean;
  /** Degrees of tilt for the band. */
  tilt?: number;
};

// Words alternate between the bright green and off-white.
const tones = ["text-sprout", "text-canvas", "text-sprout", "text-canvas/60"];

/** A looping word band on a deep-green strip. Two copies slide by half their width. */
export default function Ticker({ items, reverse = false, tilt = 0 }: TickerProps) {
  const row = [...items, ...items, ...items, ...items];
  return (
    <div
      aria-hidden
      className="relative z-10 -mx-4 select-none overflow-hidden bg-forest py-4 sm:py-6"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div
        className={`flex w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
        style={{ "--marquee-duration": "40s" } as CSSProperties}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {row.map((item, i) => (
              <Fragment key={`${copy}-${i}`}>
                <span
                  className={`whitespace-nowrap px-5 font-sans text-3xl font-extrabold tracking-[-0.04em] sm:px-8 sm:text-5xl ${tones[i % tones.length]}`}
                >
                  {item}
                </span>
                <span className="text-xl text-brand sm:text-2xl">✦</span>
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
