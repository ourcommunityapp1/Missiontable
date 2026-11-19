'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ChatPanel from '@/components/ChatPanel';
import type { FieldPostWithEngagement } from '@/lib/queries';
import type { InviteView } from '@/lib/memberApp';
import FieldPostCard from './FieldPostCard';
import { buildFeed, namesLine, type FeedItem } from './feed';
import { respondToInvite } from './loopActions';
import type { GroupInfo, KitWithMeta, MemberLoopData } from './loopTypes';
import { fmtDate } from './dates';
import { daysBetween } from './phase';

type Props = {
  token: string;
  loop: MemberLoopData;
  info: GroupInfo;
  kits: KitWithMeta[];
  fieldPosts: FieldPostWithEngagement[];
  myRsvp: 'in' | 'out' | null;
  inCount: number;
  onAnswer: (status: 'in' | 'out') => void;
  onOpenMonth: () => void;
};

const FEED_WINDOW_DAYS = 60;


const label = 'font-inter font-bold text-[10px] tracking-[0.12em] uppercase';

function PinnedGathering({ loop, myRsvp, inCount, onAnswer }: Pick<Props, 'loop' | 'myRsvp' | 'inCount' | 'onAnswer'>) {
  const [changing, setChanging] = useState(false);
  if (!loop.nextDate) return null;
  const date = fmtDate(loop.nextDate, { weekday: 'short', month: 'short', day: 'numeric' });
  const days = daysBetween(loop.today, loop.nextDate);
  const asking = myRsvp === null || changing;
  const others = myRsvp === 'in' ? Math.max(0, inCount - 1) : inCount;
  const answer = (s: 'in' | 'out') => { setChanging(false); onAnswer(s); };

  return (
    <section aria-label="Next gathering" className="border-2 border-black bg-dark text-cream p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className={`${label} text-[#CFC9BC]`}>Pinned · Next gathering</p>
        <p className="font-inter text-xs text-[#CFC9BC]">{days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}</p>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="font-fraunces font-bold text-[26px] leading-[1.05] tracking-[-0.02em]">
          {date}{asking ? ' · Are you in?' : ''}
        </h2>
        <p className="font-inter text-[13px] text-[#CFC9BC]">{loop.timeLabel} · at your own table</p>
      </div>
      {asking ? (
        <div role="group" aria-label="Your answer" className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => answer('in')} className="min-h-[46px] bg-cream text-black border-2 border-cream font-inter font-bold text-[13px]">
            We’re in
          </button>
          <button type="button" onClick={() => answer('out')} className="min-h-[46px] border-2 border-cream text-cream font-inter font-semibold text-[13px]">
            Not this month
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 border-t border-[#4A4740] pt-3">
          <p className="font-inter font-bold text-[15px] flex items-center gap-2">
            {myRsvp === 'in' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>}
            {myRsvp === 'in' ? 'You’re in' : 'Not this month'}
          </p>
          <button type="button" onClick={() => setChanging(true)} className="min-h-[40px] px-3 border-2 border-cream font-inter text-xs font-semibold">
            Change
          </button>
        </div>
      )}
      <p className="font-inter text-xs text-[#CFC9BC]">
        {myRsvp === 'in'
          ? others > 0 ? `You and ${others} other${others === 1 ? '' : 's'} are in` : 'You’re the first one in'
          : inCount > 0 ? `${inCount} ${inCount === 1 ? 'person is' : 'people are'} in so far` : 'Be the first to say you’re in'}
      </p>
    </section>
  );
}

function whereOf(i: InviteView): string {
  const first = i.inviter.name.split(/\s+/)[0];
  return i.place_type === 'restaurant' ? `${i.place_name ?? 'a restaurant'}${i.city ? ` in ${i.city}` : ''}` : `${first}’s home${i.city ? ` in ${i.city}` : ''}`;
}

const FOOD: Record<string, string> = { cook: 'they’re cooking', potluck: 'potluck', order: 'ordering in' };

function InviteCard({ invite, token, groupId }: { invite: InviteView; token: string; groupId: string }) {
  const [status, setStatus] = useState(invite.myStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const going = invite.guests.filter((g) => g.status === 'accepted').length;

  async function respond(s: 'accepted' | 'declined') {
    setBusy(true);
    setError('');
    const res = await respondToInvite(token, groupId, invite.id, s);
    setBusy(false);
    if (!res.success) return setError(res.error);
    setStatus(s);
  }

  const details = `/group/${groupId}/invites/${invite.id}?token=${token}`;
  return (
    <article aria-label={`Invitation from ${invite.inviter.name}`} className="border-2 border-black bg-cream p-3.5 flex flex-col gap-2.5">
      <p className={`${label} ${status === 'invited' ? 'text-[#8A3A12]' : 'text-warm'}`}>
        {status === 'invited' ? 'You’re invited' : status === 'accepted' ? 'You’re going' : 'You declined'} · {fmtDate(invite.meeting_date, { month: 'short', day: 'numeric' })}
      </p>
      <h3 className="font-fraunces font-semibold text-[20px] leading-[1.15] text-black">
        Dinner at {whereOf(invite)}
      </h3>
      <p className="font-inter text-[13px] text-[#3A372F]">
        {[invite.arrive_time ? `Arrive ${invite.arrive_time}` : null, invite.food ? FOOD[invite.food] : null, `${going} going`].filter(Boolean).join(' · ')}
      </p>
      {status === 'invited' ? (
        <div className="grid grid-cols-3 gap-2">
          <button type="button" disabled={busy} onClick={() => void respond('accepted')} className="min-h-[44px] bg-black text-cream border-2 border-black font-inter text-xs font-bold disabled:opacity-60">Accept</button>
          <button type="button" disabled={busy} onClick={() => void respond('declined')} className="min-h-[44px] border-2 border-black font-inter text-xs font-semibold disabled:opacity-60">Decline</button>
          <Link href={details} className="min-h-[44px] border-2 border-black font-inter text-xs font-semibold inline-flex items-center justify-center">Details</Link>
        </div>
      ) : (
        <Link href={details} className="self-start min-h-[36px] inline-flex items-center font-inter text-[13px] font-semibold underline underline-offset-4">
          Address and details →
        </Link>
      )}
      {error && <p role="alert" className="font-inter text-sm text-[#8A3A12]">{error}</p>}
    </article>
  );
}

function monthOf(date: string): string {
  return fmtDate(date, { month: 'long' });
}

export default function HomeTab(props: Props) {
  const { token, loop, info, kits, fieldPosts, onOpenMonth } = props;
  const hostFirst = info.hostName.split(/\s+/)[0] || 'Your host';

  const items = useMemo<FeedItem[]>(() => {
    const names = new Map([...loop.directory, loop.me].map((m) => [m.id, m.name]));
    return buildFeed({
      now: new Date(),
      windowDays: FEED_WINDOW_DAYS,
      meId: loop.me.id,
      nextDate: loop.nextDate,
      fieldPosts,
      kits: kits.map((k) => k.kit),
      inTimes: loop.inTimes,
      names,
      tablePosts: loop.tablePosts,
      received: loop.received,
    });
  }, [loop, kits, fieldPosts]);

  const nodes = items.map((item) => ({ id: item.id, at: item.at, node: renderItem(item) })).filter((n) => n.node !== null);

  function renderItem(item: FeedItem): React.ReactNode {
    switch (item.kind) {
      case 'field': {
        const post = fieldPosts.find((p) => p.id === item.postId);
        return post ? <FieldPostCard post={post} token={token} currentMemberId={loop.me.id} countryName={info.countryName} /> : null;
      }
      case 'meal': {
        const kit = kits.find((k) => k.kit.id === item.kitId)?.kit;
        if (!kit) return null;
        const prayers = (kit.prayer_requests ?? '').split('\n').filter((l) => l.trim()).length;
        const meta = [kit.scripture_reference, prayers ? `${prayers} prayer request${prayers === 1 ? '' : 's'}` : null].filter(Boolean).join(' · ');
        return (
          <article aria-label={`${monthOf(kit.meeting_date)} meal`} className="border-2 border-black bg-cream-dark p-3.5 flex flex-col gap-2">
            <p className={`${label} text-warm`}>{hostFirst} sent {monthOf(kit.meeting_date)}’s meal</p>
            <h3 className="font-fraunces font-bold text-[22px] leading-[1.1] text-black">{kit.recipe_name ?? `${monthOf(kit.meeting_date)}’s meal`}</h3>
            {meta && <p className="font-inter text-[13px] text-[#3A372F]">{meta}</p>}
            <button type="button" onClick={onOpenMonth} className="self-start mt-1 min-h-[40px] px-3.5 bg-black text-cream font-inter text-xs font-bold tracking-[0.06em] uppercase">
              Open the meal →
            </button>
          </article>
        );
      }
      case 'rsvps':
        return (
          <p className="flex items-center gap-2.5 font-inter text-[13px] text-[#3A372F]">
            <span aria-hidden="true" className="w-7 h-7 flex-none rounded-full border-2 border-black flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.6"><path d="M5 12l5 5L20 7" /></svg>
            </span>
            <span><strong className="text-black">{namesLine(item.names, item.total)}</strong> {item.total === 1 ? 'is' : 'are'} in for {fmtDate(item.date, { month: 'short', day: 'numeric' })}</span>
          </p>
        );
      case 'table': {
        const t = loop.tablePosts.find((p) => p.id === item.postId);
        if (!t) return null;
        return (
          <article aria-label={`${t.memberName}'s table`} className="border-2 border-black bg-cream flex flex-col">
            <p className="px-3.5 pt-3 pb-2 font-inter text-[13px] text-[#3A372F]">
              <strong className="text-black">{t.memberId === loop.me.id ? 'You' : t.memberName}</strong> shared {t.memberId === loop.me.id ? 'your' : 'their'} table from {fmtDate(t.meetingDate, { month: 'short', day: 'numeric' })}
            </p>
            {t.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.photoUrl} alt={`${t.memberName}'s table`} loading="lazy" className="w-full max-h-[360px] object-cover" />
            )}
            {t.prayer && <p className="px-3.5 py-3 font-fraunces text-[17px] leading-snug text-black">“{t.prayer}”</p>}
          </article>
        );
      }
      case 'invite': {
        const invite = loop.received.find((i) => i.id === item.inviteId);
        return invite ? <InviteCard invite={invite} token={token} groupId={loop.groupId} /> : null;
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PinnedGathering loop={loop} myRsvp={props.myRsvp} inCount={props.inCount} onAnswer={props.onAnswer} />
      {info.chatEnabled ? (
        <ChatPanel
          groupId={loop.groupId}
          token={token}
          as="member"
          feed={nodes}
          scrollToEndOnLoad={false}
          prompts={[
            'Hi everyone! Looking forward to gathering this month.',
            `Praying for ${info.countryName} this week. Any requests?`,
            'Who’s cooking what this month?',
          ]}
        />
      ) : nodes.length > 0 ? (
        <div className="flex flex-col gap-4">{nodes.map((n) => <div key={n.id}>{n.node}</div>)}</div>
      ) : (
        <p className="font-inter text-sm text-warm">News from the field, meals and photos from your group will show up here.</p>
      )}
    </div>
  );
}
