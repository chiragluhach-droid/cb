import type { Metadata } from "next";
import LegalPage, { ContactLine, Section } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Refund & cancellation policy" };

export default function RefundsPage() {
  return (
    <LegalPage title="Refunds & cancellation" intro="All payments are final. Plans are paid for once, up front, and nothing renews automatically, so there is never a subscription to cancel.">
      <Section title="No refunds">
        <p>
          Your plan is built for you as soon as you pay, so <b className="text-ink">we don&apos;t offer refunds</b>, whether for a change of mind, for unused days, or for stopping a plan
          early. Please read the plan details and pricing carefully before you pay.
        </p>
      </Section>
      <Section title="Cancelling">
        <p>
          There&apos;s nothing to cancel: each plan runs for its fixed 30 or 90 days and then simply ends. You won&apos;t be charged again unless you choose to buy another plan. You can
          stop using your plan at any time, but the remaining days aren&apos;t refunded or carried over.
        </p>
      </Section>
      <Section title="Payment errors">
        <p>
          This doesn&apos;t cover mistakes in the payment itself. If you were charged twice for the same plan, or money left your account but your plan didn&apos;t activate, contact us
          and we&apos;ll return the extra or failed payment in full to the original payment method. Payments your bank authorised but didn&apos;t complete are reversed automatically
          by Razorpay, usually within 5–7 working days.
        </p>
      </Section>
      <Section title="Questions">
        <p>
          If something isn&apos;t right with your plan or coaching, contact <ContactLine /> and we&apos;ll do our best to fix it.
        </p>
      </Section>
    </LegalPage>
  );
}
