import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutClient from "@/components/CheckoutClient";
import { CHECKOUT_MODE, parsePlan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ plan?: string; mode?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { kind, duration } = parsePlan(sp.plan);
  // `?mode=paid` previews the dummy payment flow without changing the setting.
  const mode = sp.mode === "paid" || sp.mode === "free" ? sp.mode : CHECKOUT_MODE;

  return (
    <>
      <Navbar />
      <main className="bg-canvas pb-20 pt-28 lg:pb-28 lg:pt-36">
        <CheckoutClient initialKind={kind} initialDuration={duration} mode={mode} />
      </main>
      <Footer />
    </>
  );
}
