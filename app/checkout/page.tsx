import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutClient from "@/components/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ plan?: string }> };

/** Signed-in clients pay here. Signed-out visitors are sent to sign-up first, keeping the plan. */
export default async function CheckoutPage({ searchParams }: Props) {
  const plan = (await searchParams).plan ?? null;
  return (
    <>
      <Navbar />
      <main className="bg-canvas pb-20 pt-28 lg:pb-28 lg:pt-36">
        <CheckoutClient initialPlan={plan} />
      </main>
      <Footer />
    </>
  );
}
