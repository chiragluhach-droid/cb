import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PromiseStrip from "@/components/PromiseStrip";
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
        <PromiseStrip />
        <Pricing />
        <Faq />
        <InstagramFeed />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
