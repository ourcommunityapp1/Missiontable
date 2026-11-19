'use client';

import { useState } from 'react';
import { sendMembersAppEmail } from '../actions';
import type { AppStats } from '@/lib/appEmail';

const btn = 'min-h-[44px] px-5 font-inter font-semibold text-[13px] tracking-[0.06em] uppercase';

/** Who has the group on their phone, and a one-click email to everyone else. */
export default function AppEmailSection({ token, groupId, stats }: { token: string; groupId: string; stats: AppStats }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [message, setMessage] = useState('');
  const pct = stats.members ? Math.round((stats.withApp / stats.members) * 100) : 0;
  const lastSent = stats.lastSent
    ? new Date(stats.lastSent.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  async function send() {
    if (!window.confirm(`Email ${stats.withoutApp} member${stats.withoutApp === 1 ? '' : 's'} how to put the group on their phone?`)) return;
    setStatus('sending');
    setMessage('');
    const res = await sendMembersAppEmail(token, groupId);
    if (!res.success) { setStatus('idle'); setMessage(res.error); return; }
    setStatus('done');
    setMessage(`Sent to ${res.sent} member${res.sent === 1 ? '' : 's'}.`);
  }

  return (
    <div className="border-2 border-black p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="font-inter text-base text-black">
          <strong className="font-fraunces text-[26px] align-[-2px]">{stats.withApp}</strong> of {stats.members} members have the group on their phone.
        </p>
        <div className="h-2 bg-[#E7E3DA]" aria-hidden="true"><div className="h-2 bg-black" style={{ width: `${pct}%` }} /></div>
        <p className="font-inter text-sm leading-relaxed text-[#3A372F]">
          Members with the app see messages, meals and “Are you in?” in one tap. The email shows the rest how, step by step for their phone. Counted from the first time someone opens it from their home screen.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void send()}
          disabled={stats.withoutApp === 0 || stats.sentToday || status !== 'idle'}
          className={`${btn} bg-black text-cream disabled:opacity-40`}
        >
          {status === 'sending' ? 'Sending…' : stats.withoutApp === 0 ? 'Everyone has it' : `Email the ${stats.withoutApp} without it`}
        </button>
        <a href={`/host/${token}/app-email?group=${groupId}`} target="_blank" rel="noopener noreferrer" className={`${btn} border-2 border-black inline-flex items-center`}>
          Preview email ↗
        </a>
      </div>
      {(message || lastSent) && (
        <p role="status" className="font-inter text-sm text-warm">
          {message || (stats.sentToday ? `Sent today to ${stats.lastSent!.recipients}. You can send again tomorrow.` : `Last sent ${lastSent} to ${stats.lastSent!.recipients}.`)}
        </p>
      )}
    </div>
  );
}
