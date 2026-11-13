import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { ContactLine, Section } from "@/components/LegalPage";
import { business } from "@/lib/business";

export const metadata: Metadata = { title: "Terms & conditions" };

const a = "font-semibold text-brand-deep underline-offset-2 hover:underline";

export default function TermsPage() {
  const who = business.legalName ? `${business.brand} (run by ${business.legalName})` : business.brand;
  return (
    <LegalPage title="Terms & conditions" intro={`These terms cover your use of evowellnutrition.com and the coaching plans sold on it by ${who} ("Evowell", "we", "us"). By creating an account or paying, you agree to them.`}>
      <Section title="The service">
        <p>
          Evowell sells online nutrition coaching: a personal meal plan built from Indian home food, an optional workout plan, a tracking dashboard and chat with your coach, for a fixed
          period (30 or 90 days). Plans are made with the help of software and are reviewed and approved by your coach before you see them.
        </p>
      </Section>
      <Section title="Not medical advice">
        <p>
          Coaching is general wellness guidance, not medical treatment. It doesn&apos;t replace your doctor. If you are pregnant, breastfeeding, under 18, or have a medical condition (for
          example diabetes, thyroid, PCOS, high blood pressure, kidney or heart disease, or an eating disorder), check with your doctor before starting and tell us about it in the
          questionnaire. Stop and see a doctor if you feel unwell.
        </p>
      </Section>
      <Section title="Your account">
        <ul>
          <li>You must be 18 or older, or have a parent or guardian&apos;s permission.</li>
          <li>Give accurate details — your plan is only as good as your answers.</li>
          <li>Keep access to your email; sign-in codes are sent there. One account per person.</li>
        </ul>
      </Section>
      <Section title="Prices and payment">
        <ul>
          <li>Prices are in Indian rupees and shown before you pay. Payment is taken once, up front, through Razorpay.</li>
          <li>Nothing renews automatically. When your period ends you can choose to renew.</li>
          <li>We may change prices for future purchases; it never affects a plan you have already paid for.</li>
          <li>Discount codes can&apos;t be exchanged for cash and only one can be used per payment.</li>
        </ul>
      </Section>
      <Section title="Refunds">
        <p>
          See our{" "}
          <Link href="/refunds" className={a}>
            refund &amp; cancellation policy
          </Link>
          .
        </p>
      </Section>
      <Section title="Fair use">
        <p>
          Your plan is for you. Please don&apos;t share your account, resell the plans, copy the site, or be abusive to your coach. We may suspend accounts that do, and refund any unused
          time.
        </p>
      </Section>
      <Section title="Our content">
        <p>The plans, recipes, text, design and software on this site belong to Evowell. You may use your plan for your own personal use.</p>
      </Section>
      <Section title="Liability">
        <p>
          We take care to give safe, sensible guidance, but results depend on many things outside our control and aren&apos;t guaranteed. To the extent the law allows, our total
          liability to you is limited to the amount you paid for your current plan.
        </p>
      </Section>
      <Section title="Law">
        <p>These terms are governed by the laws of India{business.city ? `, and the courts of ${business.city} have jurisdiction` : ""}.</p>
      </Section>
      <Section title="Changes and contact">
        <p>
          We may update these terms; the date at the top shows the latest version. Questions? Contact <ContactLine />.
        </p>
      </Section>
    </LegalPage>
  );
}
