'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CountryCard from '@/components/CountryCard';
import type { Country } from '@/data/countries';
import type { SearchableGroup } from '@/lib/queries';

type Props = {
  countries: Country[];
  groups: SearchableGroup[];
  byContinent: Record<string, Country[]>;
  continentKeys: string[];
};

export default function BrowseSearch({ countries, groups, byContinent, continentKeys }: Props) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const matchedCountries = q
    ? countries.filter((c) => c.name.toLowerCase().includes(q))
    : [];

  const matchedGroups = q
    ? groups.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.countryName.toLowerCase().includes(q) ||
          g.hostedBy.toLowerCase().includes(q),
      )
    : [];

  const hasResults = matchedCountries.length > 0 || matchedGroups.length > 0;

  return (
    <>
      {/* Search bar */}
      <div className="px-6 md:px-16 mb-12">
        <div className="relative max-w-[560px]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries or groups…"
            className="w-full border-2 border-black bg-cream px-4 py-3 pr-10 font-inter text-base text-black placeholder:text-muted focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-inter text-muted hover:text-black text-lg leading-none"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Search results */}
      {q && (
        <div className="px-6 md:px-16 flex flex-col gap-12">
          {!hasResults && (
            <p className="font-inter text-base text-warm">No results for &ldquo;{query}&rdquo;</p>
          )}

          {/* Country results */}
          {matchedCountries.length > 0 && (
            <section>
              <div className="border-t-2 border-black pt-4 mb-8">
                <span className="font-inter font-semibold text-sm tracking-[0.1em] uppercase text-black">
                  Countries
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {matchedCountries.map((country) => (
                  <CountryCard key={country.slug} country={country} />
                ))}
              </div>
            </section>
          )}

          {/* Group results */}
          {matchedGroups.length > 0 && (
            <section>
              <div className="border-t-2 border-black pt-4 mb-8">
                <span className="font-inter font-semibold text-sm tracking-[0.1em] uppercase text-black">
                  Groups
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {matchedGroups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/group/${group.id}`}
                    className="flex items-center justify-between border-2 border-black p-5 hover:bg-cream-dark transition-colors"
                  >
                    <div>
                      <p className="font-fraunces font-bold text-[22px] uppercase leading-none fraunces-32 text-black mb-1">
                        {group.name}
                      </p>
                      <p className="font-inter text-xs font-semibold tracking-[0.1em] uppercase text-warm">
                        {group.countryName} · {group.groupType === 'virtual' ? 'Virtual' : 'In-Person'}
                      </p>
                    </div>
                    <span className="font-inter font-semibold text-sm text-black ml-4 flex-none">→</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Continent grid — hidden when searching */}
      {!q && (
        <div className="flex flex-col gap-16 md:gap-20">
          {continentKeys.map((continent) => {
            const continentCountries = byContinent[continent];
            return (
              <section key={continent}>
                <div className="px-6 md:px-16 border-t-2 border-black pt-4 mb-8">
                  <span className="font-inter font-semibold text-sm tracking-[0.1em] uppercase text-black">
                    {continent}
                  </span>
                </div>
                <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pl-6 pr-6 pb-2 scrollbar-hide">
                  {continentCountries.map((country) => (
                    <div key={country.slug} className="flex-none w-[82vw] snap-start">
                      <CountryCard country={country} />
                    </div>
                  ))}
                </div>
                <div className="hidden md:grid md:grid-cols-3 md:gap-6 px-16">
                  {continentCountries.map((country) => (
                    <CountryCard key={country.slug} country={country} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
