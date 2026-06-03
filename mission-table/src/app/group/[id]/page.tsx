import { notFound } from 'next/navigation';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { getGroupById } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = await getGroupById(id);
  if (!group) notFound();

  const isInPerson = group.groupType === 'in-person';
  const spotsRemaining =
    group.maxSize != null ? group.maxSize - group.memberCount : null;
  const description = isInPerson
    ? 'Open to members who are willing to meet monthly with other families at this location.'
    : 'Open to members everywhere. All members meet and pray at the same time in their own home.';

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />

      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 py-8 pb-24">

        {/* Back nav */}
        <div className="mb-8">
          <Link
            href={`/country/${group.countrySlug}`}
            className="inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1 hover:text-warm transition-colors"
          >
            <span aria-hidden="true">←</span>
            {group.countryName}
          </Link>
        </div>

        <div className="max-w-[640px]">

          {/* Header */}
          <div className="border-t-2 border-black pt-4 mb-8">
            <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-2">
              {group.groupType === 'virtual' ? 'Virtual Group' : 'In-Person Group'} · {group.countryName}
            </p>
            <h1 className="font-fraunces font-bold text-[48px] md:text-[64px] uppercase leading-none tracking-[-0.04em] fraunces-64 text-black">
              {group.hostedBy}
            </h1>
            {isInPerson && group.city && (
              <p className="font-inter text-base text-warm mt-2">
                {group.city}{group.state ? `, ${group.state}` : ''}
              </p>
            )}
          </div>

          {/* Description */}
          <p className="font-inter text-base text-warm mb-8">{description}</p>

          {/* Details grid */}
          <div className="border-2 border-black p-5 mb-6">
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                  Country
                </p>
                <p className="font-inter text-sm text-warm">{group.countryName}</p>
              </div>
              <div>
                <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                  Host
                </p>
                <p className="font-inter text-sm text-warm">{group.hostedBy}</p>
              </div>
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
              {isInPerson && group.city && (
                <div>
                  <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                    Location
                  </p>
                  <p className="font-inter text-sm text-warm">
                    {group.city}{group.state ? `, ${group.state}` : ''}
                  </p>
                </div>
              )}
              <div>
                <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                  Members
                </p>
                <p className="font-inter text-sm text-warm">
                  {group.memberCount} joined
                  {spotsRemaining != null
                    ? ` · ${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} remaining`
                    : ''}
                </p>
              </div>
              <div>
                <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                  Begins
                </p>
                <p className="font-inter text-sm text-warm">
                  {new Date(group.startDate + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Join CTA */}
          <Link
            href={`/join/${group.id}`}
            className="block w-full bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase text-center py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors"
          >
            Join This Group →
          </Link>

        </div>
      </div>

      <Footer />
    </main>
  );
}
