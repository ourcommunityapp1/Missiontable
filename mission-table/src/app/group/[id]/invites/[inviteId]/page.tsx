import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { getGroupById, getMemberIdForToken, getMembersForGroup } from '@/lib/queries';
import { getInviteForMember } from '@/lib/memberApp';
import { bestChurchLabel, initialsOf, placeLabel } from '@/lib/people';
import InviteActions, { CopyAddress } from './InviteActions';
import AddGuests from './AddGuests';
import { fmtDate } from '../../dates';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Invitation — Mission Table', robots: { index: false } };

const FOOD: Record<string, string> = {
  cook: 'is cooking this month’s meal',
  potluck: 'is hosting a potluck. Bring a side if you can.',
  order: 'Everyone orders their own',
};

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; inviteId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id, inviteId } = await params;
  const { token } = await searchParams;
  if (!token) notFound();
  const memberId = await getMemberIdForToken(id, token);
  if (!memberId) notFound();
  const [group, invite, members] = await Promise.all([getGroupById(id), getInviteForMember(inviteId, memberId), getMembersForGroup(id)]);
  if (!group || !invite || invite.group_id !== id) notFound();

  const isInviter = invite.inviter_member_id === memberId;
  const first = invite.inviter.name.split(/\s+/)[0];
  const church = bestChurchLabel(invite.inviter.church, members.accepted.map((m) => m.church));
  const address = [invite.place_type === 'restaurant' ? invite.place_name : null, invite.address_line, [invite.city, invite.state].filter(Boolean).join(', '), invite.zip].filter(Boolean).join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const coming = invite.guests.filter((g) => g.status === 'accepted');
  const back = `/group/${id}?token=${token}&tab=together`;
  const title = isInviter
    ? `Your invitation for ${fmtDate(invite.meeting_date, { month: 'short', day: 'numeric' })}`
    : invite.place_type === 'restaurant' ? `Dinner at ${invite.place_name}` : `Dinner at ${first}'s`;

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />
      <div className="max-w-[640px] mx-auto w-full px-6 py-8 pb-24 flex flex-col gap-6">
        <Link href={back} className="self-start inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1">
          <span aria-hidden="true">←</span> {group.name ?? group.countryName}
        </Link>

        {invite.cancelled_at && (
          <p role="status" className="border-2 border-[#8A3A12] p-4 font-inter text-sm text-[#8A3A12] font-semibold">This invitation was cancelled.</p>
        )}

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="w-14 h-14 shrink-0 rounded-full border-2 border-black bg-cream-dark inline-flex items-center justify-center font-inter font-bold">{initialsOf(invite.inviter.name)}</span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-inter text-xs text-warm">{isInviter ? 'You invited' : `From ${invite.inviter.name}`}{!isInviter && [placeLabel(invite.inviter.city, invite.inviter.state), church].filter(Boolean).length ? ` · ${[placeLabel(invite.inviter.city, invite.inviter.state), church].filter(Boolean).join(' · ')}` : ''}</span>
              <h1 className="font-fraunces font-bold text-[30px] leading-tight tracking-[-0.02em] text-black">{title}</h1>
            </div>
          </div>
          {invite.note && (
            <p className="font-fraunces text-[18px] leading-relaxed border-l-[3px] border-[#8A3A12] pl-3 whitespace-pre-line text-black">“{invite.note}”</p>
          )}
        </section>

        <dl className="border-t-2 border-black">
          <div className="border-b border-[#C9C3B5] py-3.5 flex flex-col gap-0.5">
            <dt className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-warm">When</dt>
            <dd className="font-inter text-base text-black">{fmtDate(invite.meeting_date, { weekday: 'long', month: 'long', day: 'numeric' })}{invite.arrive_time ? ` · arrive ${invite.arrive_time}` : ''}</dd>
            <dd className="font-inter text-sm text-warm">The group prays at {group.time}</dd>
          </div>
          <div className="border-b border-[#C9C3B5] py-3.5 flex flex-col gap-1.5">
            <dt className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-warm">Where</dt>
            <dd className="font-inter text-base text-black leading-snug">
              {invite.place_type === 'restaurant' && <>{invite.place_name}<br /></>}
              {invite.address_line}<br />
              {[invite.city, invite.state].filter(Boolean).join(', ')} {invite.zip}
            </dd>
            <dd className="flex flex-wrap gap-x-5">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="min-h-[44px] inline-flex items-center font-inter text-sm font-semibold underline underline-offset-4">Open in Maps</a>
              <CopyAddress text={address} />
            </dd>
          </div>
          {invite.food && (
            <div className="border-b border-[#C9C3B5] py-3.5 flex flex-col gap-0.5">
              <dt className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-warm">Food</dt>
              <dd className="font-inter text-base text-black">{invite.food === 'order' ? FOOD.order : `${isInviter ? 'You' : first} ${FOOD[invite.food]}`}</dd>
            </div>
          )}
          <div className="border-b border-[#C9C3B5] py-3.5 flex flex-col gap-2">
            <dt className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-warm">
              Who&apos;s coming{invite.seats ? ` · ${coming.length} of ${invite.seats} seats` : ''}
            </dt>
            {invite.guests.map((g) => (
              <dd key={g.memberId} className="flex items-center gap-2.5 font-inter text-sm">
                <span aria-hidden="true" className="w-8 h-8 rounded-full border-2 border-black bg-cream-dark inline-flex items-center justify-center text-[10px] font-bold">{initialsOf(g.name)}</span>
                <span className="flex-1">{g.memberId === memberId ? 'You' : g.name}</span>
                <span className={`text-xs font-semibold ${g.status === 'accepted' ? 'text-[#8A3A12]' : 'text-warm'}`}>
                  {g.status === 'accepted' ? 'Coming' : g.status === 'declined' ? 'Can’t make it' : 'Not answered yet'}
                </span>
              </dd>
            ))}
          </div>
        </dl>

        {isInviter && !invite.cancelled_at && (
          <AddGuests
            token={token}
            groupId={id}
            inviteId={invite.id}
            people={members.accepted
              .filter((m) => m.id !== memberId && !invite.guests.some((g) => g.memberId === m.id))
              .map((m) => ({ id: m.id, name: m.name, city: m.city, state: m.state, church: bestChurchLabel(m.church, members.accepted.map((x) => x.church)) }))}
          />
        )}

        {!invite.cancelled_at && (
          <InviteActions
            token={token}
            groupId={id}
            inviteId={invite.id}
            isInviter={isInviter}
            myStatus={invite.myStatus}
            mySeen={invite.mySeen}
            calendar={{
              title: `${title} · ${group.name ?? 'Mission Table'}`,
              date: invite.meeting_date,
              arrive: invite.arrive_time ?? '5:30 PM',
              location: address,
              details: `Mission Table gathering. The group prays at ${group.time}.`,
            }}
            inviterFirst={first}
          />
        )}
      </div>
      <Footer />
    </main>
  );
}
