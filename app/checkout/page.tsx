import { redirect } from "next/navigation";
import { parsePlan } from "@/lib/plans";

type Props = { searchParams: Promise<{ plan?: string }> };

/** Plans now go straight to sign-up; old /checkout links forward there with the same plan. */
export default async function CheckoutPage({ searchParams }: Props) {
  const { kind, duration } = parsePlan((await searchParams).plan);
  redirect(`/login?mode=signup&plan=${kind}-${duration}`);
}
