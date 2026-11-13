import type { Metadata } from "next";
import LegalPage, { ContactLine, Section } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" intro="What we collect, why, and what you can do about it. We don't sell your data, and we don't show ads.">
      <Section title="What we collect">
        <ul>
          <li>
            <b className="text-ink">Account:</b> your name, email and phone number.
          </li>
          <li>
            <b className="text-ink">Questionnaire:</b> age, height, weight, goal, activity, diet, food dislikes, allergies and health conditions you choose to tell us.
          </li>
          <li>
            <b className="text-ink">Progress:</b> meals and workouts you tick off, water, steps, weigh-ins, progress photos you upload, and messages with your coach.
          </li>
          <li>
            <b className="text-ink">Payments:</b> the plan, amount and Razorpay payment ID. Card, UPI and bank details are entered on Razorpay&apos;s secure window and never reach us.
          </li>
        </ul>
      </Section>
      <Section title="Why we use it">
        <ul>
          <li>To build, review and adjust your plan, and for your coach to support you.</li>
          <li>To sign you in (we email you one-time codes) and to send receipts and important account messages.</li>
          <li>To take payment and handle refunds.</li>
        </ul>
      </Section>
      <Section title="Who else handles it">
        <ul>
          <li>
            <b className="text-ink">Razorpay</b> — processes payments.
          </li>
          <li>
            <b className="text-ink">MongoDB Atlas</b> — stores your account and dashboard data.
          </li>
          <li>
            <b className="text-ink">Vercel</b> — hosts the website.
          </li>
          <li>
            <b className="text-ink">Groq</b> — when your coach uses AI to draft a week of meals, your questionnaire answers (not your name, email or phone) are sent to Groq to generate
            the draft. Your coach reviews every draft.
          </li>
        </ul>
        <p>Each only gets what it needs to do its job.</p>
      </Section>
      <Section title="Cookies">
        <p>We use one essential cookie to keep you signed in. No advertising or tracking cookies.</p>
      </Section>
      <Section title="How long we keep it">
        <p>
          While your account exists, so you can come back to your history. Payment records are kept as long as tax law requires. Delete your account and we remove the rest within 30
          days.
        </p>
      </Section>
      <Section title="Your choices">
        <p>
          You can see and change most of your data in your dashboard, and wipe your plan data with &ldquo;Start over&rdquo; on your profile. To get a copy of your data or delete
          your account, contact <ContactLine />.
        </p>
      </Section>
    </LegalPage>
  );
}
