'use client';

import { useEffect, useRef } from 'react';
import { sameArea, sameChurch, initialsOf } from '@/lib/people';
import type { DirectoryMember } from './loopTypes';
import { fmtDate } from './dates';

type Props = {
  nextDate: string;
  me: DirectoryMember;
  directory: DirectoryMember[];
  onInvite: () => void;
  onClose: () => void;
};

export default function CompanySheet({ nextDate, me, directory, onInvite, onClose }: Props) {
  const near = directory.filter((m) => sameArea(m, me));
  const church = directory.filter((m) => sameChurch(m.church, me.church));
  const faces = [...new Map([...near, ...church].map((m) => [m.id, m])).values()].slice(0, 4);
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButton.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hints = [
    near.length ? `${near.length} ${near.length === 1 ? 'member lives' : 'members live'} near you` : null,
    church.length ? `${church.length} ${church.length === 1 ? 'goes' : 'go'} to your church` : null,
  ].filter(Boolean).join(', ');

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden="true" />
      <section role="dialog" aria-modal="true" aria-labelledby="company-title" className="relative w-full md:max-w-[460px] bg-cream border-t-2 md:border-2 border-black px-6 pt-3 pb-8 md:pb-6 flex flex-col gap-3.5">
        <span aria-hidden="true" className="self-center w-11 h-[5px] rounded-full bg-[#C9C3B5] md:hidden" />
        <p className="flex items-center gap-2 font-inter font-bold text-[13px] text-[#8A3A12]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
          You&apos;re in for {fmtDate(nextDate, { month: 'short', day: 'numeric' })}
        </p>
        <h2 id="company-title" className="font-fraunces font-bold text-[28px] leading-[1.1] tracking-[-0.03em] text-black">Want company this month?</h2>
        <p className="font-inter text-[15px] leading-normal text-[#3A372F]">Invite people from the group to share the meal at your home or a restaurant.</p>
        {hints && (
          <div className="flex items-center gap-3 bg-cream-dark p-3">
            <div className="flex" aria-hidden="true">
              {faces.map((m, i) => (
                <span key={m.id} style={{ marginLeft: i ? -8 : 0 }} className="w-8 h-8 rounded-full border-2 border-cream-dark bg-[#CFC9BC] inline-flex items-center justify-center font-inter text-[10px] font-bold">{initialsOf(m.name)}</span>
              ))}
            </div>
            <span className="font-inter text-[13px] text-black">{hints}</span>
          </div>
        )}
        <button ref={firstButton} type="button" onClick={onInvite} className="min-h-[52px] bg-black text-cream font-inter font-bold text-sm tracking-[0.06em] uppercase">
          Invite people
        </button>
        <button type="button" onClick={onClose} className="min-h-[44px] font-inter font-semibold text-sm text-warm">
          Not this time
        </button>
      </section>
    </div>
  );
}
