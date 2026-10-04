"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";
import Icon from "./Icon";

// Desktop: left sidebar. Mobile: sticky top bar + bottom tab bar.
export default function SideNav({ items, footer, mobileExtra, profileHref, home = "/" }) {
  const path = usePathname();
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };
  const isOn = (href) => href === path || (href !== items[0][0] && path.startsWith(href));
  return (
    <>
      <aside className="side">
        <div className="brand" style={{ padding: "2px 8px 20px" }}><Logo href={home} /></div>
        {items.map(([href, icon, label, badge]) => (
          <Link key={href} href={href} className={`nav ${isOn(href) ? "on" : ""}`}>
            <span className="em"><Icon name={icon} /></span>
            <span>{label}</span>
            {badge ? <span className="pill" style={{ marginLeft: "auto", padding: "0 7px", background: "var(--brand)", color: "#fff", border: 0 }}>{badge}</span> : null}
          </Link>
        ))}
        <div className="side-foot">
          {footer}
          {profileHref && (
            <Link href={profileHref} className={`nav ${path === profileHref ? "on" : ""}`}>
              <span className="em"><Icon name="user" /></span><span>Profile</span>
            </Link>
          )}
          <button onClick={logout} className="btn ghost sm" style={{ justifyContent: "flex-start", border: 0, boxShadow: "none", color: "var(--muted)" }}><Icon name="logout" size={16} /> Log out</button>
        </div>
      </aside>

      <header className="mtop">
        <Logo href={home} size={26} />
        <div className="row" style={{ gap: 8 }}>
          {mobileExtra}
          {profileHref && (
            <Link href={profileHref} className="icon-btn" aria-label="Profile" style={path === profileHref ? { borderColor: "var(--brand)", color: "var(--brand-700)", background: "var(--brand-50)" } : undefined}><Icon name="user" size={18} /></Link>
          )}
          <button onClick={logout} className="icon-btn" aria-label="Log out"><Icon name="logout" size={18} /></button>
        </div>
      </header>

      <nav className="mtabs" aria-label="Main">
        {items.map(([href, icon, label, badge]) => (
          <Link key={href} href={href} className={isOn(href) ? "on" : ""} aria-current={isOn(href) ? "page" : undefined}>
            <span className="ic">
              <Icon name={icon} size={20} stroke={isOn(href) ? 2.1 : 1.75} />
              {badge ? <span className="badge">{badge > 9 ? "9+" : badge}</span> : null}
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
