import TopNavBar from "@/components/TopNavBar";
import HeroSection from "@/components/HeroSection";
import MonthlyRhythm from "@/components/MonthlyRhythm";
import CountryBrowser from "@/components/CountryBrowser";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <TopNavBar />
      <HeroSection />
      <MonthlyRhythm />
      <CountryBrowser />
      <FinalCTA />
      <Footer />
    </main>
  );
}
