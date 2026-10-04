"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import Icon from "./Icon";
import "./auth.css";

const IMG = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop`;
const PHOTOS = {
  thali: "1546833999-b9f581a1996d",
  paneer: "1567188040759-fb8a883dc6d8",
  bowl: "1626777552726-4a6b54c97e46",
  idli: "1589301760014-d929f3979dbc",
  workout: "1571019613454-1cb2f99b2d8b",
};
const TILES = [["paneer", "Paneer tikka"], ["idli", "Idli sambar"], ["workout", "Home workouts"]];

// Password field with a show / hide toggle
export function PasswordInput({ value, onChange, autoComplete = "current-password", ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input className="input" type={show ? "text" : "password"} value={value} onChange={onChange} autoComplete={autoComplete} {...rest} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
    </div>
  );
}

export default function AuthShell({ children, title, sub, photo = "thali", footer }) {
  return (
    <div className="auth">
      {/* phones: photo banner on top; desktop: photo panel on the right */}
      <aside className="auth__art" style={{ "--img": `url(${IMG(PHOTOS[photo] || PHOTOS.thali)})` }}>
        <div className="auth__artTop">
          <Logo light />
          <Link href="/" className="auth__back"><Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} /> Home</Link>
        </div>
        <div className="auth__artMid">
          <span className="auth__badge"><span /> Free during early access</span>
          <p className="auth__tag">Real food. A real coach. Results that last.</p>
        </div>
        <div className="auth__artBottom">
          <figure className="auth__quote">
            <blockquote>&ldquo;Finally a plan that works with the food I actually eat. My coach adjusted it twice when I plateaued, and I never felt like I was dieting.&rdquo;</blockquote>
            <figcaption>
              <span>S</span>
              <div><b>Simran K.</b><small>Lost 6.8 kg in 10 weeks</small></div>
            </figcaption>
          </figure>
          <div className="auth__tiles">
            {TILES.map(([k, l]) => (
              <div key={k} className="auth__tile" style={{ backgroundImage: `url(${IMG(PHOTOS[k], 400)})` }}><span>{l}</span></div>
            ))}
          </div>
        </div>
      </aside>

      <main className="auth__main">
        <div className="auth__form">
          <h1 className="display">{title}</h1>
          {sub && <p className="auth__sub">{sub}</p>}
          <div style={{ marginTop: 24 }}>{children}</div>
          {footer && <div className="auth__foot">{footer}</div>}
          <ul className="auth__points">
            <li><Icon name="shield" size={16} /> Plans reviewed by a real coach</li>
            <li><Icon name="plate" size={16} /> Built around Indian home food</li>
            <li><Icon name="refresh" size={16} /> Adjusts as you progress</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
