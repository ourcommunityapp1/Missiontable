'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveGroupAction, declineGroupAction } from './actions';

/** Approve / Decline for a group waiting for review. */
export default function ReviewButtons({ token, groupId, groupName, hostEmail }: { token: string; groupId: string; groupName: string; hostEmail: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function run(kind: 'approve' | 'decline') {
    const ask = kind === 'approve'
      ? `Approve ${groupName}? It goes live on its country page and the host gets a "you're live" email.`
      : `Decline ${groupName}? It stays hidden and no email is sent. Reach out to the host yourself.`;
    if (!window.confirm(ask)) return;
    setBusy(true);
    setMessage('');
    const res = kind === 'approve' ? await approveGroupAction(token, groupId) : await declineGroupAction(token, groupId);
    setBusy(false);
    if (!res.success) { setMessage(res.error); return; }
    setMessage(kind === 'approve' ? (res.emailed ? 'Approved. The host has been emailed.' : 'Approved. The host email could not be sent; let them know yourself.') : 'Declined.');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void run('approve')} className="min-h-[44px] px-5 bg-black text-cream font-inter font-bold text-[13px] tracking-[0.06em] uppercase disabled:opacity-50">
          Approve
        </button>
        <button type="button" disabled={busy} onClick={() => void run('decline')} className="min-h-[44px] px-5 border-2 border-black font-inter font-semibold text-[13px] tracking-[0.06em] uppercase disabled:opacity-50">
          Decline
        </button>
        {hostEmail && (
          <a href={`mailto:${hostEmail}?subject=${encodeURIComponent(`Your Mission Table group: ${groupName}`)}`} className="min-h-[44px] px-4 inline-flex items-center font-inter text-[13px] font-semibold underline underline-offset-4">
            Email the host
          </a>
        )}
      </div>
      {message && <p role="status" className="font-inter text-sm text-[#3A372F]">{message}</p>}
    </div>
  );
}
