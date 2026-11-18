'use client';

import Link from 'next/link';
import { useState } from 'react';
import InviteFlow from './InviteFlow';
import type { MemberLoopData } from './loopTypes';
import type { InviteView } from '@/lib/memberApp';
import { fmtDate } from './dates';

const STATUS_LABEL: Record<string, string> = { invited: 'Waiting for your answer', accepted: 'You’re going', declined: 'You declined' };

function whereOf(i: InviteView) {
  const first = i.inviter.name.split(/\s+/)[0];
  return i.place_type === 'restaurant'
    ? `${i.place_name ?? 'A restaurant'}${i.city ? `, ${i.city}` : ''}`
    : `${first}'s home${i.city ? ` in ${i.city}` : ''}`;
}

export default function TogetherTab({
  token, loop, startInvite, onFlowClosed,
}: { token: string; loop: MemberLoopData; startInvite: boolean; onFlowClosed: () => void }) {
  const activeSent = loop.sent.filter((i) => !i.cancelled_at);
  const mineForNext = activeSent.find((i) => i.meeting_date === loop.nextDate);
  // One invitation per gathering: if there is one, show it instead of starting another.
  const [flow, setFlow] = useState(startInvite && !mineForNext);
  const close = () => { setFlow(false); onFlowClosed(); };

  if (flow && loop.nextDate) return <InviteFlow token={token} loop={loop} onClose={close} />;

  const href = (i: InviteView) => `/group/${loop.groupId}/invites/${i.id}?token=${token}`;

  return (
    <div className="flex flex-col gap-10 max-w-[620px]">
      {loop.received.length > 0 && (
        <section aria-labelledby="received-title" className="flex flex-col gap-3">
          <h2 id="received-title" className="font-inter font-bold text-xs tracking-[0.12em] uppercase text-black">Invitations for you</h2>
          {loop.received.map((i) => (
            <Link key={i.id} href={href(i)} className={`border-2 p-4 flex items-center justify-between gap-4 ${i.myStatus === 'invited' ? 'border-black bg-cream-dark' : 'border-[#C9C3B5]'}`}>
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="font-inter text-[15px] font-semibold text-black">{i.inviter.name} invited you</span>
                <span className="font-inter text-[13px] text-warm truncate">{fmtDate(i.meeting_date)} · {whereOf(i)}</span>
                <span className={`font-inter text-xs font-semibold ${i.myStatus === 'invited' ? 'text-[#8A3A12]' : 'text-warm'}`}>{STATUS_LABEL[i.myStatus ?? 'invited']}</span>
              </span>
              <span aria-hidden="true" className="font-inter text-xl">→</span>
            </Link>
          ))}
        </section>
      )}

      <section aria-labelledby="together-title" className="flex flex-col gap-3">
        <h2 id="together-title" className="font-fraunces font-bold text-[28px] leading-tight tracking-[-0.02em] text-black">Eat together</h2>
        <p className="font-inter text-[15px] leading-relaxed text-[#3A372F]">
          Everyone in the group gathers on the same night. Invite people from the group to share the meal at your home or a restaurant.
        </p>
        {loop.nextDate && mineForNext ? (
          <Link href={href(mineForNext)} className="self-start min-h-[52px] inline-flex items-center border-2 border-black font-inter font-bold text-sm tracking-[0.06em] uppercase px-6">
            See your invitation · invite more people
          </Link>
        ) : loop.nextDate ? (
          <button type="button" onClick={() => setFlow(true)} className="self-start min-h-[52px] bg-black text-cream font-inter font-bold text-sm tracking-[0.06em] uppercase px-6">
            Invite people to the {fmtDate(loop.nextDate, { month: 'short', day: 'numeric' })} meal
          </button>
        ) : (
          <p className="font-inter text-sm text-warm">Invitations open once the next gathering is scheduled.</p>
        )}
      </section>

      {activeSent.length > 0 && (
        <section aria-labelledby="sent-title" className="flex flex-col gap-3">
          <h2 id="sent-title" className="font-inter font-bold text-xs tracking-[0.12em] uppercase text-black">Your invitations</h2>
          {activeSent.map((i) => {
            const coming = i.guests.filter((g) => g.status === 'accepted').length;
            const waiting = i.guests.filter((g) => g.status === 'invited').length;
            return (
              <Link key={i.id} href={href(i)} className="border-2 border-black p-4 flex items-center justify-between gap-4">
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-inter text-[15px] font-semibold text-black">{fmtDate(i.meeting_date)} · {i.place_type === 'restaurant' ? i.place_name : 'Your home'}</span>
                  <span className="font-inter text-[13px] text-warm">{coming} coming · {waiting} not answered yet · {i.guests.length} invited</span>
                </span>
                <span aria-hidden="true" className="font-inter text-xl">→</span>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
