import type { Metadata } from "next";
import Onboarding from "@/components/app/Onboarding";

export const metadata: Metadata = { title: "Your questionnaire", robots: { index: false, follow: false } };

export default function OnboardingPage() {
  return <Onboarding />;
}
