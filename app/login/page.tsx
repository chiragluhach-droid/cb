import type { Metadata } from "next";
import AuthScreen from "@/components/auth/AuthScreen";

export const metadata: Metadata = {
  title: "Log in or sign up",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | undefined>> };

/** Strip to digits; drop a leading 91 from 12-digit Indian numbers. */
const cleanPhone = (p?: string) => {
  const d = (p ?? "").replace(/\D/g, "");
  return d.length === 12 && d.startsWith("91") ? d.slice(2) : d.slice(-11);
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <AuthScreen
      initialMode={sp.mode === "signup" ? "signup" : "login"}
      plan={sp.plan ?? null}
      name={sp.name ?? ""}
      email={sp.email ?? ""}
      phone={cleanPhone(sp.phone)}
      next={sp.next ?? null}
    />
  );
}
