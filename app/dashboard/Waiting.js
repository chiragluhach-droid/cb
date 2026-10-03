"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const LINES = ["reading your profile…", "working out your calories…", "picking meals you'll actually like…", "removing karela (just in case)…", "checking protein for every meal…", "planning your workouts…"];

export default function Waiting({ name, coach }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ maxWidth: 900 }}>
      <span className="chip" style={{ background: "var(--butter)" }}><span className="blink">●</span>&nbsp;in progress</span>
      <h1 className="display" style={{ fontSize: "clamp(44px, 7vw, 90px)", marginTop: 18 }}>
        hey {name}, <span className="serif">your plan is</span> being crafted.
      </h1>
      <div className="card" style={{ marginTop: 34, padding: 28, background: "var(--lilac)", display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
        <div className="float" style={{ fontSize: 80, width: 130, height: 130, borderRadius: "50%", background: "#fffdf7", border: "var(--line)", display: "grid", placeItems: "center" }}>🧑‍🍳</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="eyebrow">{coach} is on it</div>
          <p key={i} className="display word-in" style={{ fontSize: 28, marginTop: 8 }}>{LINES[i]}</p>
          <p style={{ marginTop: 10 }}>Every plan is checked by hand before it reaches you. It usually lands within a few hours, 24 max. We&apos;ll ping you in your coach inbox.</p>
        </div>
      </div>
      <h2 className="display" style={{ fontSize: 34, marginTop: 50 }}>meanwhile…</h2>
      <div className="grid g3" style={{ marginTop: 18 }}>
        <Link href="/dashboard/progress" className="card wobble" style={{ padding: 22, background: "var(--lime)" }}>
          <div style={{ fontSize: 36 }}>📸</div><b className="display" style={{ fontSize: 22 }}>take &ldquo;before&rdquo; photos</b><p style={{ fontSize: 14 }}>Future you will thank you. Private, only you and your coach see them.</p>
        </Link>
        <Link href="/dashboard/progress" className="card wobble" style={{ padding: 22, background: "var(--sky)" }}>
          <div style={{ fontSize: 36 }}>📏</div><b className="display" style={{ fontSize: 22 }}>log measurements</b><p style={{ fontSize: 14 }}>Waist, hips, arms. Sometimes the scale lies, the tape doesn&apos;t.</p>
        </Link>
        <Link href="/dashboard/inbox" className="card wobble" style={{ padding: 22, background: "var(--pink)" }}>
          <div style={{ fontSize: 36 }}>💬</div><b className="display" style={{ fontSize: 22 }}>check your inbox</b><p style={{ fontSize: 14 }}>Messages from your coach show up here.</p>
        </Link>
      </div>
    </div>
  );
}
