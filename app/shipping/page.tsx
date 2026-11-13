import type { Metadata } from "next";
import LegalPage, { ContactLine, Section } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Shipping & delivery policy" };

export default function ShippingPage() {
  return (
    <LegalPage title="Shipping & delivery" intro="Evowell is an online coaching service. Nothing is shipped — everything is delivered on this website.">
      <Section title="What you get, and when">
        <ul>
          <li>
            <b className="text-ink">Right after payment:</b> your account and dashboard unlock, and you fill in a 3-minute questionnaire.
          </li>
          <li>
            <b className="text-ink">Within 24 hours of the questionnaire:</b> your coach reviews and approves your personal meal plan (and workout plan, if your plan includes it).
          </li>
          <li>
            <b className="text-ink">For the length of your plan:</b> daily tracking, plan updates and chat with your coach, from the dashboard.
          </li>
        </ul>
      </Section>
      <Section title="Where it's delivered">
        <p>Everything is in your dashboard at evowellnutrition.com — sign in with your email. You also get a payment receipt by email from Razorpay.</p>
      </Section>
      <Section title="Delays">
        <p>
          If your plan isn&apos;t ready within 24 hours of finishing the questionnaire, contact <ContactLine /> and we&apos;ll sort it out the same day.
        </p>
      </Section>
    </LegalPage>
  );
}
