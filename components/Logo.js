import Link from "next/link";

export default function Logo({ size = 28, href = "/", light }) {
  return (
    <Link href={href} className="row" style={{ gap: 9 }} aria-label="Khao home">
      <span style={{ width: size, height: size, borderRadius: size * 0.28, background: light ? "#fff" : "var(--brand)", display: "grid", placeItems: "center" }}>
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" stroke={light ? "var(--brand-600)" : "#fff"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12a8 8 0 0 0 16 0z" />
          <path d="M9 4c0 2 2 2 2 4M14 4c0 2 2 2 2 4" />
        </svg>
      </span>
      <span style={{ fontWeight: 700, fontSize: size * 0.68, letterSpacing: "-0.02em", color: light ? "#fff" : "var(--ink)" }}>Khao</span>
    </Link>
  );
}
