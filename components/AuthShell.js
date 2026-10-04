import Logo from "./Logo";
import Icon from "./Icon";

const POINTS = [
  "Meal plans built around Indian home food",
  "Every plan reviewed by your coach",
  "Adjusts automatically as you progress",
];

export default function AuthShell({ children, title, sub }) {
  return (
    <div className="auth" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", background: "var(--surface)" }}>
      <style>{`@media (min-width: 861px) { .auth-logo-mobile { display: none; } } @media (max-width: 860px) { .auth { grid-template-columns: 1fr !important; } .auth-art { display: none !important; } }`}</style>
      <div style={{ display: "grid", placeItems: "center", padding: "48px 20px" }}>
        <div style={{ width: "min(400px, 100%)" }}>
          <div className="auth-logo-mobile" style={{ marginBottom: 32 }}><Logo /></div>
          <h1 className="display" style={{ fontSize: 28 }}>{title}</h1>
          {sub && <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>{sub}</p>}
          <div style={{ marginTop: 28 }}>{children}</div>
        </div>
      </div>
      <div className="auth-art" style={{ background: "linear-gradient(160deg, #14532d 0%, #166534 55%, #15803d 100%)", color: "#fff", padding: 48, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Logo light />
        <div style={{ maxWidth: 440 }}>
          <p style={{ fontSize: 22, lineHeight: 1.45, fontWeight: 500, letterSpacing: "-0.01em" }}>
            &ldquo;Finally a plan that works with the food I actually eat. My coach adjusted it twice when I plateaued, and I never felt like I was dieting.&rdquo;
          </p>
          <div className="row" style={{ marginTop: 20 }}>
            <span style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "grid", placeItems: "center", fontWeight: 600 }}>S</span>
            <div style={{ fontSize: 14 }}>
              <div style={{ fontWeight: 600 }}>Simran K.</div>
              <div style={{ opacity: 0.7 }}>Client, 10 weeks</div>
            </div>
          </div>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, fontSize: 14, opacity: 0.9 }}>
          {POINTS.map((p) => (
            <li key={p} className="row" style={{ gap: 10 }}><Icon name="check" size={16} /> {p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
