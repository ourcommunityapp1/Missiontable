'use client';

import { initialsOf } from '@/lib/people';
import { fmtDate } from './dates';

type Props = {
  nextDate: string;
  timeLabel: string;
  myRsvp: 'in' | 'out' | null;
  inCount: number;
  faces: string[];
  onAnswer: (status: 'in' | 'out') => void;
  onInvite: () => void;
};

export default function RsvpCard({ nextDate, timeLabel, myRsvp, inCount, faces, onAnswer, onInvite }: Props) {
  const others = myRsvp === 'in' ? Math.max(0, inCount - 1) : inCount;
  return (
    <section aria-labelledby="rsvp-title" className="border-2 border-black mb-8">
      <div className="bg-black text-cream px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-inter font-semibold text-[11px] tracking-[0.12em] uppercase text-[#CFC9BC]">Next gathering</p>
        <p className="font-inter text-sm text-[#CFC9BC]">{timeLabel} · at your own table</p>
        <p className="w-full font-fraunces font-bold text-[30px] md:text-[36px] leading-none tracking-[-0.03em]">{fmtDate(nextDate, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
      </div>
      <div className="p-5 flex flex-col gap-4">
        <h2 id="rsvp-title" className="font-fraunces font-semibold text-[24px] tracking-[-0.02em] text-black">Are you in?</h2>
        <div role="radiogroup" aria-label="Your answer" className="grid grid-cols-2 gap-2 max-w-[420px]">
          <button
            type="button"
            role="radio"
            aria-checked={myRsvp === 'in'}
            onClick={() => onAnswer('in')}
            className={`min-h-[48px] font-inter font-bold text-sm border-2 border-black inline-flex items-center justify-center gap-1.5 transition-colors ${myRsvp === 'in' ? 'bg-black text-cream' : 'bg-cream text-black hover:bg-cream-dark'}`}
          >
            {myRsvp === 'in' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
            )}
            We&apos;re in
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={myRsvp === 'out'}
            onClick={() => onAnswer('out')}
            className={`min-h-[48px] font-inter font-semibold text-sm border-2 border-black transition-colors ${myRsvp === 'out' ? 'bg-black text-cream' : 'bg-cream text-black hover:bg-cream-dark'}`}
          >
            Not this month
          </button>
        </div>
        {(inCount > 0 || myRsvp === 'in') && (
          <div className="flex items-center gap-3">
            <div className="flex" aria-hidden="true">
              {faces.slice(0, 5).map((n, i) => (
                <span key={`${n}-${i}`} style={{ marginLeft: i ? -8 : 0 }} className="w-8 h-8 rounded-full border-2 border-cream bg-[#CFC9BC] inline-flex items-center justify-center font-inter text-[10px] font-bold text-black">
                  {initialsOf(n)}
                </span>
              ))}
            </div>
            <p className="font-inter text-sm text-[#3A372F]">
              {myRsvp === 'in'
                ? others > 0 ? `You and ${others} other household${others === 1 ? '' : 's'} are in` : 'You’re the first one in'
                : `${inCount} household${inCount === 1 ? ' is' : 's are'} in`}
            </p>
          </div>
        )}
        {myRsvp === 'in' && (
          <button type="button" onClick={onInvite} className="self-start font-inter font-semibold text-sm text-black underline underline-offset-4 hover:text-warm min-h-[44px]">
            Invite people to eat with you →
          </button>
        )}
      </div>
    </section>
  );
}
