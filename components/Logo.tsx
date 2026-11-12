/** The Evowell "e" tile (same mark as the live site's icon). */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#16A34A" />
      <path
        transform="translate(4.16 4.16) scale(.9867)"
        d="M4.6 14.2 19.4 9.4A8 8 0 1 0 18 18.4"
        stroke="#fff"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-sans font-semibold tracking-[-0.04em] ${className}`}>
      Evowell<span className="text-brand">.</span>
    </span>
  );
}
