import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { countries } from '@/data/countries';
import { getGroupsForCountry } from '@/lib/queries';
import { JP_SCALE } from '@/data/jpScale';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return countries.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const country = countries.find((c) => c.slug === slug);
  if (!country) return {};
  return {
    title: `${country.name} — Mission Table`,
    description: `Pray for ${country.name}. Join a Mission Table.`,
  };
}

function formatPopulation(pop: number): string {
  if (pop >= 1_000_000_000) {
    const b = pop / 1_000_000_000;
    return `${b.toFixed(2).replace(/\.?0+$/, '')}B`;
  }
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  return `${Math.round(pop / 1_000)}K`;
}

function formatEvangelical(pct: number | null): string {
  if (pct === null || pct < 0.1) return '< 0.1%';
  return `${pct.toFixed(1)}%`;
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const country = countries.find((c) => c.slug === slug);
  if (!country) notFound();

  const groups = await getGroupsForCountry(country.slug);
  const scaleInfo = JP_SCALE[country.jpScale];
  const popFormatted = formatPopulation(country.population);
  const hasGroups = groups.length > 0;

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />

      <div className="max-w-[1280px] mx-auto w-full">

        {/* Back nav */}
        <div className="px-6 md:px-16 pt-8 pb-4">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1 hover:text-warm transition-colors"
          >
            <span aria-hidden="true">←</span>
            The Nations
          </Link>
        </div>

        {/* Hero */}
        <div className="px-6 md:px-16 mb-8">
          <div className="relative aspect-[4/3] md:aspect-[16/6] overflow-hidden border-2 border-black">
            <Image
              src={country.image}
              alt={country.name}
              fill
              className="object-cover grayscale"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
            {/* Region tag */}
            <div className="absolute top-3 left-3 bg-cream border border-black px-2 py-1">
              <span className="font-inter text-[10px] tracking-[0.1em] uppercase leading-none">
                {country.region}
              </span>
            </div>
            {/* Country name */}
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
              <h1 className="font-fraunces font-bold text-[clamp(42px,10vw,120px)] uppercase leading-none tracking-[-0.04em] text-white fraunces-64">
                {country.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Two-column layout: sidebar (stats) + main (tables) */}
        <div className="px-6 md:px-16 pb-24 flex flex-col md:flex-row md:items-start gap-6 md:gap-8">

          {/* Left sidebar — stat boxes */}
          <div className="w-full md:w-[320px] md:flex-none flex flex-col gap-4">

            {/* Field Report */}
            <div className="border-2 border-black p-5">
              <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase mb-3">
                Field Report
              </p>
              {/* Mobile: two lines. Desktop: one line. */}
              <div className="mb-4">
                <p className="font-fraunces font-bold leading-none fraunces-48 text-black md:hidden">
                  <span className="text-[52px]">{popFormatted}</span>
                  <br />
                  <span className="text-[40px]">souls</span>
                </p>
                <p className="hidden md:block font-fraunces font-bold text-[36px] leading-none fraunces-32 text-black">
                  {popFormatted} souls
                </p>
              </div>
              <div className="border-t border-black/20 pt-3 flex flex-col gap-2">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-inter text-sm text-warm">Primary Religion</span>
                  <span className="font-inter text-sm font-semibold text-black text-right">{country.primaryReligion}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-inter text-sm text-warm">% Evangelical</span>
                  <span className="font-inter text-sm font-semibold text-accent">{formatEvangelical(country.percentEvangelical)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-inter text-sm text-warm">People Groups</span>
                  <span className="font-inter text-sm font-semibold text-black">{country.peopleGroups.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-inter text-sm text-warm">Least Reached</span>
                  <span className="font-inter text-sm font-semibold text-black">{country.leastReached.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-inter text-sm text-warm">10/40 Window</span>
                  <span className="font-inter text-sm font-semibold text-black">{country.in1040Window ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="border-t border-black/20 mt-3 pt-3">
                <p className="font-inter text-[10px] text-muted">Data from The Joshua Project</p>
              </div>
            </div>

            {/* Progress Scale */}
            <div className="border-2 border-black p-5">
              <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase mb-3">
                Progress Scale*
              </p>
              {/* Dots */}
              <div className="flex gap-2 mb-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 border-black ${
                      i < country.jpScale ? 'bg-black' : 'bg-cream'
                    }`}
                  />
                ))}
              </div>
              <p className="font-fraunces font-bold text-[28px] leading-tight fraunces-32 text-black uppercase mb-1">
                {scaleInfo.label}
              </p>
              <p className="font-inter text-xs text-muted uppercase tracking-[0.05em] mb-3">
                Scale {country.jpScale} of 5
              </p>
              <p className="font-inter text-sm text-warm mb-4">{scaleInfo.description}</p>
              {/* Inset box */}
              <div className="border border-black bg-cream-dark p-3">
                <p className="font-inter text-xs text-warm">
                  The Joshua Project Scale measures progress from 1 (Unreached) to 5 (Significantly Reached).
                </p>
                <a
                  href="https://joshuaproject.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-inter text-xs font-semibold text-black underline mt-1 inline-block"
                >
                  Learn More ↗
                </a>
              </div>
              <p className="font-inter text-[10px] text-muted mt-3">*Data from The Joshua Project</p>
            </div>
          </div>

          {/* Right — tables section */}
          <div className="flex-1 min-w-0">

            {/* Section header */}
            <div className="border-t-2 border-black pt-4 mb-6">
              <h2 className="font-inter font-semibold text-sm tracking-[0.1em] uppercase text-black">
                Groups for {country.name}
              </h2>
              <p className="font-inter text-sm text-warm mt-1">
                {hasGroups
                  ? `${groups.length} ${groups.length === 1 ? 'group' : 'groups'} praying for this nation.`
                  : 'No groups yet.'}
              </p>
            </div>

            {/* Group cards */}
            {hasGroups && (
              <div className="flex flex-col gap-4 mb-6">
                {groups.map((group) => {
                  const isInPerson = group.groupType === 'in-person';
                  const spotsRemaining =
                    group.maxSize != null ? group.maxSize - group.memberCount : null;
                  const description = isInPerson
                    ? 'Open to members who are willing to meet monthly with other families at this location.'
                    : 'Open to members everywhere. All members meet and pray at the same time in their own home.';

                  return (
                    <div key={group.id} className="border-2 border-black p-5">
                      <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-2">
                        Hosted By
                      </p>
                      <p className="font-fraunces font-bold text-2xl fraunces-32 text-black uppercase mb-1">
                        {group.hostedBy}
                      </p>
                      {isInPerson && group.city && (
                        <p className="font-inter text-sm text-warm mb-1">
                          {group.city}{group.state ? `, ${group.state}` : ''}
                        </p>
                      )}
                      <p className="font-inter text-sm text-warm italic mb-4">{description}</p>

                      <div className="border-t border-black/20 pt-3 mb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                              Rhythm
                            </p>
                            <p className="font-inter text-sm text-warm">{group.rhythm}</p>
                          </div>
                          <div>
                            <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                              Time
                            </p>
                            <p className="font-inter text-sm text-warm">{group.time}</p>
                          </div>
                        </div>
                        {isInPerson && (
                          <div className="mt-3">
                            <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                              Roster
                            </p>
                            <p className="font-inter text-sm text-warm">
                              {group.memberCount} members
                              {spotsRemaining != null &&
                                ` · ${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} remaining`}
                            </p>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/group/${group.id}`}
                        className="block w-full bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase text-center py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors"
                      >
                        View Group Details →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

{/* No empty state box — "No groups yet." is already shown in the section subline above */}

            {/* Want to Host a Group — always shown */}
            <div className="border-2 border-black p-5">
              <h3 className="font-fraunces font-bold text-[28px] leading-tight fraunces-32 text-black uppercase mb-3">
                Want to Host a Group?
              </h3>
              {/* TODO: subtext should be dynamic — "Be the first" only when hasTables is false;
                  when groups exist, use something like "Start your own group for {country.name}." */}
              <p className="font-inter text-sm text-warm mb-4">
                Be the first to start a Mission Table for {country.name}.
              </p>
              <Link
                href="/start"
                className="block w-full bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase text-center py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors"
              >
                Start a Group →
              </Link>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
