import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { business } from "@/lib/business";

/** Shared layout for the policy pages. */
export default function LegalPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="bg-canvas pb-20 pt-28 lg:pb-28 lg:pt-36">
        <div className="container-x">
          <div className="mx-auto max-w-3xl">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition-colors hover:text-ink">
              <ArrowLeft size={15} /> Home
            </Link>
            <h1 className="mt-6 font-sans text-[2.75rem] font-normal leading-[0.95] tracking-[-0.055em] text-ink sm:text-6xl">{title}</h1>
            <p className="mt-4 text-sm text-stone">Last updated {business.updated}</p>
            {intro && <p className="mt-6 text-pretty text-lg leading-relaxed text-ink/75">{intro}</p>}
            <div className="legal mt-10 space-y-8 text-[0.9375rem] leading-relaxed text-ink/75">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold tracking-[-0.03em] text-ink">{title}</h2>
      <div className="space-y-3 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">{children}</div>
    </section>
  );
}

/** "Email … or call …", using whatever contact details are filled in. */
export function ContactLine() {
  const parts: ReactNode[] = [];
  if (business.email)
    parts.push(
      <a key="e" href={`mailto:${business.email}`} className="font-semibold text-brand-deep underline-offset-2 hover:underline">
        {business.email}
      </a>,
    );
  if (business.phone)
    parts.push(
      <a key="p" href={`tel:${business.phone.replace(/\s/g, "")}`} className="font-semibold text-brand-deep underline-offset-2 hover:underline">
        {business.phone}
      </a>,
    );
  if (!parts.length)
    return (
      <Link href="/contact" className="font-semibold text-brand-deep underline-offset-2 hover:underline">
        our contact page
      </Link>
    );
  return <>{parts.reduce<ReactNode[]>((acc, p, i) => (i ? [...acc, " or ", p] : [p]), [])}</>;
}
