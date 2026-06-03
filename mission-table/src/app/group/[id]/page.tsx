import { notFound } from 'next/navigation';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { getGroupById, getMembersForGroup, getLatestKit } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [group, members, latestKit] = await Promise.all([
    getGroupById(id),
    getMembersForGroup(id),
    getLatestKit(id),
  ]);
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
              {group.name ?? group.hostedBy}
            </h1>
            <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mt-2">
              Hosted By {group.hostedBy}
            </p>
            {isInPerson && group.city && (
              <p className="font-inter text-base text-warm mt-1">
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
              {group.name && (
                <div>
                  <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                    Group Name
                  </p>
                  <p className="font-inter text-sm text-warm">{group.name}</p>
                </div>
              )}
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

          {/* Members */}
          {members.accepted.length > 0 && (
            <div className="border-2 border-black p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
                  Group Members ({members.accepted.length})
                </p>
                {group.chat_link && (
                  <a
                    href={group.chat_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-b-2 border-black pb-0.5 hover:text-warm transition-colors"
                  >
                    Join Chat →
                  </a>
                )}
              </div>
              <div className="flex flex-col">
                {members.accepted.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border-t border-black/20 py-2 first:border-t-0">
                    <p className="font-inter text-sm text-black">{m.name}</p>
                    {(m.city || m.state) && (
                      <p className="font-inter text-xs text-warm">
                        {[m.city, m.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest kit */}
          {latestKit && (
            <div className="border-2 border-black p-5 mb-6">
              <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-4">
                This Month's Kit —{' '}
                {new Date(latestKit.meeting_date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>

              {latestKit.recipe_name && (
                <div className="mb-4">
                  <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Recipe</p>
                  {latestKit.recipe_url ? (
                    <a
                      href={latestKit.recipe_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-inter text-sm font-semibold text-black border-b border-black"
                    >
                      {latestKit.recipe_name}
                    </a>
                  ) : (
                    <p className="font-inter text-sm text-black">{latestKit.recipe_name}</p>
                  )}
                  {latestKit.side_dish && (
                    <p className="font-inter text-xs text-warm mt-1">Side dish: {latestKit.side_dish}</p>
                  )}
                </div>
              )}

              {latestKit.scripture_text && (
                <div className="mb-4">
                  <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Scripture</p>
                  <blockquote className="border-l-2 border-black pl-3 font-inter text-sm text-warm italic leading-[1.6]">
                    {latestKit.scripture_text}
                  </blockquote>
                  {latestKit.scripture_reference && (
                    <p className="font-inter text-xs text-warm mt-1">— {latestKit.scripture_reference}</p>
                  )}
                </div>
              )}

              {latestKit.commentary && (
                <div className="mb-4">
                  <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Commentary</p>
                  <p className="font-inter text-sm text-warm whitespace-pre-line leading-[1.6]">{latestKit.commentary}</p>
                </div>
              )}

              {latestKit.prayer_requests && (
                <div className="mb-4">
                  <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Prayer Requests</p>
                  <p className="font-inter text-sm text-warm whitespace-pre-line leading-[1.6]">{latestKit.prayer_requests}</p>
                </div>
              )}

              {latestKit.gathering_prompt && (
                <div>
                  <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Gathering Prompt</p>
                  <p className="font-inter text-sm text-warm italic leading-[1.6]">{latestKit.gathering_prompt}</p>
                </div>
              )}
            </div>
          )}

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
