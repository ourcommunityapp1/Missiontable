'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { InviteView } from '@/lib/memberApp';
import InviteFlow from './InviteFlow';
import InstallCard from './InstallCard';
import MealCard from './MealCard';
import { ShareTable, TablePhotos } from './TableShare';
import { toggleKitAttendance } from './actions';
import type { GroupInfo, KitWithMeta, MemberLoopData } from './loopTypes';
import { fmtDate } from './dates';
import { phaseOf, type Phase } from './phase';

type Props = {
  token: string;
  loop: MemberLoopData;
  info: GroupInfo;
  kits: KitWithMeta[];
  myRsvp: 'in' | 'out' | null;
  inCount: number;
  onAnswer: (status: 'in' | 'out') => void;
  inviteFlowOpen: boolean;
  setInviteFlowOpen: (open: boolean) => void;
};

const label = 'font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-black';
const short = (d: string) => fmtDate(d, { month: 'short', day: 'numeric' });

function Steps({ phase, date }: { phase: Phase; date: string | null }) {
  const steps: { key: Phase; text: string }[] = [
    { key: 'before', text: 'Before' },
    { key: 'day', text: date ? short(date) : 'The day' },
    { key: 'after', text: 'After' },
  ];
  const at = steps.findIndex((s) => s.key === phase);
  return (
    <ol aria-label="Where we are this month" className="list-none m-0 p-0 grid grid-cols-3 gap-1.5">
      {steps.map((s, i) => (
        <li key={s.key} aria-current={i === at ? 'step' : undefined} className="flex flex-col gap-1.5">
          <span className={`h-1 ${i <= at ? 'bg-black' : 'bg-[#D9D5CC]'}`} />
          <span className={`font-inter text-[10px] tracking-[0.1em] uppercase ${i === at ? 'font-bold text-black' : 'font-semibold text-warm'}`}>{s.text}</span>
        </li>
      ))}
    </ol>
  );
}

function Gathering({ loop, myRsvp, inCount, onAnswer, title }: Pick<Props, 'loop' | 'myRsvp' | 'inCount' | 'onAnswer'> & { title: string }) {
  const [changing, setChanging] = useState(false);
  const [showWho, setShowWho] = useState(false);
  if (!loop.nextDate) return null;
  const asking = myRsvp === null || changing;
  const outCount = loop.outCount - (loop.myRsvp === 'out' ? 1 : 0) + (myRsvp === 'out' ? 1 : 0);
  const total = loop.directory.length + 1;
  const quiet = Math.max(0, total - inCount - outCount);
  const inNames = [
    ...(myRsvp === 'in' ? ['You'] : []),
    ...loop.inMembers.filter((m) => m.id !== loop.me.id).map((m) => m.name),
  ];
  const answer = (s: 'in' | 'out') => { setChanging(false); onAnswer(s); };

  return (
    <section aria-label={title} className="border-2 border-black flex flex-col">
      <div className="bg-dark text-cream px-4 py-4 flex flex-col gap-1">
        <p className="font-inter font-semibold text-[10px] tracking-[0.12em] uppercase text-[#CFC9BC]">{title}</p>
        <p className="font-fraunces font-bold text-[32px] leading-none tracking-[-0.02em]">{fmtDate(loop.nextDate, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
        <p className="font-inter text-[13px] text-[#CFC9BC]">{loop.timeLabel} · everyone prays at the same time</p>
      </div>
      {asking ? (
        <div className="px-4 py-3.5 flex flex-col gap-2.5 border-b border-black">
          <p className="font-fraunces font-semibold text-[20px] text-black">Are you in?</p>
          <div role="group" aria-label="Your answer" className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => answer('in')} className="min-h-[46px] bg-black text-cream font-inter font-bold text-[13px]">We’re in</button>
            <button type="button" onClick={() => answer('out')} className="min-h-[46px] border-2 border-black font-inter font-semibold text-[13px]">Not this month</button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3.5 flex items-center justify-between gap-3 border-b border-black">
          <p className="font-inter font-bold text-[15px] flex items-center gap-2 text-black">
            {myRsvp === 'in' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>}
            {myRsvp === 'in' ? 'You’re in' : 'Not this month'}
          </p>
          <button type="button" onClick={() => setChanging(true)} className="min-h-[40px] px-3 border-2 border-black font-inter text-xs font-semibold">Change</button>
        </div>
      )}
      <button
        type="button"
        aria-expanded={showWho}
        onClick={() => setShowWho((v) => !v)}
        className="px-4 min-h-[48px] flex items-center justify-between gap-3 text-left"
      >
        <span className="font-inter text-[13px] text-[#3A372F]">
          <strong className="text-black">{inCount} in</strong> · {outCount} not this month · {quiet} haven’t said
        </span>
        <span className="font-inter text-[13px] font-semibold text-black flex-none">{showWho ? 'Hide' : 'Who →'}</span>
      </button>
      {showWho && (
        <p className="px-4 pb-3.5 font-inter text-[13px] leading-relaxed text-[#3A372F]">
          {inNames.length ? inNames.join(', ') : 'Nobody has said they’re in yet.'}
        </p>
      )}
    </section>
  );
}

function whereOf(i: InviteView, mine: boolean): string {
  if (i.place_type === 'restaurant') return `Dinner at ${i.place_name ?? 'a restaurant'}`;
  return mine ? 'Dinner at your home' : `Dinner at ${i.inviter.name.split(/\s+/)[0]}’s home`;
}

function Plans({ token, loop, onStartInvite }: { token: string; loop: MemberLoopData; onStartInvite: () => void }) {
  if (!loop.nextDate) return null;
  const date = loop.nextDate;
  const href = (i: InviteView) => `/group/${loop.groupId}/invites/${i.id}?token=${token}`;
  const mine = loop.sent.find((i) => i.meeting_date === date && !i.cancelled_at);
  const received = loop.received.filter((i) => i.meeting_date === date && i.myStatus !== 'declined');

  const card = (i: InviteView, isMine: boolean) => {
    const going = i.guests.filter((g) => g.status === 'accepted').length;
    const waiting = i.guests.filter((g) => g.status === 'invited').length;
    const pending = !isMine && i.myStatus === 'invited';
    return (
      <Link key={i.id} href={href(i)} className={`border-2 border-black p-3.5 flex flex-col gap-1 ${pending ? 'bg-cream-dark' : 'bg-cream'}`}>
        {pending && <span className="font-inter font-bold text-[10px] tracking-[0.12em] uppercase text-[#8A3A12]">{i.inviter.name} invited you · answer</span>}
        <span className="font-fraunces font-semibold text-[19px] text-black">{whereOf(i, isMine)}</span>
        <span className="font-inter text-[13px] text-[#3A372F]">
          {[i.city, i.arrive_time ? `arrive ${i.arrive_time}` : null, isMine ? `${going} going · ${waiting} not answered` : `${going} going`].filter(Boolean).join(' · ')}
        </span>
        <span className="font-inter text-[13px] font-semibold text-black mt-0.5">Address and details →</span>
      </Link>
    );
  };

  return (
    <section aria-labelledby="plans-title" className="flex flex-col gap-2">
      <h2 id="plans-title" className={label}>Your plans for {short(date)}</h2>
      {mine && card(mine, true)}
      {received.map((i) => card(i, false))}
      {mine ? (
        <Link href={href(mine)} className="min-h-[44px] border-2 border-dashed border-black font-inter text-[13px] font-semibold inline-flex items-center justify-center">
          Invite more people
        </Link>
      ) : (
        <button type="button" onClick={onStartInvite} className="min-h-[48px] border-2 border-dashed border-black font-inter text-[13px] font-semibold">
          Host or invite people to eat with you
        </button>
      )}
    </section>
  );
}

function PastMeals({ token, loop, kits }: { token: string; loop: MemberLoopData; kits: KitWithMeta[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
    () => Object.fromEntries(kits.map((k) => [k.kit.id, k.attendanceMembers.some((m) => m.id === loop.me.id)])),
  );
  const [error, setError] = useState('');
  if (kits.length === 0) return null;

  async function toggleGathered(kitId: string) {
    setError('');
    const res = await toggleKitAttendance(token, kitId);
    if (!res.success) return setError(res.error);
    setAttendance((a) => ({ ...a, [kitId]: res.active }));
  }

  return (
    <section aria-labelledby="past-title" className="flex flex-col">
      <h2 id="past-title" className={`${label} mb-1.5`}>Past meals</h2>
      {kits.map(({ kit }, i) => {
        const photos = loop.tablePosts.filter((p) => p.meetingDate === kit.meeting_date).length;
        const isOpen = open === kit.id;
        const month = fmtDate(kit.meeting_date, { month: 'long' });
        return (
          <div key={kit.id} className={`border-t border-black ${i === kits.length - 1 ? 'border-b' : ''}`}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : kit.id)}
              className="w-full min-h-[54px] flex items-center justify-between gap-3 text-left"
            >
              <span className="font-inter text-[14px] text-black min-w-0 truncate"><strong>{month}</strong>{kit.recipe_name ? ` · ${kit.recipe_name}` : ''}</span>
              <span className="font-inter text-xs text-warm flex-none">
                {[attendance[kit.id] ? 'You gathered' : null, photos ? `${photos} photo${photos === 1 ? '' : 's'}` : null].filter(Boolean).join(' · ') || (isOpen ? 'Hide' : 'Open')}
              </span>
            </button>
            {isOpen && (
              <div className="pb-4 flex flex-col gap-3">
                <MealCard kit={kit} heading={`${month}’s meal`} />
                <button
                  type="button"
                  aria-pressed={attendance[kit.id]}
                  onClick={() => void toggleGathered(kit.id)}
                  className={`self-start min-h-[44px] px-4 border-2 border-black font-inter text-xs font-bold tracking-[0.05em] uppercase ${attendance[kit.id] ? 'bg-black text-cream' : 'bg-cream text-black'}`}
                >
                  {attendance[kit.id] ? 'You gathered ✓' : 'We gathered'}
                </button>
                <TablePhotos posts={loop.tablePosts} date={kit.meeting_date} />
              </div>
            )}
          </div>
        );
      })}
      {error && <p role="alert" className="font-inter text-sm text-[#8A3A12] mt-2">{error}</p>}
    </section>
  );
}

export default function MonthTab(props: Props) {
  const { token, loop, info, kits, inviteFlowOpen, setInviteFlowOpen } = props;
  const phase = phaseOf(loop);
  const hostFirst = info.hostName.split(/\s+/)[0] || 'Your host';

  if (inviteFlowOpen && loop.nextDate) return <InviteFlow token={token} loop={loop} onClose={() => setInviteFlowOpen(false)} />;

  const current = loop.nextDate ? kits.find((k) => k.kit.meeting_date === loop.nextDate) : undefined;
  const past = kits
    .filter((k) => k.kit.id !== current?.kit.id && (!loop.nextDate || k.kit.meeting_date < loop.nextDate))
    .sort((a, b) => b.kit.meeting_date.localeCompare(a.kit.meeting_date));
  const nextMonth = loop.nextDate ? fmtDate(loop.nextDate, { month: 'long' }) : null;

  const gathering = (
    <Gathering
      loop={loop}
      myRsvp={props.myRsvp}
      inCount={props.inCount}
      onAnswer={props.onAnswer}
      title={phase === 'day' ? 'Today' : phase === 'after' ? 'Up next' : 'Next gathering'}
    />
  );

  const meal = loop.nextDate && (current ? (
    <MealCard kit={current.kit} heading={`${nextMonth}’s meal · sent`} />
  ) : (
    <section className="border-2 border-dashed border-black p-4 flex flex-col gap-1">
      <p className="font-fraunces font-semibold text-[19px] text-black">{nextMonth}’s meal isn’t here yet</p>
      <p className="font-inter text-[13px] leading-normal text-[#3A372F]">{hostFirst} usually sends the recipe, scripture and prayer requests a few days before the gathering.</p>
    </section>
  ));

  return (
    <div className="flex flex-col gap-6">
      <Steps phase={phase} date={phase === 'after' ? loop.tableDate : loop.nextDate} />

      {phase === 'after' ? (
        <>
          <ShareTable token={token} loop={loop} />
          {loop.tableDate && <TablePhotos posts={loop.tablePosts} date={loop.tableDate} />}
          {gathering}
        </>
      ) : phase === 'day' ? (
        <>
          {gathering}
          {meal}
          <Plans token={token} loop={loop} onStartInvite={() => setInviteFlowOpen(true)} />
          <ShareTable token={token} loop={loop} />
        </>
      ) : (
        <>
          {gathering}
          <Plans token={token} loop={loop} onStartInvite={() => setInviteFlowOpen(true)} />
          {meal}
        </>
      )}

      <PastMeals token={token} loop={loop} kits={past} />
      <InstallCard groupName={info.name} />
    </div>
  );
}
