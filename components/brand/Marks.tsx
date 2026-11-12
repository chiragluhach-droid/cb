/*
 * Evowell logo concepts. Drawn on a 64×64 grid; colours are props so each
 * mark works on light, green and dark backgrounds.
 */

type Base = { className?: string; title?: string };

const svgProps = (className?: string) => ({ viewBox: "0 0 64 64", fill: "none", className, xmlns: "http://www.w3.org/2000/svg" });

/** 01 · Sprout — an "e" whose crossbar grows into a two-leaf sprout ("ev"). */
export function SproutMark({ className = "h-10 w-10", ink = "#0E1A13", leaf = "#16A34A", leaf2 = "#8AF0A0", vein = "#ffffff", title }: Base & { ink?: string; leaf?: string; leaf2?: string; vein?: string }) {
  return (
    <svg {...svgProps(className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {/* nudged so the e + sprout sit optically centred */}
      <g transform="translate(-4.5 1)">
        <path d="M14 36 H44 A15 15 0 1 0 40.49 45.64" fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M44 36 C45 29 48 25 50 19" fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M50.00 19.00 C51.85 11.74 44.64 9.21 40.04 10.64 C39.43 15.42 43.17 22.08 50.00 19.00 Z" fill={leaf}/>
        <path d="M48.80 18.00 L42.23 12.48" stroke={vein} strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M50.00 19.00 C57.37 22.99 62.41 15.80 62.29 10.40 C57.25 8.43 48.77 10.71 50.00 19.00 Z" fill={leaf2}/>
        <path d="M51.47 17.97 L59.58 12.29" stroke={ink} strokeOpacity="0.35" strokeWidth="1.3" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

/** 02 · Katori — the e's top is a leaf, its bottom a bowl; the crossbar is the rim. */
export function BowlMark({ className = "h-10 w-10", ink = "#0E1A13", leaf = "#16A34A", vein = "#ffffff", title }: Base & { ink?: string; leaf?: string; vein?: string }) {
  return (
    <svg {...svgProps(className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d="M14 33 C16 20 33 10 53 11 C51 24 41 33 31 33 Z" fill={leaf}/>
      <path d="M18 31.5 C28 24 38 17 50 13" stroke={vein} strokeOpacity=".6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M11 33 C11 46 20 53 32 53 C40 53 46.5 50 50 44" fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round"/>
      <path d="M11 33 H53" stroke={ink} strokeWidth="7" strokeLinecap="round"/>
    </svg>
  );
}

/** 03 · Ring — the app's progress ring, ~80% full, ending in a leaf. Doubles as the "o". */
export function RingMark({ className = "h-10 w-10", ink = "#16A34A", leaf = "#8AF0A0", track = "#E6F4EA", vein = "#0E1A13", title }: Base & { ink?: string; leaf?: string; track?: string; vein?: string }) {
  return (
    <svg {...svgProps(className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <circle cx="29" cy="32" r="17" fill="none" stroke={track} strokeWidth="8"/>
      <path d="M42.93 22.25 A17 17 0 1 0 42.02 42.93" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round"/>
      <path d="M41.02 41.93 C50.31 46.10 56.33 36.82 55.99 30.23 C49.68 28.31 39.22 31.91 41.02 41.93 Z" fill={leaf}/>
      <path d="M42.82 40.52 L52.70 32.80" stroke={vein} strokeOpacity="0.35" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
