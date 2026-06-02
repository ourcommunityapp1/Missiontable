import TopNavBar from "@/components/TopNavBar";
import HeroSection from "@/components/HeroSection";
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
      <MonthlyRhythm />
      <CountryBrowser countries={featuredCountries} />
      <FinalCTA />
      <Footer />
    </main>
  );
}
