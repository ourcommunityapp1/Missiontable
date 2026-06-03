import TopNavBar from "@/components/TopNavBar";
import Footer from "@/components/Footer";
import { getCountriesByContinent, CONTINENT_ORDER, countries } from "@/data/countries";
import Link from "next/link";
import { getAllGroupsForSearch } from "@/lib/queries";
import BrowseSearch from "./BrowseSearch";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "The Nations — Mission Table",
  description: "Find a country. Join a group. Pray for the nations.",
};

export default async function BrowsePage() {
  const byContinent = getCountriesByContinent();
  const allGroups = await getAllGroupsForSearch();

  const continentKeys = [
    ...CONTINENT_ORDER.filter((c) => byContinent[c]),
    ...Object.keys(byContinent).filter((c) => !CONTINENT_ORDER.includes(c)),
  ];

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />

      <div className="max-w-[1280px] mx-auto w-full pt-16 md:pt-24 pb-24">

        {/* Page header */}
        <div className="px-6 md:px-16 mb-10 md:mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1 hover:text-warm transition-colors mb-10 md:mb-12"
          >
            <span aria-hidden="true">←</span>
            Home
          </Link>
          <h1 className="font-fraunces font-bold text-[72px] md:text-[96px] lg:text-[120px] uppercase leading-[0.9] tracking-[-0.04em] fraunces-64 text-black">
            THE NATIONS
          </h1>
          <p className="font-inter text-warm text-base md:text-lg mt-4">
            Find a country. Join a group. Pray for the nations.
          </p>
        </div>

        <BrowseSearch
          countries={countries}
          groups={allGroups}
          byContinent={byContinent}
          continentKeys={continentKeys}
        />

      </div>

      <Footer />
    </main>
  );
}
