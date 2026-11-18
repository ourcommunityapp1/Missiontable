'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { initialsOf } from '@/lib/people';
import type { InviteView } from '@/lib/memberApp';
import { fmtDate } from './dates';

export default function InvitePopup({ invite, token, onLater }: { invite: InviteView; token: string; onLater: () => void }) {
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    link.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onLater(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onLater]);

  const first = invite.inviter.name.split(/\s+/)[0];
  const where = invite.place_type === 'restaurant'
    ? `${invite.place_name ?? 'A restaurant'}${invite.city ? ` · ${invite.city}` : ''}`
    : `${first}'s home${invite.city ? ` · ${invite.city}${invite.state ? `, ${invite.state}` : ''}` : ''}`;
  const coming = invite.guests.filter((g) => g.status === 'accepted').length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/60" onClick={onLater} aria-hidden="true" />
      <section role="dialog" aria-modal="true" aria-labelledby="invite-pop-title" className="relative w-full max-w-[420px] bg-cream border-2 border-black p-6 flex flex-col gap-3.5">
        <p className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-[#8A3A12]">You&apos;re invited</p>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="w-12 h-12 shrink-0 rounded-full border-2 border-black bg-cream-dark inline-flex items-center justify-center font-inter font-bold text-sm">{initialsOf(invite.inviter.name)}</span>
          <h2 id="invite-pop-title" className="font-fraunces font-bold text-[24px] leading-[1.15] tracking-[-0.02em] text-black">{invite.inviter.name} invited you to eat together</h2>
        </div>
        <ul className="flex flex-col gap-2 border-t border-black pt-3.5 font-inter text-[15px] text-black">
          <li>{fmtDate(invite.meeting_date)}{invite.arrive_time ? ` · arrive ${invite.arrive_time}` : ''}</li>
          <li>{where}</li>
          {coming > 0 && <li>{coming} other{coming === 1 ? '' : 's'} from the group {coming === 1 ? 'is' : 'are'} coming</li>}
        </ul>
        <Link ref={link} href={`/group/${invite.group_id}/invites/${invite.id}?token=${token}`} className="min-h-[52px] inline-flex items-center justify-center bg-black text-cream font-inter font-bold text-sm tracking-[0.06em] uppercase">
          View details
        </Link>
        <button type="button" onClick={onLater} className="min-h-[44px] font-inter font-semibold text-sm text-warm">Later</button>
      </section>
    </div>
  );
}
