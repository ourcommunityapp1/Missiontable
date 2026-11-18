'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { respondToInvite, cancelInvite, markInvitesSeen } from '../../loopActions';

type Calendar = { title: string; date: string; arrive: string; location: string; details: string };

function to24(t: string): [number, number] {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return [17, 30];
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return [h, Number(m[2])];
}

function icsHref(c: Calendar) {
  const [h, m] = to24(c.arrive);
  const d = c.date.replace(/-/g, '');
  const start = `${d}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
  const endH = Math.min(23, h + 2);
  const end = `${d}T${String(endH).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
  const esc = (s: string) => s.replace(/[\\,;]/g, (x) => `\\${x}`).replace(/\n/g, '\\n');
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mission Table//EN', 'BEGIN:VEVENT',
    `UID:${d}-${Math.random().toString(36).slice(2)}@missiontable.org`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${start}`, `DTEND:${end}`,
    `SUMMARY:${esc(c.title)}`, `LOCATION:${esc(c.location)}`, `DESCRIPTION:${esc(c.details)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

export function CopyAddress({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* ignore */ } }}
      className="min-h-[44px] inline-flex items-center font-inter text-sm font-semibold underline underline-offset-4"
    >
      {done ? 'Copied' : 'Copy address'}
    </button>
  );
}

type Props = {
  token: string; groupId: string; inviteId: string; isInviter: boolean;
  myStatus: 'invited' | 'accepted' | 'declined' | null; mySeen: boolean;
  calendar: Calendar; inviterFirst: string;
};

function InviteActions({ token, groupId, inviteId, isInviter, myStatus, mySeen, calendar, inviterFirst }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(myStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!isInviter && !mySeen) void markInvitesSeen(token, groupId, [inviteId]);
  }, [isInviter, mySeen, token, groupId, inviteId]);

  async function respond(next: 'accepted' | 'declined') {
    setBusy(true); setError('');
    const res = await respondToInvite(token, groupId, inviteId, next);
    setBusy(false);
    if (!res.success) return setError(res.error);
    setStatus(next);
    router.refresh();
  }

  if (isInviter) {
    return (
      <div className="flex flex-col gap-3">
        <a href={icsHref(calendar)} download="mission-table-dinner.ics" className="self-start min-h-[44px] inline-flex items-center font-inter text-sm font-semibold underline underline-offset-4">Add to calendar</a>
        {confirmCancel ? (
          <div className="border-2 border-black p-4 flex flex-col gap-3">
            <p className="font-inter text-sm">Cancel this invitation? Everyone you invited will get an email.</p>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={async () => { setBusy(true); const r = await cancelInvite(token, groupId, inviteId); setBusy(false); if (!r.success) setError(r.error); else router.refresh(); }} className="flex-1 min-h-[48px] bg-black text-cream font-inter font-bold text-sm">Yes, cancel it</button>
              <button type="button" onClick={() => setConfirmCancel(false)} className="flex-1 min-h-[48px] border-2 border-black font-inter font-semibold text-sm">Keep it</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmCancel(true)} className="self-start min-h-[44px] font-inter text-sm font-semibold text-[#8A3A12] underline underline-offset-4">Cancel invitation</button>
        )}
        {error && <p role="alert" className="font-inter text-sm text-[#8A3A12]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {status === 'accepted' && <p role="status" className="font-inter text-[15px] font-semibold text-black">You&apos;re going. {inviterFirst} will be glad to have you.</p>}
      {status === 'declined' && <p role="status" className="font-inter text-[15px] text-warm">You let {inviterFirst} know you can&apos;t make it.</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={busy} aria-pressed={status === 'accepted'} onClick={() => respond('accepted')} className={`min-h-[52px] font-inter font-bold text-sm tracking-[0.06em] uppercase border-2 border-black ${status === 'accepted' ? 'bg-black text-cream' : 'bg-cream text-black'}`}>
          {status === 'accepted' ? 'Accepted' : 'Accept'}
        </button>
        <button type="button" disabled={busy} aria-pressed={status === 'declined'} onClick={() => respond('declined')} className={`min-h-[52px] font-inter font-semibold text-sm border-2 border-black ${status === 'declined' ? 'bg-black text-cream' : 'bg-cream text-black'}`}>
          Can&apos;t make it
        </button>
      </div>
      {error && <p role="alert" className="font-inter text-sm text-[#8A3A12]">{error}</p>}
      <a href={icsHref(calendar)} download="mission-table-dinner.ics" className="self-center min-h-[44px] inline-flex items-center font-inter text-sm font-semibold underline underline-offset-4">Add to calendar</a>
    </div>
  );
}

export default InviteActions;
