import type { Metadata } from "next";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import LegalPage from "@/components/LegalPage";
import { business } from "@/lib/business";
import { instagramHandle } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  const handle = instagramHandle.replace(/^@/, "");
  const rows = [
    business.email && { icon: Mail, label: "Email", value: business.email, href: `mailto:${business.email}` },
    business.phone && { icon: Phone, label: "Phone / WhatsApp", value: business.phone, href: `tel:${business.phone.replace(/\s/g, "")}` },
    handle && { icon: Instagram, label: "Instagram", value: `@${handle}`, href: `https://instagram.com/${handle}` },
    business.address && { icon: MapPin, label: "Address", value: business.address },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <LegalPage title="Contact us" intro="Questions about a plan, a payment or your account? We reply within one working day.">
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => {
          const Icon = r.icon;
          const body = (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-brand-deep">
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{r.label}</span>
                <span className="block break-words font-semibold text-ink">{r.value}</span>
              </span>
            </>
          );
          return (
            <li key={r.label} className="rounded-[1.5rem] bg-white ring-1 ring-ink/10">
              {r.href ? (
                <a href={r.href} className="flex items-center gap-4 p-5 transition-colors hover:bg-mint/40" target={r.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {body}
                </a>
              ) : (
                <div className="flex items-center gap-4 p-5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-ink/10">
        {business.legalName && (
          <p>
            Evowell is run by <b className="text-ink">{business.legalName}</b>.
          </p>
        )}
        <p>Support hours: {business.hours}.</p>
      </div>
    </LegalPage>
  );
}
