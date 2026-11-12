import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import FoodStrip from "@/components/FoodStrip";
import HowItWorks from "@/components/HowItWorks";
import SampleDay from "@/components/SampleDay";
import Kitchen from "@/components/Kitchen";
import Coach from "@/components/Coach";
import Dashboard from "@/components/Dashboard";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import InstagramFeed from "@/components/InstagramFeed";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ui/ScrollProgress";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <FoodStrip />
        <HowItWorks />
        <SampleDay />
        <Kitchen />
        <Coach />
        <Dashboard />
        <div className="overflow-hidden bg-canvas py-6 sm:py-10">
          <Ticker items={["Coach-reviewed", "Ghar ka khana", "No crash diets", "Plans that adapt"]} reverse tilt={1.5} />
        </div>
        <Pricing />
        <Faq />
        <InstagramFeed />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
