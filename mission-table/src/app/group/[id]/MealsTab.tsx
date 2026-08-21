'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { KitRow } from '@/lib/database.types';
import { toggleKitAttendance } from './actions';

export type KitWithMeta = {
  kit: KitRow;
  isPast: boolean;
  attendanceCount: number;
  attendanceMembers: { id: string; name: string }[];
};

type Props = {
  kits: KitWithMeta[];
  showTbdPlaceholder: boolean;
  nextExpectedDateLabel: string | null;
  token: string;
  currentMemberId: string;
  totalMembers: number;
  meetingTimeLabel: string;
};

const TBD_KEY = '__tbd__';

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatMonth(meetingDate: string): string {
  return new Date(meetingDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatFullDate(meetingDate: string): string {
  return new Date(meetingDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function MealsTab({ kits, showTbdPlaceholder, nextExpectedDateLabel, token, currentMemberId, totalMembers, meetingTimeLabel }: Props) {
  // switcher reads oldest -> newest, left to right, like a timeline
  const kitsAsc = [...kits].sort((a, b) => a.kit.meeting_date.localeCompare(b.kit.meeting_date));
  const switcherItems: { key: string; label: string; kit?: KitWithMeta }[] = [
    ...kitsAsc.map(({ kit }) => ({ key: kit.id, label: formatMonth(kit.meeting_date), kit: kits.find((k) => k.kit.id === kit.id) })),
    ...(showTbdPlaceholder ? [{ key: TBD_KEY, label: 'Next Meal' }] : []),
  ];

  const [activeKey, setActiveKey] = useState<string>(() => switcherItems[switcherItems.length - 1]?.key ?? TBD_KEY);
  const [expanded, setExpanded] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, { count: number; members: { id: string; name: string }[] }>>(
    () => Object.fromEntries(kits.map(({ kit, attendanceCount, attendanceMembers }) => [kit.id, { count: attendanceCount, members: attendanceMembers }])),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleGather(kitId: string) {
    setError('');
    setPending(true);
    const result = await toggleKitAttendance(token, kitId);
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setAttendance((prev) => {
      const current = prev[kitId] ?? { count: 0, members: [] };
      const members = result.active
        ? [...current.members, { id: currentMemberId, name: 'You' }]
        : current.members.filter((m) => m.id !== currentMemberId);
      return { ...prev, [kitId]: { count: result.count, members } };
    });
  }

  if (switcherItems.length === 0) {
    return <p className="font-inter text-base text-warm">No meals yet.</p>;
  }

  const active = switcherItems.find((s) => s.key === activeKey) ?? switcherItems[switcherItems.length - 1];
  const isTbd = active.key === TBD_KEY;
  const kitMeta = active.kit;
  const kit = kitMeta?.kit;
  const att = kit ? (attendance[kit.id] ?? { count: 0, members: [] }) : { count: 0, members: [] };
  const iGathered = att.members.some((m) => m.id === currentMemberId);
  const shownAvatars = att.members.slice(0, 6);
  const isPast = kitMeta?.isPast ?? false;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto">
        {switcherItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => { setActiveKey(item.key); setExpanded(false); }}
            className={`flex-none inline-flex items-center gap-1.5 border-2 border-black px-3.5 py-2 font-inter text-xs font-semibold transition-colors whitespace-nowrap ${
              item.key === activeKey ? 'bg-black text-cream' : 'bg-cream text-black hover:bg-cream-dark'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-none"
              style={{ background: item.key === activeKey ? '#7DBF8A' : 'var(--muted, #858383)' }}
            />
            {item.label}
          </button>
        ))}
      </div>

      <div className="border-2 border-black bg-cream">
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black bg-black text-cream flex-wrap gap-1">
          <span className="font-fraunces font-semibold text-base fraunces-32">{active.label}</span>
          <span className="font-inter text-xs text-cream/70">{isTbd ? 'Not sent yet' : kit ? formatFullDate(kit.meeting_date) : ''}</span>
        </div>

        {isTbd || !kit ? (
          <div className="p-10 flex flex-col items-center text-center gap-2.5">
            <div className="w-10 h-10 rounded-full border border-dashed border-muted flex items-center justify-center mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4.5 h-4.5 text-warm">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
            <p className="font-fraunces font-semibold text-xl fraunces-32 text-black">Next Meal — TBD</p>
            <p className="font-inter text-sm text-warm max-w-[380px]">
              Your host hasn&apos;t sent this month&apos;s meal yet.
              {nextExpectedDateLabel
                ? ` It's usually sent a few days before the next gathering (${nextExpectedDateLabel}).`
                : ' Check back soon.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2">
              <div className="relative min-h-[220px] border-b-2 md:border-b-0 md:border-r-2 border-black">
                {kit.photo_url ? (
                  <>
                    <Image src={kit.photo_url} alt={kit.recipe_name ?? 'Meal photo'} fill unoptimized className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    {kit.recipe_name && (
                      <div className="absolute left-0 right-0 bottom-0 p-4">
                        <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-cream/75 mb-1">Recipe</p>
                        <p className="font-fraunces font-semibold text-lg fraunces-32 text-cream">{kit.recipe_name}</p>
                        {kit.side_dish && <p className="font-inter text-xs text-cream/75 mt-0.5">Side dish: {kit.side_dish}</p>}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 h-full flex flex-col justify-end bg-cream-dark">
                    <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Recipe</p>
                    <p className="font-fraunces font-semibold text-lg fraunces-32 text-black">{kit.recipe_name ?? 'Not added'}</p>
                    {kit.side_dish && <p className="font-inter text-xs text-warm mt-0.5">Side dish: {kit.side_dish}</p>}
                  </div>
                )}
              </div>

              {isPast ? (
                <div className="p-5 flex flex-col justify-between gap-4">
                  <div>
                    <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Gathered This Month</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-fraunces font-bold text-[46px] leading-none fraunces-48 text-black" style={{ fontVariantNumeric: 'tabular-nums' }}>{att.count}</span>
                      <span className="font-inter text-sm text-warm">of {totalMembers}</span>
                    </div>
                    {shownAvatars.length > 0 && (
                      <div className="flex items-center mt-3">
                        {shownAvatars.map((m, i) => (
                          <div
                            key={m.id}
                            style={{ marginLeft: i === 0 ? 0 : -8 }}
                            className="w-7 h-7 rounded-full border-2 border-cream bg-cream-dark flex items-center justify-center font-fraunces text-[10px] text-black"
                          >
                            {initials(m.name)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleGather(kit.id)}
                    className={`font-inter font-semibold text-xs tracking-[0.05em] uppercase px-4 py-2.5 border-2 border-black transition-colors disabled:opacity-50 ${
                      iGathered ? 'bg-black text-cream' : 'bg-cream text-black hover:bg-black hover:text-cream'
                    }`}
                  >
                    {iGathered ? "You're Marked as Gathered" : 'Mark as Gathered'}
                  </button>
                </div>
              ) : (
                <div className="p-5 flex flex-col justify-between gap-4">
                  <div>
                    <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Gathering</p>
                    <p className="font-fraunces font-bold text-2xl leading-tight fraunces-32 text-black">{formatFullDate(kit.meeting_date)}</p>
                    <p className="font-inter text-sm text-warm mt-1">{meetingTimeLabel}</p>
                  </div>
                  <p className="font-inter text-xs text-warm border-t border-black/20 pt-3">Attendance opens once the gathering has happened.</p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t-2 border-black flex items-center justify-between gap-3 flex-wrap">
              <span className="font-inter text-xs text-warm">
                {isPast ? 'Recipe, scripture, commentary & prayer requests' : 'Recipe already set — scripture, commentary & prayer requests too'}
              </span>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-2 border-black px-4 py-2 hover:bg-black hover:text-cream transition-colors"
              >
                {expanded ? 'Hide Full Meal' : 'View Full Meal'} →
              </button>
            </div>

            {expanded && (
              <div className="p-5 border-t-2 border-black flex flex-col gap-4">
                {kit.recipe_url && (
                  <a href={kit.recipe_url} target="_blank" rel="noopener noreferrer" className="font-inter text-sm font-semibold text-black border-b border-black self-start">
                    View Recipe ↗
                  </a>
                )}
                {kit.scripture_text && (
                  <div>
                    <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Scripture</p>
                    <blockquote className="border-l-2 border-black pl-3 font-inter text-sm text-warm italic leading-[1.6]">
                      {kit.scripture_text}
                    </blockquote>
                    {kit.scripture_reference && <p className="font-inter text-xs text-warm mt-1">— {kit.scripture_reference}</p>}
                  </div>
                )}
                {kit.commentary && (
                  <div>
                    <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Commentary</p>
                    <p className="font-inter text-sm text-warm whitespace-pre-line leading-[1.6]">{kit.commentary}</p>
                  </div>
                )}
                {kit.prayer_requests && (
                  <div>
                    <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Prayer Requests</p>
                    <p className="font-inter text-sm text-warm whitespace-pre-line leading-[1.6]">{kit.prayer_requests}</p>
                  </div>
                )}
                {kit.gathering_prompt && (
                  <div>
                    <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Gathering Prompt</p>
                    <p className="font-inter text-sm text-warm italic leading-[1.6]">{kit.gathering_prompt}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {error && <p className="font-inter text-sm border-2 border-black px-4 py-3 bg-white">{error}</p>}
    </div>
  );
}
