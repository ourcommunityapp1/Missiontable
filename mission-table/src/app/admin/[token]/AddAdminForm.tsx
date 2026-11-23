'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addAdminAction } from './actions';

export default function AddAdminForm({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const res = await addAdminAction(token, name, email);
    setBusy(false);
    if (!res.success) { setMessage(res.error); return; }
    setMessage(res.emailed ? `Added. ${name.split(/\s+/)[0]} has been emailed their admin link.` : 'Added, but the welcome email could not be sent.');
    setName('');
    setEmail('');
    router.refresh();
  }

  const field = 'min-h-[44px] border-2 border-black bg-cream px-3 font-inter text-base outline-none w-full';
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 border-2 border-dashed border-black p-4">
      <p className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-black">Add an admin</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-inter text-xs text-warm">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={field} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-inter text-xs text-warm">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={field} />
        </label>
      </div>
      <button type="submit" disabled={busy} className="self-start min-h-[44px] px-5 bg-black text-cream font-inter font-bold text-[13px] tracking-[0.06em] uppercase disabled:opacity-50">
        {busy ? 'Adding…' : 'Add and email their link'}
      </button>
      {message && <p role="status" className="font-inter text-sm text-[#3A372F]">{message}</p>}
    </form>
  );
}
