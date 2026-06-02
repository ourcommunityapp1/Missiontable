import Image from "next/image";
import Link from "next/link";

const moroccoImg = "https://www.figma.com/api/mcp/asset/c36eefc2-255c-42d8-84e1-09e0cc1d14a8";
const thailandImg = "https://www.figma.com/api/mcp/asset/c17c2ba2-553a-4e39-a8a7-1e45fb604c54";
const peruImg = "https://www.figma.com/api/mcp/asset/cc5e9052-866a-4f73-bdda-b1b7a8d35a3e";

const countries = [
  { name: "Morocco", region: "North Africa", groups: 12, image: moroccoImg, bg: "#E6DFD1" },
  { name: "Thailand", region: "Southeast Asia", groups: 3, image: thailandImg, bg: "#EAE8E3" },
  { name: "Peru", region: "South America", groups: 0, image: peruImg, bg: "#E4E2DD" },
];

export default function CountryBrowser() {
  return (
    <section className="bg-cream border-t-2 border-black px-6 md:px-16 py-16 md:py-24 overflow-hidden">
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="mb-8 md:mb-16">
          <h2
            className="font-fraunces font-bold text-5xl md:text-[64px] uppercase tracking-[-0.03em] leading-[1.05] mb-3 fraunces-64"
          >
            EVERY COUNTRY,<br />ONE HEART.
          </h2>
          <p className="font-inter text-warm text-base mb-6">
            Explore tables forming around specific nations and join the movement where you feel called.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1 hover:text-warm transition-colors"
          >
            VIEW ALL COUNTRIES
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Cards — horizontal scroll on mobile, 3-col grid on desktop */}
        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide">
          {countries.map((country) => (
            <Link
              key={country.name}
              href={`/country/${country.name.toLowerCase()}`}
              className="flex-none w-[80vw] sm:w-[60vw] md:w-auto snap-start flex flex-col gap-4 group"
            >
              {/* Card image */}
              <div className="border-2 border-black p-4" style={{ backgroundColor: country.bg }}>
                <div className="relative border-2 border-black overflow-hidden aspect-[3/4]">
                  <Image
                    src={country.image}
                    alt={country.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Region tag */}
                  <div className="absolute top-4 left-4 bg-cream border-2 border-black px-3 py-1">
                    <span className="font-inter text-[10px] tracking-[0.1em] uppercase">{country.region}</span>
                  </div>
                </div>
              </div>

              {/* Card footer */}
              <div className="flex items-baseline justify-between">
                <span
                  className="font-fraunces font-bold text-3xl fraunces-32"
                >{country.name}</span>
                <span className="font-inter font-semibold text-sm tracking-[0.05em] text-accent">
                  {country.groups} {country.groups === 1 ? "Group" : "Groups"}
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
