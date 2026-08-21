import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { countries } from '@/data/countries';
import {
  getGroupById,
  getMembersForGroup,
  getMemberIdForToken,
  getKitsForGroup,
  getAttendanceForKits,
  getFieldPostsForGroup,
  getNextExpectedMeetingDate,
  isMeetingDatePast,
} from '@/lib/queries';
import MemberAccessForm from './MemberAccessForm';
import GroupPageTracker from './GroupPageTracker';
import GroupTabs from './GroupTabs';
import HeroInviteButton from './HeroInviteButton';
import type { KitWithMeta } from './MealsTab';

export const dynamic = 'force-dynamic';

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  const group = await getGroupById(id);
  if (!group) notFound();

  const currentMemberId = token ? await getMemberIdForToken(id, token) : null;
  const isMember = currentMemberId !== null;

  const [members, kits, fieldPosts] = isMember
    ? await Promise.all([getMembersForGroup(id), getKitsForGroup(id), getFieldPostsForGroup(id)])
    : [{ accepted: [], pending: [] }, [], []];

  const kitIds = kits.map((k) => k.id);
  const attendanceByKit = isMember && kitIds.length > 0 ? await getAttendanceForKits(kitIds) : {};

  const kitsWithMeta: KitWithMeta[] = kits.map((kit) => {
    const att = attendanceByKit[kit.id];
    return {
      kit,
      isPast: isMeetingDatePast(kit.meeting_date),
      attendanceCount: att?.count ?? 0,
      attendanceMembers: att?.members ?? [],
    };
  });

  const nextExpectedDate = getNextExpectedMeetingDate({
    rhythmType: group.rhythmType,
    dayOfMonth: group.dayOfMonth,
    weekOfMonth: group.weekOfMonth,
    dayOfWeek: group.dayOfWeek,
  });
  const hasKitForNextExpected = kits.some((k) => k.meeting_date === nextExpectedDate);
  const mostRecentKit = kits[0] ?? null;
  const showTbdPlaceholder = !hasKitForNextExpected && (!mostRecentKit || isMeetingDatePast(mostRecentKit.meeting_date));
  const nextExpectedDateLabel = nextExpectedDate
    ? new Date(nextExpectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : null;

  const isInPerson = group.groupType === 'in-person';
  const spotsRemaining =
    group.maxSize != null ? group.maxSize - group.memberCount : null;
  const description = isInPerson
    ? 'Open to members who are willing to meet monthly with other families at this location.'
    : 'Open to members everywhere. All members meet and pray at the same time in their own home.';
  const countryImage = countries.find((c) => c.slug === group.countrySlug)?.image;
  const shownMembers = members.accepted.slice(0, 5);
  const extraMemberCount = members.accepted.length - shownMembers.length;

  const detailsGrid = (
    <div className="border-2 border-black p-5 mb-6">
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Country</p>
          <p className="font-inter text-sm text-warm">{group.countryName}</p>
        </div>
        <div>
          <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Host</p>
          <p className="font-inter text-sm text-warm">{group.hostedBy}</p>
        </div>
        {group.name && (
          <div>
            <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Group Name</p>
            <p className="font-inter text-sm text-warm">{group.name}</p>
          </div>
        )}
        <div>
          <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Rhythm</p>
          <p className="font-inter text-sm text-warm">{group.rhythm}</p>
        </div>
        <div>
          <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Time</p>
          <p className="font-inter text-sm text-warm">{group.time}</p>
        </div>
        {isInPerson && group.city && (
          <div>
            <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Location</p>
            <p className="font-inter text-sm text-warm">
              {group.city}{group.state ? `, ${group.state}` : ''}
            </p>
          </div>
        )}
        <div>
          <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Members</p>
          <p className="font-inter text-sm text-warm">
            {group.memberCount} joined
            {spotsRemaining != null ? ` · ${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} remaining` : ''}
          </p>
        </div>
        <div>
          <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Begins</p>
          <p className="font-inter text-sm text-warm">
            {new Date(group.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />
      <GroupPageTracker
        groupId={id}
        countrySlug={group.countrySlug}
        countryName={group.countryName}
        groupType={group.groupType}
        groupName={group.name}
        memberCount={group.memberCount}
        isMember={isMember}
        memberToken={token}
      />

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

        {/* Hero */}
        <div className="relative border-2 border-black overflow-hidden mb-8 aspect-[16/9] md:aspect-[16/6] min-h-[220px]">
          {countryImage && (
            <Image src={countryImage} alt={group.countryName} fill unoptimized className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/0" />
          <span className="absolute top-3 left-3 bg-cream border border-black px-2.5 py-1 font-inter text-[10px] font-semibold tracking-[0.1em] uppercase">
            {isInPerson ? 'In-Person Group' : 'Virtual Group'} · {group.countryName}
          </span>
          {isMember && <HeroInviteButton groupId={group.id} />}
          <div className="absolute left-0 right-0 bottom-0 p-5 md:p-7 flex flex-col gap-2">
            <h1 className="font-fraunces font-bold text-[36px] md:text-[56px] uppercase leading-none tracking-[-0.04em] fraunces-64 text-cream">
              {group.name ?? group.hostedBy}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-inter text-sm text-cream/85">
                Hosted By {group.hostedBy}
                {isInPerson && group.city && ` · ${group.city}${group.state ? `, ${group.state}` : ''}`}
              </p>
              {isMember && shownMembers.length > 0 && (
                <div className="flex items-center" aria-label={`${members.accepted.length} members`}>
                  {shownMembers.map((m, i) => (
                    <div
                      key={m.id}
                      style={{ marginLeft: i === 0 ? 0 : -10 }}
                      className="w-8 h-8 rounded-full border-2 border-cream bg-cream-dark flex items-center justify-center font-fraunces text-[11px] text-black"
                    >
                      {m.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
                    </div>
                  ))}
                  {extraMemberCount > 0 && (
                    <div style={{ marginLeft: -10 }} className="w-8 h-8 rounded-full border-2 border-cream bg-cream/90 flex items-center justify-center font-inter text-[10px] font-semibold text-black">
                      +{extraMemberCount}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isMember && currentMemberId && token ? (
          <GroupTabs
            token={token}
            currentMemberId={currentMemberId}
            kits={kitsWithMeta}
            showTbdPlaceholder={showTbdPlaceholder}
            nextExpectedDateLabel={nextExpectedDateLabel}
            meetingTimeLabel={group.time}
            countryName={group.countryName}
            fieldPosts={fieldPosts}
            members={members.accepted}
            chatLink={group.chat_link}
            infoSlot={
              <div className="max-w-[640px] mb-8">
                <p className="font-inter text-base text-warm mb-8">{description}</p>
                {detailsGrid}
              </div>
            }
          />
        ) : (
          <div className="max-w-[640px]">
            {/* Description */}
            <p className="font-inter text-base text-warm mb-8">{description}</p>

            {detailsGrid}

            {/* Join CTA */}
            <Link
              href={`/join/${group.id}`}
              className="block w-full bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase text-center py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors"
            >
              Join This Group →
            </Link>

            <MemberAccessForm groupId={group.id} />
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
