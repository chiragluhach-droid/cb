"use client";
import { useEffect, useRef, useState } from "react";

// Lime dot that trails the mouse; grows into a labelled pink blob over [data-cursor] elements
export default function Cursor() {
  const dot = useRef(null);
  const [label, setLabel] = useState("");
  const [big, setBig] = useState(false);
  const pos = useRef({ x: -100, y: -100, tx: -100, ty: -100 });
  const lbl = useRef(null);

  useEffect(() => {
    const move = (e) => {
      pos.current.tx = e.clientX;
      pos.current.ty = e.clientY;
      const el = e.target.closest?.("[data-cursor], a, button");
      setBig(!!el);
      setLabel(el?.dataset?.cursor || "");
    };
    let raf;
    const loop = () => {
      const p = pos.current;
      p.x += (p.tx - p.x) * 0.22;
      p.y += (p.ty - p.y) * 0.22;
      if (dot.current) dot.current.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
      if (lbl.current) lbl.current.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div ref={dot} className={`cursor ${big ? "big" : ""}`} style={{ transform: "translate(-100px,-100px)" }} />
      <div ref={lbl} className="cursor-label">{big ? label : ""}</div>
    </>
  );
}
