"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";

export default function SideNav({ items, footer }) {
  const path = usePathname();
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };
  return (
    <aside className="side">
      <div className="brand" style={{ padding: "4px 8px 22px" }}><Logo /></div>
      {items.map(([href, emoji, label, badge]) => {
        const on = href === path || (href !== items[0][0] && path.startsWith(href));
        return (
          <Link key={href} href={href} className={`nav ${on ? "on" : ""}`}>
            <span className="em">{emoji}</span>
            <span>{label}</span>
            {badge ? <span className="pill pink" style={{ marginLeft: "auto", padding: "1px 8px", color: "var(--ink)" }}>{badge}</span> : null}
          </Link>
        );
      })}
      <div className="side-foot" style={{ marginTop: "auto", display: "grid", gap: 10 }}>
        {footer}
        <button onClick={logout} className="btn ghost sm" style={{ justifyContent: "flex-start" }}>↩ log out</button>
      </div>
    </aside>
  );
}
