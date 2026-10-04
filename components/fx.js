"use client";
import { useEffect, useRef, useState } from "react";

// Adds .in to every .reveal element as it scrolls into view
export function RevealOnScroll() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { threshold: 0.12 }
    );
    const scan = () => document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}

// Small static badge
export function Sticker({ children, style, className = "" }) {
  return <div className={`sticker ${className}`} style={style}>{children}</div>;
}

// Kept for API compatibility: plain wrappers now that the playful effects are gone
export function Magnetic({ children, className = "", style }) {
  return <div className={className} style={{ display: "inline-block", ...style }}>{children}</div>;
}

export function Tilt({ children, className = "", style, max, ...rest }) {
  return <div className={className} style={style} {...rest}>{children}</div>;
}

export function burst() {}

export function useToast() {
  const [msg, setMsg] = useState("");
  const t = useRef();
  const show = (m) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(""), 2400);
  };
  const node = msg ? <div className="toast">{msg}</div> : null;
  return [show, node];
}

// Count up when visible
export function CountUp({ to, suffix = "", duration = 1400 }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - start) / duration);
        setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{v.toLocaleString("en-IN")}{suffix}</span>;
}
