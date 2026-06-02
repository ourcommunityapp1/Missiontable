import Image from "next/image";
import Link from "next/link";
import type { Country } from "@/data/countries";

export default function CountryCard({ country }: { country: Country }) {
  const hasGroups = country.groupCount > 0;

  return (
    <Link
      href={`/country/${country.slug}`}
      className="block border-2 border-black group"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden border-b-2 border-black">
        <Image
          src={country.image}
          alt={country.name}
          fill
          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          unoptimized
        />
        {/* Region tag */}
        <div className="absolute top-3 left-3 bg-cream border border-black px-2 py-1">
          <span className="font-inter text-[10px] tracking-[0.1em] uppercase leading-none">
            {country.region}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-cream px-4 py-4">
        <p
          className="font-fraunces font-bold text-[28px] leading-tight fraunces-32 text-black"
        >
          {country.name}
        </p>
        <p className={`font-inter text-sm font-semibold mt-1 ${hasGroups ? 'text-accent' : 'text-warm'}`}>
          {hasGroups
            ? `${country.groupCount} ${country.groupCount === 1 ? 'Group' : 'Groups'}`
            : '0 Groups — Be the first'}
        </p>
      </div>
    </Link>
  );
}
