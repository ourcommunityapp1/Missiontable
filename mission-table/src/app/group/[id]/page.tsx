import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
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
  isMeetingDatePast,
  recordGroupPageView,
} from '@/lib/queries';
import MemberAccessForm from './MemberAccessForm';
import GroupPageTracker from './GroupPageTracker';
import MemberApp from './MemberApp';
import type { GroupInfo, KitWithMeta, MemberLoopData } from './loopTypes';
import { localNow, gatheringOnOrAfter, gatheringBefore, getRsvps } from '@/lib/gathering';
import { getTablePosts, getInvitesForMember } from '@/lib/memberApp';
import { bestChurchLabel } from '@/lib/people';
import { getChatUnread, chatEnabled } from '@/lib/chat';
import { appIconsFor, homeScreenName } from '@/lib/appIcons';

export const dynamic = 'force-dynamic';

type SearchParams = { token?: string; tab?: string; rsvp?: string; date?: string; install?: string };

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const { token } = await searchParams;
  const group = await getGroupById(id);
  if (!group) return {};
  const title = group.name ?? `${group.countryName} group`;
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return { title: `${title} — Mission Table` };
  // Members get an installable app for their group; the manifest carries their link.
  return {
    title: `${title} — Mission Table`,
    manifest: `/group/${id}/manifest.webmanifest?token=${token}`,
    appleWebApp: { capable: true, title: homeScreenName(title), statusBarStyle: 'default' },
    // The home-screen icon is the group's country photo.
    icons: { apple: appIconsFor(group.countrySlug).apple },
  };
}

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { token, tab, rsvp, date, install } = await searchParams;

  const group = await getGroupById(id);
  if (!group) notFound();

  const currentMemberId = token ? await getMemberIdForToken(id, token) : null;
  const isMember = currentMemberId !== null;
  if (currentMemberId) await recordGroupPageView(id, currentMemberId);

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

  let loop: MemberLoopData | null = null;
  let chatUnread = 0;
  if (isMember && currentMemberId) {
    const rhythm = { rhythm_type: group.rhythmType, day_of_month: group.dayOfMonth, week_of_month: group.weekOfMonth, day_of_week: group.dayOfWeek };
    const today = localNow(group.timezone).date;
    const next = gatheringOnOrAfter(rhythm, today);
    const prev = gatheringBefore(rhythm, today);
    const [rsvps, tablePosts, invites, unread] = await Promise.all([
      next ? getRsvps(id, next) : Promise.resolve({ in: [] as string[], out: [] as string[], inTimes: [] }),
      getTablePosts(id),
      getInvitesForMember(id, currentMemberId, today),
      chatEnabled() ? getChatUnread(id, currentMemberId) : Promise.resolve(0),
    ]);
    chatUnread = unread;
    const churches = members.accepted.map((m) => m.church);
    const toDir = (m: (typeof members.accepted)[number]) => ({ id: m.id, name: m.name, city: m.city, state: m.state, church: bestChurchLabel(m.church, churches) });
    const meRow = members.accepted.find((m) => m.id === currentMemberId);
    loop = {
      groupId: id,
      groupName: group.name ?? `${group.countryName} group`,
      countryName: group.countryName,
      timeLabel: group.time,
      today,
      nextDate: next,
      tableDate: next === today ? today : prev,
      myRsvp: rsvps.in.includes(currentMemberId) ? 'in' : rsvps.out.includes(currentMemberId) ? 'out' : null,
      inMembers: members.accepted.filter((m) => rsvps.in.includes(m.id)).map((m) => ({ id: m.id, name: m.name })),
      outCount: members.accepted.filter((m) => rsvps.out.includes(m.id)).length,
      inTimes: rsvps.inTimes.filter((r) => members.accepted.some((m) => m.id === r.memberId)),
      tablePosts,
      received: invites.received,
      sent: invites.sent,
      me: meRow ? toDir(meRow) : { id: currentMemberId, name: 'You', city: null, state: null, church: null },
      directory: members.accepted.filter((m) => m.id !== currentMemberId).map(toDir),
      autoRsvp: (rsvp === 'in' || rsvp === 'out') && date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { status: rsvp, date } : null,
      initialTab: tab ?? null,
    };
  }

  if (loop && token) {
    const info: GroupInfo = {
      id: group.id,
      name: group.name ?? `${group.countryName} group`,
      countryName: group.countryName,
      rhythm: group.rhythm,
      time: group.time,
      hostName: group.hostedBy,
      startDate: group.startDate,
      isVirtual: group.groupType !== 'in-person',
      place: group.city ? `${group.city}${group.state ? `, ${group.state}` : ''}` : null,
      chatLink: group.chat_link,
      chatEnabled: chatEnabled(),
      iconUrl: appIconsFor(group.countrySlug).apple,
      shortName: homeScreenName(group.name ?? `${group.countryName} group`),
    };
    return (
      <main className="min-h-screen flex flex-col bg-cream">
        <GroupPageTracker
          groupId={id}
          countrySlug={group.countrySlug}
          countryName={group.countryName}
          groupType={group.groupType}
          groupName={group.name}
          memberCount={group.memberCount}
          isMember
          memberToken={token}
        />
        <MemberApp token={token} info={info} loop={loop} kits={kitsWithMeta} fieldPosts={fieldPosts} chatUnread={chatUnread} installRequested={install === '1'} />
      </main>
    );
  }

  // Visitors without a member link: the public group page.
  const isInPerson = group.groupType === 'in-person';
  const spotsRemaining =
    group.maxSize != null ? group.maxSize - group.memberCount : null;
  const description = isInPerson
    ? 'Open to members who are willing to meet monthly with other families at this location.'
    : 'Open to members everywhere. All members meet and pray at the same time in their own home.';
  const countryImage = countries.find((c) => c.slug === group.countrySlug)?.image;

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
        isMember={false}
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
        <div className="relative border-2 border-black overflow-hidden mb-8 h-[260px] md:h-auto md:aspect-[16/6] md:min-h-[220px]">
          {countryImage && (
            <Image src={countryImage} alt={group.countryName} fill unoptimized className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/0" />
          <span className="absolute top-3 left-3 bg-cream border border-black px-2.5 py-1 font-inter text-[10px] font-semibold tracking-[0.1em] uppercase">
            {isInPerson ? 'In-Person Group' : 'Virtual Group'} · {group.countryName}
          </span>
          <div className="absolute left-0 right-0 bottom-0 p-5 md:p-7 flex flex-col gap-2">
            <h1 className="font-fraunces font-bold text-[36px] md:text-[56px] uppercase leading-none tracking-[-0.04em] fraunces-64 text-cream">
              {group.name ?? group.hostedBy}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-inter text-sm text-cream/85">
                Hosted By {group.hostedBy}
                {isInPerson && group.city && ` · ${group.city}${group.state ? `, ${group.state}` : ''}`}
              </p>
            </div>
          </div>
        </div>

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
      </div>

      <Footer />
    </main>
  );
}
