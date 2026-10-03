import { Nav, Hero, Marquee, Reel, How, TryIt, Bento, Results, Pricing, Faq, Footer } from "@/components/Landing";
import { getSession } from "@/lib/auth";
import "./landing.css";

export default async function Home() {
  const s = await getSession();
  return (
    <main>
      <Nav authed={!!s} />
      <Hero />
      <Marquee />
      <Reel />
      <Marquee rev lime items={["made for you", "by a real coach", "updated weekly", "desi af", "PCOS & thyroid aware", "home or gym"]} />
      <How />
      <TryIt />
      <Bento />
      <Results />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}
