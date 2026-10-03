import Link from "next/link";

export default function Logo({ size = 30, href = "/" }) {
  return (
    <Link href={href} className="row" style={{ gap: 8 }} data-cursor="home">
      <span style={{ width: size, height: size, borderRadius: "50%", background: "var(--lime)", border: "var(--line)", display: "grid", placeItems: "center", fontSize: size * 0.5, rotate: "-12deg" }}>🍛</span>
      <span className="display" style={{ fontSize: size * 0.95, letterSpacing: "-0.06em" }}>
        khao<span style={{ color: "var(--pink)" }}>.</span>
      </span>
    </Link>
  );
}
