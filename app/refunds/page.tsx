import type { Metadata } from "next";
import LegalPage, { ContactLine, Section } from "@/components/LegalPage";
import { business } from "@/lib/business";

export const metadata: Metadata = { title: "Refund & cancellation policy" };

export default function RefundsPage() {
  const days = business.refundWindowDays;
  return (
    <LegalPage title="Refunds & cancellation" intro="Plans are paid for once, up front. Nothing renews automatically, so there is never a subscription to cancel.">
      <Section title="Full refund within the first days">
        <p>
          If you change your mind, ask within <b className="text-ink">{days} days of paying</b> and we will refund the full amount. No questions asked.
        </p>
      </Section>
      <Section title="After that">
        <p>
          After {days} days, your plan, coaching and check-ins have already been prepared for you, so the payment is non-refundable. If something has gone wrong with your coaching,
          write to us anyway — we&apos;ll do our best to make it right, for example by extending your plan.
        </p>
      </Section>
      <Section title="Charged twice, or charged for a failed payment">
        <p>
          Duplicate charges, and payments that left your account but didn&apos;t activate your plan, are always refunded in full. Payments that your bank authorised but didn&apos;t
          complete are reversed automatically by Razorpay, usually within 5–7 working days.
        </p>
      </Section>
      <Section title="How refunds are paid">
        <ul>
          <li>Refunds go back to the original payment method (UPI, card, netbanking or wallet).</li>
          <li>We approve refunds within 2 working days of your request.</li>
          <li>Your bank then takes 5–7 working days to show the money in your account.</li>
        </ul>
      </Section>
      <Section title="Ask for a refund">
        <p>
          Contact <ContactLine /> with the email you signed up with. Your payment ID (from your Razorpay receipt email) helps us find it faster.
        </p>
      </Section>
    </LegalPage>
  );
}
