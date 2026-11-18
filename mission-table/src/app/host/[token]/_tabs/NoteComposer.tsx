'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveHostNote } from '../actions';
import type { HostNoteState } from '@/lib/gathering';

const STARTERS: Record<'rsvp' | 'thanks', string[]> = {
  rsvp: ['This month we’re cooking ', 'Please pray with us for ', 'Feel free to bring a friend!'],
  thanks: ['Thank you for ', 'Please keep praying for ', 'Next month we’ll '],
};

function fmt(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

type Props = {
  token: string;
  groupId: string;
  note: HostNoteState;
  memberCount: number;
  autoMessages: boolean;
};

export default function NoteComposer({ token, groupId, note, memberCount, autoMessages }: Props) {
  const router = useRouter();
  const [body, setBody] = useState(note.body);
  const [sendDefault, setSendDefault] = useState(!note.skip);
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState('');
  const isRsvp = note.kind === 'rsvp';
  const id = `note-${note.kind}`;
  const sendTime = isRsvp ? '9:00 AM' : '6:00 PM';
  const title = isRsvp ? 'Your “Are you in?” note' : 'Your thank-you note';
  const subject = isRsvp
    ? `Are you in this ${fmt(note.meetingDate, { weekday: 'long' })}?`
    : `Thank you for ${fmt(note.meetingDate, { weekday: 'long' })}`;
  const effective = body.trim() || (sendDefault ? note.defaultBody : '');

  if (note.sentAt) {
    return (
      <section aria-labelledby={id} className="border-2 border-[#C9C3B5] bg-cream-dark p-6 flex flex-col gap-2">
        <p className="font-inter font-semibold text-[11px] tracking-[0.12em] uppercase text-warm">Sent {fmt(note.sentAt.slice(0, 10), { weekday: 'short', month: 'short', day: 'numeric' })}</p>
        <h3 id={id} className="font-fraunces font-semibold text-[22px] text-black">{title} for {fmt(note.meetingDate, { month: 'short', day: 'numeric' })}</h3>
        <p className="font-inter text-[15px] text-[#3A372F] whitespace-pre-line">{note.skip ? 'You chose not to send one.' : note.body || note.defaultBody}</p>
      </section>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setState('saving');
    const res = await saveHostNote(token, groupId, note.meetingDate, note.kind, body, !body.trim() && !sendDefault);
    if (!res.success) { setState('idle'); setError(res.error); return; }
    setState('saved');
    router.refresh();
  }

  return (
    <section aria-labelledby={id} className="border-2 border-black flex flex-wrap">
      <form onSubmit={save} className="flex-[999_1_480px] min-w-0 p-6 md:p-7 flex flex-col gap-4">
        <p className={`font-inter font-semibold text-[11px] tracking-[0.12em] uppercase ${autoMessages ? 'text-[#8A3A12]' : 'text-warm'}`}>
          {autoMessages
            ? `Goes out ${fmt(note.sendDate, { weekday: 'short', month: 'short', day: 'numeric' })} · ${sendTime} · to ${memberCount} member${memberCount === 1 ? '' : 's'}`
            : `For the ${fmt(note.meetingDate, { month: 'short', day: 'numeric' })} gathering · turn on automatic emails to send it`}
        </p>
        <h3 id={id} className="font-fraunces font-semibold text-[26px] md:text-[28px] leading-tight tracking-[-0.02em] text-black">{title}</h3>
        <p className="font-inter text-[15px] leading-normal text-warm">
          {isRsvp
            ? 'A few lines in your own words. Members answer with one tap, and replies come straight to your inbox.'
            : 'Thank everyone in your own words. It goes out with the group’s table photos and prayers.'}
        </p>
        <label htmlFor={`${id}-body`} className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-black">Your note</label>
        <textarea
          id={`${id}-body`}
          value={body}
          onChange={(e) => { setBody(e.target.value); setState('idle'); }}
          rows={6}
          maxLength={2000}
          placeholder={note.defaultBody}
          className="border-2 border-black bg-white p-3.5 font-inter text-base leading-relaxed outline-none resize-y"
        />
        <div className="flex flex-col gap-2">
          <span className="font-inter text-xs text-warm">Need a starting point?</span>
          <div className="flex flex-wrap gap-2">
            {STARTERS[note.kind].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setBody((b) => (b.trim() ? `${b.trimEnd()} ${s}` : s)); setState('idle'); }}
                className="min-h-[40px] px-3.5 border-2 border-black bg-cream font-inter text-[13px] hover:bg-cream-dark"
              >
                {s.endsWith(' ') ? `${s.trim()}…` : s}
              </button>
            ))}
          </div>
        </div>
        <label className="flex gap-3 items-start font-inter text-sm leading-snug cursor-pointer">
          <input type="checkbox" checked={sendDefault} onChange={(e) => { setSendDefault(e.target.checked); setState('idle'); }} className="w-5 h-5 mt-0.5 accent-black shrink-0" />
          <span>If I don&apos;t write one, send the standard note signed by me.</span>
        </label>
        {error && <p role="alert" className="font-inter text-sm text-[#8A3A12]">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={state === 'saving'} className="min-h-[48px] px-6 bg-black text-cream font-inter font-semibold text-[13px] tracking-[0.06em] uppercase disabled:opacity-60">
            {state === 'saving' ? 'Saving…' : 'Save note'}
          </button>
          {state === 'saved' && <span role="status" className="font-inter text-sm text-black">Saved.</span>}
        </div>
      </form>
      <aside aria-label="Email preview" className="flex-[1_1_320px] bg-cream-dark border-t-2 md:border-t-0 md:border-l-2 border-black p-6 flex flex-col gap-3">
        <span className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-warm">What members see</span>
        <div className="bg-white border border-[#C9C3B5] p-4 flex flex-col gap-2.5">
          <span className="font-inter text-xs text-warm">From you, via Mission Table</span>
          <span className="font-inter text-[15px] font-bold text-black">{subject}</span>
          {effective ? (
            <p className="font-inter text-[13px] leading-normal text-[#3A372F] whitespace-pre-line line-clamp-6">{effective}</p>
          ) : (
            <p className="font-inter text-[13px] italic text-warm">Nothing will be sent for this gathering.</p>
          )}
          {isRsvp && effective && (
            <div className="grid grid-cols-2 gap-2" aria-hidden="true">
              <span className="text-center py-2.5 bg-black text-cream text-xs font-bold">WE&apos;RE IN</span>
              <span className="text-center py-2 border-2 border-black text-xs font-bold">NOT THIS MONTH</span>
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
