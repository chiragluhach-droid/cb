import { Nav, Hero, Stats, Features, How, TryIt, Results, Pricing, Faq, Footer } from "@/components/Landing";
import { getSession } from "@/lib/auth";
import "./landing.css";

export default async function Home() {
  const s = await getSession();
  return (
    <main className="landing">
      <Nav authed={!!s} />
      <Hero />
      <Stats />
      <Features />
      <How />
      <TryIt />
      <Results />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}
