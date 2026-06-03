import TopNavBar from "@/components/TopNavBar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import MonthlyRhythm from "@/components/MonthlyRhythm";
import CountryBrowser from "@/components/CountryBrowser";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import { getFeaturedCountries } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const featuredCountries = await getFeaturedCountries(3);

  return (
    <main className="min-h-screen flex flex-col">
      <TopNavBar />
      <HeroSection />
      <HowItWorks />
      <MonthlyRhythm />
      <CountryBrowser countries={featuredCountries} />
      <FinalCTA />
      <Footer />
    </main>
  );
}
