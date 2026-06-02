import TopNavBar from "@/components/TopNavBar";
import Footer from "@/components/Footer";
import CountryCard from "@/components/CountryCard";
import { getCountriesByContinent, CONTINENT_ORDER } from "@/data/countries";

export const metadata = {
  title: "The Nations — Mission Table",
  description: "Find a country. Join a table. Pray for a year.",
};

export default function BrowsePage() {
  const byContinent = getCountriesByContinent();

  // Use defined order, then append any continents not in the order list
  const continentKeys = [
    ...CONTINENT_ORDER.filter((c) => byContinent[c]),
    ...Object.keys(byContinent).filter((c) => !CONTINENT_ORDER.includes(c)),
  ];

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />

      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 pt-16 md:pt-24 pb-24">

        {/* Page header */}
        <div className="mb-16 md:mb-20">
          <h1
            className="font-fraunces font-bold text-[72px] md:text-[96px] lg:text-[120px] uppercase leading-[0.9] tracking-[-0.04em] fraunces-64 text-black"
          >
            THE NATIONS
          </h1>
          <p className="font-inter text-warm text-base md:text-lg mt-4">
            Find a country. Join a table. Pray for a year.
          </p>
        </div>

        {/* Continent sections */}
        <div className="flex flex-col gap-16 md:gap-20">
          {continentKeys.map((continent) => {
            const countries = byContinent[continent];
            return (
              <section key={continent}>
                {/* Continent divider */}
                <div className="border-t-2 border-black pt-4 mb-8">
                  <span className="font-inter font-semibold text-sm tracking-[0.1em] uppercase text-black">
                    {continent}
                  </span>
                </div>

                {/* Cards — 3-col desktop, snap-scroll mobile */}
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:pb-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible scrollbar-hide">
                  {countries.map((country) => (
                    <div
                      key={country.slug}
                      className="flex-none w-[82vw] sm:w-[52vw] md:w-auto snap-start"
                    >
                      <CountryCard country={country} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <Footer />
    </main>
  );
}
