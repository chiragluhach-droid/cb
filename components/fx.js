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

// A sticker you can fling around
export function Sticker({ children, style, className = "", rotate = 0 }) {
  const ref = useRef(null);
  const st = useRef({ x: 0, y: 0, sx: 0, sy: 0, drag: false });
  const [r, setR] = useState(rotate);
  useEffect(() => {
    const el = ref.current;
    const down = (e) => {
      st.current = { ...st.current, drag: true, sx: e.clientX - st.current.x, sy: e.clientY - st.current.y };
      el.setPointerCapture(e.pointerId);
      setR(rotate + (Math.random() * 16 - 8));
    };
    const move = (e) => {
      if (!st.current.drag) return;
      st.current.x = e.clientX - st.current.sx;
      st.current.y = e.clientY - st.current.sy;
      el.style.translate = `${st.current.x}px ${st.current.y}px`;
    };
    const up = () => (st.current.drag = false);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); };
  }, [rotate]);
  return (
    <div ref={ref} className={`sticker ${className}`} data-cursor="drag me" style={{ ...style, rotate: `${r}deg`, transition: "rotate .3s cubic-bezier(.3,1.6,.6,1)" }}>
      {children}
    </div>
  );
}

// Element that leans toward the cursor
export function Magnetic({ children, strength = 0.3, className = "", style }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const b = ref.current.getBoundingClientRect();
    const x = (e.clientX - b.left - b.width / 2) * strength;
    const y = (e.clientY - b.top - b.height / 2) * strength;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const reset = () => (ref.current.style.transform = "");
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={reset} className={className} style={{ display: "inline-block", transition: "transform .25s cubic-bezier(.3,1.6,.6,1)", ...style }}>
      {children}
    </div>
  );
}

// Tilts a card in 3D with the mouse
export function Tilt({ children, className = "", style, max = 8, ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const b = ref.current.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width - 0.5;
    const py = (e.clientY - b.top) / b.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => (ref.current.style.transform = "")} className={className} style={{ transition: "transform .2s ease-out", ...style }} {...rest}>
      {children}
    </div>
  );
}

export function burst(x, y, emojis = ["✨", "🔥", "💚", "⭐", "🥗"]) {
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.className = "confetti";
    s.textContent = emojis[i % emojis.length];
    s.style.left = x + "px";
    s.style.top = y + "px";
    const a = Math.random() * Math.PI * 2;
    const d = 60 + Math.random() * 90;
    s.style.setProperty("--dx", Math.cos(a) * d + "px");
    s.style.setProperty("--dy", Math.sin(a) * d - 40 + "px");
    s.style.setProperty("--r", Math.random() * 360 + "deg");
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 950);
  }
}

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
