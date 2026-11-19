'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { initialsOf, placeLabel, sameArea, sameChurch } from '@/lib/people';
import { outsideChatLabel } from '@/lib/chatTypes';
import type { DirectoryMember, GroupInfo } from './loopTypes';
import { fmtDate } from './dates';

type Filter = 'all' | 'church' | 'near';

/** Everyone in the group, plus the group's details. Opens from the faces in the header. */
export default function MembersSheet({ info, me, directory, onInviteFriend, onClose }: {
  info: GroupInfo;
  me: DirectoryMember;
  directory: DirectoryMember[];
  onInviteFriend: () => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const church = directory.filter((m) => sameChurch(m.church, me.church));
  const near = directory.filter((m) => sameArea(m, me));
  const shown = useMemo(() => {
    const list = filter === 'church' ? church : filter === 'near' ? near : directory;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [filter, church, near, directory]);

  const facts: { k: string; v: string }[] = [
    { k: 'When', v: `${info.rhythm} · ${info.time}` },
    { k: 'Where', v: info.isVirtual ? 'Each at your own table' : info.place ?? 'In person' },
    { k: 'Hosted by', v: info.hostName },
    { k: 'Since', v: fmtDate(info.startDate, { month: 'long', year: 'numeric' }) },
  ];
  const chips: { key: Filter; text: string }[] = [
    { key: 'all', text: `All ${directory.length + 1}` },
    { key: 'church', text: `Your church · ${church.length}` },
    { key: 'near', text: `Near you · ${near.length}` },
  ];

  const row = (m: DirectoryMember, isMe: boolean) => (
    <li key={m.id} className="flex items-center gap-3 py-3 border-t border-black">
      <span aria-hidden="true" className={`w-[38px] h-[38px] rounded-full border-2 border-black flex-none flex items-center justify-center font-fraunces text-[13px] ${isMe ? 'bg-black text-cream' : 'bg-cream-dark text-black'}`}>
        {initialsOf(m.name)}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="font-inter text-[14px] font-bold text-black truncate">{isMe ? `${m.name} (you)` : m.name}</span>
        {(placeLabel(m.city, m.state) || m.church) && (
          <span className="font-inter text-xs text-warm truncate">{[placeLabel(m.city, m.state), m.church].filter(Boolean).join(' · ')}</span>
        )}
      </span>
    </li>
  );

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="members-title" className="fixed inset-0 z-40 bg-cream overflow-y-auto overscroll-contain">
      <div className="max-w-[680px] mx-auto">
        <header className="sticky top-0 bg-cream flex items-center justify-between gap-3 px-4 py-3.5 border-b-2 border-black">
          <h2 id="members-title" className="font-fraunces font-bold text-[24px] tracking-[-0.02em] text-black">{directory.length + 1} members</h2>
          <button ref={close} type="button" onClick={onClose} aria-label="Close" className="w-11 h-11 border-2 border-black flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <div className="px-4 py-4 flex flex-col gap-4 pb-10">
          <dl className="border-2 border-black bg-cream-dark px-4 py-3.5 grid grid-cols-2 gap-x-4 gap-y-3 m-0">
            {facts.map((f) => (
              <div key={f.k} className="flex flex-col gap-0.5 min-w-0">
                <dt className="font-inter font-bold text-[10px] tracking-[0.12em] uppercase text-black">{f.k}</dt>
                <dd className="m-0 font-inter text-[13px] text-[#3A372F]">{f.v}</dd>
              </div>
            ))}
          </dl>

          <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={filter === c.key}
                onClick={() => setFilter(c.key)}
                className={`min-h-[40px] px-3.5 border-2 border-black font-inter text-xs ${filter === c.key ? 'bg-black text-cream font-bold' : 'bg-cream text-black font-semibold'}`}
              >
                {c.text}
              </button>
            ))}
          </div>

          <ul className="list-none m-0 p-0 border-b border-black">
            {filter === 'all' && row(me, true)}
            {shown.map((m) => row(m, false))}
            {shown.length === 0 && filter !== 'all' && (
              <li className="py-4 border-t border-black font-inter text-sm text-warm">
                {filter === 'church' ? 'Nobody else from your church yet.' : 'Nobody else lives near you yet.'}
              </li>
            )}
          </ul>

          <button type="button" onClick={onInviteFriend} className="min-h-[48px] bg-black text-cream font-inter font-bold text-[13px] tracking-[0.06em] uppercase">
            Invite a friend to the group
          </button>
          {info.chatLink && (
            <a href={info.chatLink} target="_blank" rel="noopener noreferrer" className="self-center min-h-[40px] inline-flex items-center font-inter text-[13px] font-semibold underline underline-offset-4">
              Also on {outsideChatLabel(info.chatLink).replace(/ group$/, '')} ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
