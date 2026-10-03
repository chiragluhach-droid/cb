"use client";
import Logo from "./Logo";
import { Sticker } from "./fx";

export default function AuthShell({ children, title, sub, img, color = "var(--lime)" }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }} className="auth">
      <style>{`@media (min-width: 861px) { .auth-logo-mobile { display: none; } } @media (max-width: 860px) { .auth { grid-template-columns: 1fr !important; } .auth-art { display: none !important; } }`}</style>
      <div className="auth-art" style={{ background: color, borderRight: "var(--line)", position: "relative", overflow: "hidden", padding: 36, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Logo />
        <div style={{ position: "relative", margin: "30px auto", width: "min(420px, 90%)" }}>
          <div className="card" style={{ overflow: "hidden", aspectRatio: "4/5", rotate: "-3deg", boxShadow: "var(--shadow-lg)" }}>
            <img src={`https://images.unsplash.com/photo-${img}?w=800&q=75&auto=format&fit=crop`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <Sticker style={{ top: -16, right: -20, background: "var(--pink)" }} rotate={10}>real coach 🧑‍🍳</Sticker>
          <Sticker style={{ bottom: 40, left: -30, background: "#fffdf7" }} rotate={-8}>desi food only 🍛</Sticker>
          <Sticker style={{ bottom: -18, right: 30, background: "var(--sky)" }} rotate={4}>no crash diets</Sticker>
        </div>
        <p className="serif" style={{ fontSize: 30, lineHeight: 1.1 }}>&ldquo;Finally, a plan that knows what besan chilla is.&rdquo;</p>
      </div>
      <div style={{ display: "grid", placeItems: "center", padding: "40px 16px" }}>
        <div style={{ width: "min(460px, 100%)" }}>
          <div className="auth-logo-mobile" style={{ marginBottom: 30 }}><Logo /></div>
          <h1 className="display" style={{ fontSize: "clamp(44px, 6vw, 72px)" }}>{title}</h1>
          {sub && <p className="muted" style={{ marginTop: 10, fontSize: 17 }}>{sub}</p>}
          <div style={{ marginTop: 30 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
